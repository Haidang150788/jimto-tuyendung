import { NextRequest, NextResponse } from "next/server";
import { sendLarkAlert } from "@/lib/lark-alert";

// Receives the one-shot report from IN_APP_BROWSER_GUARD_SCRIPT when a
// visitor's browser never hydrated the app (dead "ỨNG TUYỂN" buttons) and
// forwards it to the Lark alert group, so HR/dev see which in-app browsers
// break with the real user agent instead of guessing from screenshots.
// Public and unauthenticated by nature, so: cap field lengths and throttle
// per server instance to keep a bot from flooding the group.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;
let windowStart = 0;
let sentInWindow = 0;

const REASONS: Record<string, string> = {
  tap_before_ready: "bấm nút khi trang chưa chạy được",
  not_ready_after_15s: "sau 15 giây trang vẫn chưa chạy được",
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    reason?: unknown;
    ua?: unknown;
    url?: unknown;
    secs?: unknown;
    errors?: unknown;
  } | null;
  if (!body || typeof body.reason !== "string" || !(body.reason in REASONS)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    sentInWindow = 0;
  }
  if (sentInWindow >= MAX_PER_WINDOW) {
    return NextResponse.json({ ok: true, throttled: true });
  }
  sentInWindow++;

  const ua = String(body.ua ?? "").slice(0, 400);
  const url = String(body.url ?? "").slice(0, 200);
  const errors = Array.isArray(body.errors)
    ? body.errors.slice(0, 5).map((e) => String(e).slice(0, 300))
    : [];

  console.error("[client-report]", body.reason, ua, errors);
  await sendLarkAlert(
    `Ứng viên mở web nhưng nút ỨNG TUYỂN không chạy (${REASONS[body.reason]}, ${Number(body.secs) || 0}s). ` +
      `Đã hiện hướng dẫn mở bằng Chrome/Safari.\nTrình duyệt: ${ua}\nTrang: ${url}` +
      (errors.length > 0 ? `\nLỗi JS: ${errors.join(" | ")}` : ""),
  );
  return NextResponse.json({ ok: true });
}
