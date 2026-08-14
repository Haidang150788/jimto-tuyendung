"use client";

import { useState } from "react";
import { Logo } from "@/components/site/Logo";
import { setAdminToken } from "@/lib/admin-auth";

export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAdminToken(password);
        onSuccess();
      } else if (res.status === 500) {
        setError("Server chưa cấu hình mật khẩu quản trị (thiếu biến ADMIN_PASSWORD).");
      } else {
        setError("Sai mật khẩu, thử lại nhé.");
      }
    } catch {
      setError("Không kết nối được tới máy chủ, thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <Logo className="h-9 w-auto" />
        <h1 className="mt-6 text-lg font-bold text-black">Đăng nhập quản trị</h1>
        <p className="mt-1 text-sm text-black/50">
          Dành cho nhân sự HR quản lý nội dung website.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="Mật khẩu"
            className="rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? "Đang kiểm tra..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
