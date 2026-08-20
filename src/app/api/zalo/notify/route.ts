import { NextRequest, NextResponse } from "next/server";
import { pushZaloJob, type ZaloNotifyType } from "@/lib/zalo-queue";
import { sendLarkAlert } from "@/lib/lark-alert";

const VALID_TYPES: ZaloNotifyType[] = ["cv_reject", "interview", "interview_reject", "offer"];

// Called by a Lark Base Automation webhook action when HR changes "Tình
// trạng" in DATA TUYỂN DỤNG — see ZALO_AUTOMATION.md. Mirrors
// /api/email/notify but keyed by phone (sales candidates have no email)
// and queues the job for the always-on Zalo bot to pick up, instead of
// sending anything itself.
export async function POST(req: NextRequest) {
  const expected = process.env.ZALO_WEBHOOK_SECRET;
  const body = (await req.json().catch(() => null)) as {
    secret?: string;
    type?: string;
    phone?: string;
    name?: string;
    position?: string;
    details?: string;
    gender?: string;
    recordId?: string;
  } | null;

  if (!expected || body?.secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const type = body?.type ?? "";
  const phone = body?.phone?.trim() ?? "";
  const name = body?.name?.trim() ?? "";
  const position = body?.position?.trim() ?? "";
  const details = body?.details?.trim() ?? "";
  const recordId = body?.recordId?.trim() ?? "";
  const genderRaw = body?.gender?.trim() ?? "";
  const gender = genderRaw === "Nam" || genderRaw === "Nữ" ? genderRaw : "";

  if (!phone || !name || !position) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type as ZaloNotifyType)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  try {
    await pushZaloJob({
      type: type as ZaloNotifyType,
      phone,
      name,
      position,
      details: details || undefined,
      gender: gender || undefined,
      recordId: recordId || undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/zalo/notify] Failed to queue job:", err);
    await sendLarkAlert(
      `Không xếp được hàng đợi Zalo cho ${name} (${phone}, loại "${type}"): ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json({ error: "queue_failed" }, { status: 502 });
  }
}
