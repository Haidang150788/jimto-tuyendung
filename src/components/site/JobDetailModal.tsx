"use client";

import { CalendarDays, MapPin, X } from "lucide-react";
import type { JobItem } from "@/lib/site-content";

interface JobDetailModalProps {
  job: JobItem | null;
  onClose: () => void;
  onApply: (job: JobItem) => void;
}

export function JobDetailModal({ job, onClose, onApply }: JobDetailModalProps) {
  if (!job) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                {job.department}
              </span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/60">
                {job.employmentType}
              </span>
            </div>
            <h3 className="mt-2.5 text-xl font-bold text-black">{job.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-black/50">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                Hạn nộp: {job.deadline}
              </span>
            </div>
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

        <p className="mt-4 text-sm font-bold text-brand">{job.salary}</p>

        {job.description && (
          <section className="mt-5">
            <h4 className="text-sm font-bold uppercase tracking-wide text-black/70">
              Mô tả công việc
            </h4>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black/60">
              {job.description}
            </p>
          </section>
        )}

        {job.requirements && (
          <section className="mt-5">
            <h4 className="text-sm font-bold uppercase tracking-wide text-black/70">
              Yêu cầu ứng viên
            </h4>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black/60">
              {job.requirements}
            </p>
          </section>
        )}

        {job.benefits && (
          <section className="mt-5">
            <h4 className="text-sm font-bold uppercase tracking-wide text-black/70">
              Quyền lợi & đãi ngộ
            </h4>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black/60">
              {job.benefits}
            </p>
          </section>
        )}

        <button
          type="button"
          onClick={() => onApply(job)}
          className="mt-6 w-full rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          ỨNG TUYỂN
        </button>
      </div>
    </div>
  );
}
