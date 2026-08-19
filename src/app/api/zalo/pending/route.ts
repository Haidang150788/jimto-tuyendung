import { NextRequest, NextResponse } from "next/server";
import { popZaloJob } from "@/lib/zalo-queue";

// Polled by the always-on Zalo bot (a separate Node process — see
// ZALO_AUTOMATION.md) every POLL_INTERVAL_MS. Pops and returns at most one
// queued job; { job: null } means the queue is empty right now.
export async function GET(req: NextRequest) {
  const expected = process.env.ZALO_WEBHOOK_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const job = await popZaloJob();
    return NextResponse.json({ job });
  } catch (err) {
    console.error("[api/zalo/pending] Failed to pop job:", err);
    return NextResponse.json({ error: "pop_failed" }, { status: 502 });
  }
}
