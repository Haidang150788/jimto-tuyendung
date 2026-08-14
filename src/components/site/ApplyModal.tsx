"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { JobItem } from "@/lib/site-content";

interface ApplyModalProps {
  job: JobItem | null;
  onClose: () => void;
}

type Status = "idle" | "submitting" | "success" | "error";

export function ApplyModal({ job, onClose }: ApplyModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  if (!job) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!job) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, position: job.title }),
      });
      if (!res.ok) throw new Error("submit_failed");
      setStatus("success");
    } catch {
      setStatus("error");
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
            <p className="mt-0.5 text-sm text-black/50">{job.location}</p>
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
            {status === "error" && (
              <p className="text-xs font-medium text-red-500">
                Gửi hồ sơ thất bại, vui lòng thử lại sau.
              </p>
            )}
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
