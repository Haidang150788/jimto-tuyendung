import { NextRequest, NextResponse } from "next/server";
import { pushZaloJob } from "@/lib/zalo-queue";

// Called by a Lark Base Automation webhook action when HR changes a
// candidate's status in "(NEW) Form tuyển dụng" — see ZALO_AUTOMATION.md.
// Mirrors /api/email/notify but keyed by phone (sales candidates have no
// email) and queues the job for the always-on Zalo bot to pick up, instead
// of sending anything itself.
export async function POST(req: NextRequest) {
  const expected = process.env.ZALO_WEBHOOK_SECRET;
  const body = (await req.json().catch(() => null)) as {
    secret?: string;
    type?: string;
    phone?: string;
    name?: string;
    position?: string;
    details?: string;
  } | null;

  if (!expected || body?.secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const type = body?.type ?? "";
  const phone = body?.phone?.trim() ?? "";
  const name = body?.name?.trim() ?? "";
  const position = body?.position?.trim() ?? "";
  const details = body?.details?.trim() ?? "";

  if (!phone || !name || !position) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!["interview", "reject", "offer"].includes(type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  try {
    await pushZaloJob({
      type: type as "interview" | "reject" | "offer",
      phone,
      name,
      position,
      details: details || undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/zalo/notify] Failed to queue job:", err);
    return NextResponse.json({ error: "queue_failed" }, { status: 502 });
  }
}
