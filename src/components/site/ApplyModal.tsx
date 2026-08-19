"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import type { JobItem } from "@/lib/site-content";

interface ApplyModalProps {
  job: JobItem | null;
  onClose: () => void;
}

type Status = "idle" | "submitting" | "success" | "error";

const MAX_CV_SIZE = 10 * 1024 * 1024; // 10MB

export function ApplyModal({ job, onClose }: ApplyModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!job) return null;

  const needsLocationChoice = job.location.length > 1;

  function toggleLocation(loc: string) {
    setPreferredLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc],
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_CV_SIZE) {
      setError("File CV vượt quá 10MB, vui lòng chọn file nhỏ hơn.");
      setCvFile(null);
      e.target.value = "";
      return;
    }
    setError(null);
    setCvFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!job) return;
    if (needsLocationChoice && preferredLocations.length === 0) {
      setError("Vui lòng chọn ít nhất một địa điểm mong muốn.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("phone", phone);
      formData.set("email", email);
      formData.set("position", job.title);
      const locations = needsLocationChoice ? preferredLocations : job.location;
      if (locations.length > 0) formData.set("location", locations.join(", "));
      if (cvFile) formData.set("cv", cvFile);

      const res = await fetch("/api/apply", { method: "POST", body: formData });
      if (!res.ok) throw new Error("submit_failed");
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Gửi hồ sơ thất bại, vui lòng thử lại sau.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              Ứng tuyển
            </p>
            <h3 className="mt-1 text-lg font-bold text-black">{job.title}</h3>
            <p className="mt-0.5 text-sm text-black/50">{job.location.join(", ")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-1.5 text-black/40 hover:bg-black/5 hover:text-black"
          >
            <X className="size-4" />
          </button>
        </div>

        {status === "success" ? (
          <div className="mt-6 flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-base font-bold text-black">Đã gửi hồ sơ thành công!</p>
            <p className="text-sm text-black/50">
              Cảm ơn bạn đã ứng tuyển. Bộ phận nhân sự sẽ liên hệ sớm nhất.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 rounded-full bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-dark"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form className="mt-5 flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Họ và tên"
              className="rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Số điện thoại"
              className="rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />

            {needsLocationChoice && (
              <div className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-black/70">Địa điểm mong muốn</span>
                <div className="flex flex-col gap-2 rounded-lg border border-black/10 px-3 py-2.5">
                  {job.location.map((loc) => (
                    <label
                      key={loc}
                      className="flex items-center gap-2.5 text-sm text-black/80"
                    >
                      <input
                        type="checkbox"
                        checked={preferredLocations.includes(loc)}
                        onChange={() => toggleLocation(loc)}
                        className="size-4 rounded border-black/20 accent-brand"
                      />
                      {loc}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-black/20 px-3 py-2.5 text-left text-sm text-black/60 hover:border-brand hover:text-brand"
            >
              <Paperclip className="size-4 shrink-0" />
              <span className="truncate">
                {cvFile ? cvFile.name : "Đính kèm CV (PDF, DOC, DOCX)"}
              </span>
            </button>

            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-1 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "submitting" ? "Đang gửi..." : "Gửi hồ sơ"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
