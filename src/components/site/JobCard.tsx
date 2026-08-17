"use client";

import { CalendarDays, MapPin } from "lucide-react";
import type { JobItem } from "@/lib/site-content";

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
      className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-black/5 bg-white p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            {job.department}
          </span>
          {job.employmentType.map((type) => (
            <span
              key={type}
              className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/60"
            >
              {type}
            </span>
          ))}
        </div>
        <h4 className="mt-2.5 text-base font-bold text-black">{job.title}</h4>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-black/50">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {job.location.join(", ")}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            Hạn nộp: {job.deadline}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-2">
        <span className="text-sm font-bold text-brand">{job.salary}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onApply(job);
          }}
          className="rounded-full bg-brand px-5 py-2 text-xs font-bold tracking-wide text-white transition-colors hover:bg-brand-dark"
        >
          ỨNG TUYỂN
        </button>
      </div>
    </div>
  );
}
