"use client";

import { CalendarDays, MapPin } from "lucide-react";
import type { JobItem } from "@/lib/site-content";
import { summarizeList } from "@/lib/format";

interface JobCardProps {
  job: JobItem;
  onView: (job: JobItem) => void;
  onApply: (job: JobItem) => void;
}

export function JobCard({ job, onView, onApply }: JobCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(job)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(job);
        }
      }}
      className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 transition-shadow hover:shadow-md sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
          {job.department}
        </span>
        {job.employmentType.map((type) => (
          <span
            key={type}
            className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-black/60"
          >
            {type}
          </span>
        ))}
      </div>

      <h4 className="text-base font-bold text-black">{job.title}</h4>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/50">
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{summarizeList(job.location)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          Hạn nộp: {job.deadline}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/5 pt-3">
        <span className="text-sm font-bold text-brand">{job.salary}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onApply(job);
          }}
          className="shrink-0 rounded-full bg-brand px-5 py-2 text-xs font-bold tracking-wide text-white transition-colors hover:bg-brand-dark"
        >
          ỨNG TUYỂN
        </button>
      </div>
    </div>
  );
}
