"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  JOB_DEPARTMENTS as DEPARTMENTS,
  JOB_EMPLOYMENT_TYPES as EMPLOYMENT_TYPES,
  type JobItem,
} from "@/lib/site-content";
import { useSiteContent } from "@/lib/site-content-context";
import { TextField, TextAreaField, CheckboxGroupField } from "../fields";

interface JobFormModalProps {
  initial: JobItem | null;
  saving?: boolean;
  onSave: (job: JobItem) => void;
  onClose: () => void;
}

export function JobFormModal({ initial, saving, onSave, onClose }: JobFormModalProps) {
  const { content } = useSiteContent();
  // Hidden locations stay off the pick list (so they can't be added to a new
  // job) but a job that already has one keeps it — see LOCATION_OPTIONS below.
  const visibleLocationNames = content.locations
    .filter((l) => !l.hidden)
    .map((l) => l.name);

  const [draft, setDraft] = useState<JobItem>(
    initial
      ? {
          ...initial,
          // Drop any stale free-text values from before these fields were
          // closed lists — otherwise they'd silently ride along on save.
          employmentType: initial.employmentType.filter((t) => EMPLOYMENT_TYPES.includes(t)),
        }
      : {
          id: 0,
          title: "",
          department: DEPARTMENTS[0],
          employmentType: [EMPLOYMENT_TYPES[0]],
          location: [],
          deadline: "",
          salary: "",
          description: "",
          requirements: "",
          benefits: "",
        },
  );

  // Union of currently-visible locations and whatever this job already has
  // (which may include a now-hidden one) so nothing checked disappears from
  // the list — it just can't be newly added once hidden.
  const locationOptions = Array.from(new Set([...visibleLocationNames, ...draft.location]));

  const isValid =
    draft.title.trim() !== "" &&
    draft.location.length > 0 &&
    draft.employmentType.length > 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-black">
            {initial ? "Sửa tin tuyển dụng" : "Thêm tin tuyển dụng"}
          </h3>
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
          onSubmit={(e) => {
            e.preventDefault();
            if (isValid) onSave(draft);
          }}
        >
          <TextField
            label="Vị trí tuyển dụng"
            value={draft.title}
            onChange={(v) => setDraft({ ...draft, title: v })}
            placeholder="Ví dụ: Nhân viên bán hàng"
          />

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-black/70">Khối công việc</span>
            <select
              value={draft.department}
              onChange={(e) => setDraft({ ...draft, department: e.target.value })}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm text-black outline-none focus:border-brand"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <CheckboxGroupField
            label="Hình thức làm việc"
            options={EMPLOYMENT_TYPES}
            value={draft.employmentType}
            onChange={(v) => setDraft({ ...draft, employmentType: v })}
          />

          {locationOptions.length > 0 ? (
            <CheckboxGroupField
              label="Địa điểm"
              options={locationOptions}
              value={draft.location}
              onChange={(v) => setDraft({ ...draft, location: v })}
            />
          ) : (
            <p className="text-xs font-medium text-black/40">
              Chưa có địa điểm nào. Sang tab &ldquo;Địa điểm&rdquo; để thêm trước.
            </p>
          )}
          <TextField
            label="Hạn nộp (dd/mm/yyyy)"
            value={draft.deadline}
            onChange={(v) => setDraft({ ...draft, deadline: v })}
            placeholder="31/12/2026"
          />
          <TextField
            label="Mức lương"
            value={draft.salary}
            onChange={(v) => setDraft({ ...draft, salary: v })}
            placeholder="10 Triệu - 15 Triệu"
          />

          <div className="mt-2 border-t border-black/5 pt-3">
            <p className="mb-3 text-xs font-semibold text-black/40">
              Không hiện ở trang chủ — chỉ hiện khi ứng viên bấm vào xem chi tiết công việc.
            </p>
          </div>

          <TextAreaField
            label="Mô tả công việc"
            value={draft.description}
            onChange={(v) => setDraft({ ...draft, description: v })}
            placeholder="Mô tả ngắn gọn công việc cần làm..."
          />
          <TextAreaField
            label="Yêu cầu ứng viên"
            value={draft.requirements}
            onChange={(v) => setDraft({ ...draft, requirements: v })}
            placeholder={"Mỗi ý một dòng, ví dụ:\n- Tốt nghiệp Đại học...\n- Có kinh nghiệm..."}
          />
          <TextAreaField
            label="Quyền lợi & đãi ngộ"
            value={draft.benefits}
            onChange={(v) => setDraft({ ...draft, benefits: v })}
            placeholder={"Mỗi ý một dòng, ví dụ:\n- Lương thoả thuận...\n- Bảo hiểm sức khoẻ..."}
          />

          <button
            type="submit"
            disabled={!isValid || saving}
            className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Đang lưu..." : initial ? "Lưu thay đổi" : "Thêm việc làm"}
          </button>
        </form>
      </div>
    </div>
  );
}
