"use client";

import { X } from "lucide-react";
import type { JobItem } from "@/lib/site-content";

interface ApplyModalProps {
  job: JobItem | null;
  onClose: () => void;
}

export function ApplyModal({ job, onClose }: ApplyModalProps) {
  if (!job) return null;

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

        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="text"
            placeholder="Họ và tên"
            className="rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <input
            type="tel"
            placeholder="Số điện thoại"
            className="rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <input
            type="email"
            placeholder="Email"
            className="rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <p className="text-xs text-black/40">
            Đây là bản demo giao diện — biểu mẫu không gửi dữ liệu tới máy chủ thật.
          </p>
          <button
            type="submit"
            className="mt-1 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
          >
            Gửi hồ sơ
          </button>
        </form>
      </div>
    </div>
  );
}
