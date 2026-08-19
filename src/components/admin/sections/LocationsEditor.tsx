"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useSiteContent } from "@/lib/site-content-context";
import type { LocationItem } from "@/lib/site-content";

export function LocationsEditor() {
  const { content, updateLocations } = useSiteContent();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [nameDrafts, setNameDrafts] = useState<Record<number, string>>({});

  async function run(action: (locations: LocationItem[]) => LocationItem[], id: number | "new") {
    setError(null);
    setSavingId(id);
    try {
      await updateLocations(action);
    } catch {
      setError("Không lưu được lên máy chủ. Kiểm tra kết nối mạng và thử lại.");
    } finally {
      setSavingId(null);
    }
  }

  async function addLocation() {
    const name = newName.trim();
    if (!name) return;
    await run((locations) => [...locations, { id: Date.now(), name }], "new");
    setNewName("");
  }

  async function deleteLocation(id: number) {
    if (
      !window.confirm(
        "Xoá địa điểm này? Nếu có tin tuyển dụng đang gắn địa điểm này, nó sẽ bị bỏ khỏi tin đó.",
      )
    ) {
      return;
    }
    await run((locations) => locations.filter((l) => l.id !== id), id);
  }

  async function toggleHidden(id: number) {
    await run(
      (locations) => locations.map((l) => (l.id === id ? { ...l, hidden: !l.hidden } : l)),
      id,
    );
  }

  async function renameLocation(id: number) {
    const name = (nameDrafts[id] ?? "").trim();
    if (!name) return;
    await run((locations) => locations.map((l) => (l.id === id ? { ...l, name } : l)), id);
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-black">Địa điểm làm việc</h2>
      <p className="mt-1 text-sm text-black/50">
        Danh sách địa điểm để chọn khi tạo tin tuyển dụng, và để ứng viên chọn nơi mong muốn
        làm việc khi ứng tuyển.
      </p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addLocation();
        }}
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Tên địa điểm mới, ví dụ: Phường Đông Sơn"
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={savingId === "new" || newName.trim() === ""}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-4" />
          Thêm
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {content.locations.length === 0 && (
          <p className="rounded-xl border border-dashed border-black/10 py-8 text-center text-sm text-black/40">
            Chưa có địa điểm nào. Thêm địa điểm đầu tiên ở trên.
          </p>
        )}
        {content.locations.map((loc) => (
          <div
            key={loc.id}
            className={
              "flex items-center gap-2 rounded-xl border p-3 " +
              (loc.hidden ? "border-black/10 bg-black/[0.02] opacity-60" : "border-black/10")
            }
          >
            <input
              type="text"
              defaultValue={loc.name}
              onChange={(e) => setNameDrafts((d) => ({ ...d, [loc.id]: e.target.value }))}
              onBlur={() => renameLocation(loc.id)}
              disabled={savingId === loc.id}
              className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium text-black outline-none hover:border-black/10 focus:border-brand disabled:opacity-40"
            />
            {loc.hidden && (
              <span className="shrink-0 rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-semibold text-white">
                Đã ẩn
              </span>
            )}
            <button
              type="button"
              onClick={() => toggleHidden(loc.id)}
              aria-label={loc.hidden ? "Hiện lại" : "Ẩn"}
              title={loc.hidden ? "Hiện lại để có thể chọn khi tạo tin" : "Ẩn khỏi danh sách chọn"}
              disabled={savingId === loc.id}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-black/10 text-black/60 hover:bg-black/5 disabled:opacity-40"
            >
              {loc.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => deleteLocation(loc.id)}
              aria-label="Xoá"
              disabled={savingId === loc.id}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
