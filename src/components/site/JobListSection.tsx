"use client";

import { useState } from "react";
import { useSiteContent } from "@/lib/site-content-context";
import type { JobItem } from "@/lib/site-content";
import { JobCard } from "./JobCard";
import { JobDetailModal } from "./JobDetailModal";
import { ApplyModal } from "./ApplyModal";

export function JobListSection() {
  const { content } = useSiteContent();
  const [page, setPage] = useState(1);
  const [viewingJob, setViewingJob] = useState<JobItem | null>(null);
  const [applyingTo, setApplyingTo] = useState<JobItem | null>(null);

  return (
    <section id="viec-lam" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-black sm:text-3xl">
          Danh Sách Việc Làm Mới Nhất
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-black/50">
          Ứng tuyển nhanh chóng để nhận phản hồi từ bộ phận nhân sự trong vòng 24 giờ
        </p>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between text-sm text-black/50">
          <span>
            Tìm thấy <strong className="text-black">{content.jobs.length}</strong> công
            việc
          </span>
          <span className="flex items-center gap-2">
            Sắp xếp theo:
            <select
              defaultValue="newest"
              className="rounded-md border border-black/10 px-2 py-1 text-sm text-black/70 outline-none"
            >
              <option value="newest">Mới nhất</option>
            </select>
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {content.jobs.length > 0 ? (
            content.jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onView={setViewingJob}
                onApply={setApplyingTo}
              />
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-black/10 py-10 text-center text-sm text-black/40">
              Hiện chưa có tin tuyển dụng nào.
            </p>
          )}
        </div>

        <nav className="mt-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={
                p === page
                  ? "flex size-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
                  : "flex size-8 items-center justify-center rounded-full text-sm font-medium text-black/60 hover:bg-black/5"
              }
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(3, p + 1))}
            className="ml-1 rounded-full px-3 py-1.5 text-sm font-medium text-black/60 hover:bg-black/5"
          >
            Tiếp
          </button>
        </nav>
        {page !== 1 && (
          <p className="mt-3 text-center text-xs text-black/30">
            Bản demo chỉ hiển thị dữ liệu thật của trang 1.
          </p>
        )}
      </div>

      <JobDetailModal
        job={viewingJob}
        onClose={() => setViewingJob(null)}
        onApply={(job) => {
          setViewingJob(null);
          setApplyingTo(job);
        }}
      />
      <ApplyModal
        key={applyingTo?.id ?? "none"}
        job={applyingTo}
        onClose={() => setApplyingTo(null)}
      />
    </section>
  );
}
