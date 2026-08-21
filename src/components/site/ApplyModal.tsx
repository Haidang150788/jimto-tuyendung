"use client";

import { useRef, useState } from "react";
import { Check, Copy, Paperclip, X } from "lucide-react";
import type { JobItem } from "@/lib/site-content";
import { isSalesPositionTitle, SALES_STEP2_FIELDS } from "@/lib/sales-application-form";

interface ApplyModalProps {
  job: JobItem | null;
  onClose: () => void;
}

type Status = "idle" | "submitting" | "success" | "error";

const MAX_CV_SIZE = 10 * 1024 * 1024; // 10MB

// Left blank until a dedicated Zalo number/account is set up (see
// ZALO_AUTOMATION.md) — the CTA below only renders once this is real.
const ZALO_BOT_PHONE = process.env.NEXT_PUBLIC_ZALO_BOT_PHONE;

// zalo.me profile links expect the international format (84…, no leading 0,
// no plus) — the env var is kept in the human-friendly local format.
const ZALO_BOT_LINK = ZALO_BOT_PHONE
  ? `https://zalo.me/84${ZALO_BOT_PHONE.replace(/\D/g, "").replace(/^0/, "")}`
  : null;

export function ApplyModal({ job, onClose }: ApplyModalProps) {
  const isSalesPosition = job ? isSalesPositionTitle(job.title) : false;

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"Nam" | "Nữ" | "">("");
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [step2Answers, setStep2Answers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [phoneCopied, setPhoneCopied] = useState(false);

  async function copyZaloPhone() {
    if (!ZALO_BOT_PHONE) return;
    try {
      await navigator.clipboard.writeText(ZALO_BOT_PHONE);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (rare, old browsers) — the number is
      // already shown as plain text, so the candidate can select it by hand.
    }
  }
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

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (needsLocationChoice && preferredLocations.length === 0) {
      setError("Vui lòng chọn ít nhất một địa điểm mong muốn.");
      return;
    }
    setError(null);
    setStep(2);
  }

  async function submit(step2: Record<string, string> | null) {
    if (!job) return;
    setStatus("submitting");
    setError(null);
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("phone", phone);
      formData.set("email", email);
      formData.set("gender", gender);
      formData.set("position", job.title);
      const locations = needsLocationChoice ? preferredLocations : job.location;
      if (locations.length > 0) formData.set("location", locations.join(", "));
      if (cvFile) formData.set("cv", cvFile);
      if (step2) formData.set("step2", JSON.stringify(step2));

      const res = await fetch("/api/apply", { method: "POST", body: formData });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "submit_failed");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error && err.message === "email_required"
          ? "Vui lòng nhập email, hoặc đính kèm CV có ghi rõ địa chỉ email."
          : "Gửi hồ sơ thất bại, vui lòng thử lại sau.",
      );
    }
  }

  function handleSimpleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needsLocationChoice && preferredLocations.length === 0) {
      setError("Vui lòng chọn ít nhất một địa điểm mong muốn.");
      return;
    }
    if (!email.trim() && !cvFile) {
      setError("Vui lòng nhập email, hoặc đính kèm CV có ghi rõ địa chỉ email.");
      return;
    }
    if (!gender) {
      setError("Vui lòng chọn giới tính.");
      return;
    }
    submit(null);
  }

  function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    const missing = SALES_STEP2_FIELDS.find(
      (f) => f.required && !(step2Answers[f.key] ?? "").trim(),
    );
    if (missing) {
      setError(`Vui lòng điền: "${missing.label}"`);
      return;
    }
    submit(step2Answers);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
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
            className="shrink-0 rounded-full p-1.5 text-black/40 hover:bg-black/5 hover:text-black"
          >
            <X className="size-4" />
          </button>
        </div>

        {status === "success" ? (
          <div className="mt-6 flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-base font-bold text-black">Đã gửi hồ sơ thành công!</p>

            {isSalesPosition && ZALO_BOT_LINK ? (
              <>
                <p className="mt-1 text-sm text-black/70">
                  &quot;Gửi lời chào đến thư ký tuyển dụng Minh Phương để cập nhật liên tục tình
                  hình ứng tuyển bạn nhé&quot;
                </p>
                <p className="text-xs text-black/40">
                  Chỉ cần nhắn &quot;Xin chào&quot; hoặc thả 1 biểu tượng cảm xúc bất kỳ — Minh
                  Phương sẽ chủ động bắt chuyện với bạn.
                </p>
                <a
                  href={ZALO_BOT_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex animate-bounce items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand/30 hover:bg-brand-dark"
                >
                  💬 Bấm vào đây
                </a>

                <div className="mt-1 flex flex-col items-center gap-1.5 text-xs text-black/40">
                  <span>
                    Nếu Zalo không tự mở, mở app Zalo và tìm số{" "}
                    <strong className="text-black/60">{ZALO_BOT_PHONE}</strong>, nhắn &quot;Xin
                    chào&quot; nhé.
                  </span>
                  <button
                    type="button"
                    onClick={copyZaloPhone}
                    className="flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 font-semibold text-black/60 hover:bg-black/5"
                  >
                    {phoneCopied ? (
                      <>
                        <Check className="size-3.5" /> Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" /> Sao chép số điện thoại
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 rounded-full px-5 py-2 text-sm font-bold text-black/50 hover:bg-black/5"
                >
                  Để sau
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        ) : isSalesPosition && step === 2 ? (
          <form className="mt-5 flex flex-col gap-4" onSubmit={handleStep2Submit}>
            {SALES_STEP2_FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-black/70">
                  {field.label}
                  {field.required && <span className="ml-0.5 text-brand">*</span>}
                </span>
                {field.hint && <span className="text-xs text-black/40">{field.hint}</span>}

                {field.type === "radio" ? (
                  <div className="flex flex-col gap-2">
                    {field.options?.map((opt) => (
                      <label
                        key={opt}
                        className={
                          "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm " +
                          (step2Answers[field.key] === opt
                            ? "border-brand bg-brand/5 text-black"
                            : "border-black/10 text-black/70")
                        }
                      >
                        <input
                          type="radio"
                          name={field.key}
                          checked={step2Answers[field.key] === opt}
                          onChange={() =>
                            setStep2Answers((prev) => ({ ...prev, [field.key]: opt }))
                          }
                          className="size-4 accent-brand"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : field.type === "date" ? (
                  <input
                    type="date"
                    value={step2Answers[field.key] ?? ""}
                    onChange={(e) =>
                      setStep2Answers((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
                  />
                ) : (
                  <input
                    type="text"
                    value={step2Answers[field.key] ?? ""}
                    onChange={(e) =>
                      setStep2Answers((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
                  />
                )}
              </div>
            ))}

            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold text-black/60 hover:bg-black/5"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="flex-1 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "submitting" ? "Đang gửi..." : "Gửi hồ sơ"}
              </button>
            </div>
          </form>
        ) : (
          <form
            className="mt-5 flex flex-col gap-3"
            onSubmit={isSalesPosition ? handleContinue : handleSimpleSubmit}
          >
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
            {!isSalesPosition && (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (hoặc để trống nếu CV đã có email)"
                  className="rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
                <div className="flex gap-4 px-1 text-sm text-black/70">
                  {(["Nam", "Nữ"] as const).map((g) => (
                    <label key={g} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === g}
                        onChange={() => setGender(g)}
                        className="size-4 accent-brand"
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </>
            )}

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

            {!isSalesPosition && (
              <>
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
              </>
            )}

            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-1 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "submitting"
                ? "Đang gửi..."
                : isSalesPosition
                  ? "Tiếp tục"
                  : "Gửi hồ sơ"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
