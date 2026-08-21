import { NextRequest, NextResponse } from "next/server";
import {
  sendCvRejectionEmail,
  sendInterviewInviteEmail,
  sendInterviewRejectionEmail,
  sendOfferEmail,
  type Gender,
} from "@/lib/email";
import { writeBotResponseStatus } from "@/lib/lark";
import { sendLarkAlert, sendLarkActivity } from "@/lib/lark-alert";

const VALID_TYPES = ["cv_reject", "interview", "interview_reject", "offer"] as const;
type NotifyType = (typeof VALID_TYPES)[number];

const STATUS_BY_TYPE: Record<NotifyType, string> = {
  cv_reject: "Đã từ chối CV",
  interview: "Đã hẹn phỏng vấn",
  interview_reject: "Đã từ chối PV",
  offer: "Đã hẹn thử việc",
};

// Called by a Lark Base Automation webhook action when HR changes "Tình
// trạng" in DATA TUYỂN DỤNG — see EMAIL_AUTOMATION.md for how the
// automation rules are configured on the Lark side.
export async function POST(req: NextRequest) {
  const expected = process.env.EMAIL_WEBHOOK_SECRET;
  const body = (await req.json().catch(() => null)) as {
    secret?: string;
    type?: string;
    email?: string;
    name?: string;
    phone?: string;
    position?: string;
    details?: string;
    gender?: string;
    recordId?: string;
  } | null;

  if (!expected || body?.secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const type = body?.type ?? "";
  const email = body?.email?.trim() ?? "";
  const name = body?.name?.trim() ?? "";
  const phone = body?.phone?.trim() ?? "";
  const position = body?.position?.trim() ?? "";
  const details = body?.details?.trim() ?? "";
  const recordId = body?.recordId?.trim() ?? "";
  const genderRaw = body?.gender?.trim() ?? "";
  const gender: Gender = genderRaw === "Nam" || genderRaw === "Nữ" ? genderRaw : "";

  if (!email || !name || !position) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type as NotifyType)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  try {
    if (type === "cv_reject") {
      await sendCvRejectionEmail(email, name, position, gender);
    } else if (type === "interview") {
      await sendInterviewInviteEmail(email, name, position, details, gender);
    } else if (type === "interview_reject") {
      await sendInterviewRejectionEmail(email, name, position, gender);
    } else {
      await sendOfferEmail(email, name, phone, position, details, gender);
    }
  } catch (err) {
    console.error("[api/email/notify] Failed to send email:", err);
    await sendLarkAlert(
      `Không gửi được email (${type}) cho ${name} (${email}): ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
  await sendLarkActivity(`Đã gửi email "${STATUS_BY_TYPE[type as NotifyType]}" cho ${name} (${email}).`);

  if (recordId) {
    try {
      await writeBotResponseStatus(
        process.env.LARK_TABLE_NAME_OTHER || "DATA TUYỂN DỤNG",
        recordId,
        "phản hồi email",
        STATUS_BY_TYPE[type as NotifyType],
      );
    } catch (err) {
      console.error("[api/email/notify] Failed to write back status:", err);
      await sendLarkAlert(
        `Đã gửi email (${type}) nhưng KHÔNG ghi được "Phản hồi email" cho bản ghi ${recordId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
