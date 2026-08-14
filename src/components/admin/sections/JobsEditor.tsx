"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useSiteContent } from "@/lib/site-content-context";
import type { JobItem } from "@/lib/site-content";
import { JobFormModal } from "./JobFormModal";

export function JobsEditor() {
  const { content, updateJobs } = useSiteContent();
  const [editingJob, setEditingJob] = useState<JobItem | null | "new">(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);

  async function saveJob(job: JobItem) {
    const isNew = job.id === 0;
    const finalJob = isNew ? { ...job, id: Date.now() } : job;
    setError(null);
    setSavingId(isNew ? "new" : finalJob.id);
    try {
      await updateJobs((jobs) =>
        isNew
          ? [finalJob, ...jobs]
          : jobs.map((j) => (j.id === finalJob.id ? finalJob : j)),
      );
      setEditingJob(null);
    } catch {
      setError("Không lưu được lên máy chủ. Kiểm tra kết nối mạng và thử lại.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteJob(id: number) {
    if (!window.confirm("Xoá tin tuyển dụng này?")) return;
    setError(null);
    setSavingId(id);
    try {
      await updateJobs((jobs) => jobs.filter((j) => j.id !== id));
    } catch {
      setError("Không xoá được trên máy chủ. Kiểm tra kết nối mạng và thử lại.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-black">Danh sách việc làm</h2>
          <p className="mt-1 text-sm text-black/50">
            Thêm, sửa hoặc xoá tin tuyển dụng hiển thị trên trang chủ.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingJob("new")}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
        >
          <Plus className="size-4" />
          Thêm việc làm
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {content.jobs.length === 0 && (
          <p className="rounded-xl border border-dashed border-black/10 py-8 text-center text-sm text-black/40">
            Chưa có tin tuyển dụng nào. Bấm &ldquo;Thêm việc làm&rdquo; để bắt đầu.
          </p>
        )}
        {content.jobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-col gap-3 rounded-xl border border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-semibold text-blue-600">
                  {job.department}
                </span>
                <span className="rounded-full bg-black/5 px-2.5 py-0.5 font-semibold text-black/60">
                  {job.employmentType}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-bold text-black">{job.title}</p>
              <p className="mt-0.5 text-xs text-black/50">
                {job.location} · Hạn nộp {job.deadline} · {job.salary}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setEditingJob(job)}
                aria-label="Sửa"
                disabled={savingId === job.id}
                className="flex size-8 items-center justify-center rounded-lg border border-black/10 text-black/60 hover:bg-black/5 disabled:opacity-40"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteJob(job.id)}
                aria-label="Xoá"
                disabled={savingId === job.id}
                className="flex size-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingJob && (
        <JobFormModal
          initial={editingJob === "new" ? null : editingJob}
          saving={savingId === "new" || savingId === (editingJob === "new" ? "new" : editingJob.id)}
          onSave={saveJob}
          onClose={() => setEditingJob(null)}
        />
      )}
    </div>
  );
}
