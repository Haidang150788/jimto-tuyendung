"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, ExternalLink, RotateCcw } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { useSiteContent } from "@/lib/site-content-context";
import { clearAdminToken } from "@/lib/admin-auth";
import { JobsEditor } from "./sections/JobsEditor";
import { LocationsEditor } from "./sections/LocationsEditor";

const TABS = [
  { key: "jobs", label: "Việc làm" },
  { key: "locations", label: "Địa điểm" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { resetJobsToDefault } = useSiteContent();
  const [tab, setTab] = useState<TabKey>("jobs");

  function handleLogout() {
    clearAdminToken();
    onLogout();
  }

  async function handleReset() {
    if (
      !window.confirm(
        "Khôi phục danh sách việc làm về mặc định? Thao tác này không thể hoàn tác.",
      )
    ) {
      return;
    }
    try {
      await resetJobsToDefault();
    } catch {
      window.alert("Không lưu được lên máy chủ, thử lại sau.");
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 sm:px-6">
        <Logo className="h-8 w-auto" />
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-black/60 hover:bg-black/5"
          >
            <ExternalLink className="size-4" />
            Xem trang web
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-black/60 hover:bg-black/5"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <nav className="mb-4 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                t.key === tab
                  ? "rounded-full bg-brand px-4 py-2 text-sm font-bold text-white"
                  : "rounded-full px-4 py-2 text-sm font-medium text-black/60 hover:bg-black/5"
              }
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="rounded-2xl border border-black/5 bg-white p-6">
          {tab === "jobs" && (
            <>
              <JobsEditor />
              <div className="mt-8 border-t border-black/5 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  <RotateCcw className="size-4" />
                  Khôi phục danh sách mặc định
                </button>
              </div>
            </>
          )}
          {tab === "locations" && <LocationsEditor />}
        </div>
      </div>
    </div>
  );
}
