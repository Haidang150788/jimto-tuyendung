import { NextRequest, NextResponse } from "next/server";
import { writeBotResponseStatus } from "@/lib/lark";
import { sendLarkAlert } from "@/lib/lark-alert";

const STATUS_BY_TYPE: Record<string, string> = {
  welcome: "Đã chào mừng",
  cv_reject: "Đã từ chối CV",
  interview: "Đã hẹn phỏng vấn",
  interview_reject: "Đã từ chối PV",
  offer: "Đã hẹn thử việc",
  proactive_nudge: "Đã nhắn trước",
  proactive_nudge_failed: "Lỗi nhắn trước - cần gọi điện",
};

// Called by the Zalo bot right after it actually delivers a status message
// (not when the job is queued — delivery can fail or be delayed) to write
// "Phản hồi Zalo" back onto the DATA TUYỂN DỤNG record HR is looking at.
// Best-effort: a failure here doesn't mean the candidate wasn't messaged,
// just that HR's tracking column wasn't updated — alerted to the ops
// group either way so it doesn't go unnoticed.
export async function POST(req: NextRequest) {
  const expected = process.env.ZALO_WEBHOOK_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    recordId?: string;
    type?: string;
    table?: string;
  } | null;
  const recordId = body?.recordId?.trim() ?? "";
  const status = STATUS_BY_TYPE[body?.type ?? ""];
  const tableName =
    body?.table === "sales"
      ? process.env.LARK_TABLE_NAME_SALES || "(NEW) Form tuyển dụng"
      : process.env.LARK_TABLE_NAME_OTHER || "DATA TUYỂN DỤNG";

  if (!recordId || !status) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    await writeBotResponseStatus(tableName, recordId, "phản hồi Zalo", status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/zalo/mark-sent] Failed to write back status:", err);
    await sendLarkAlert(
      `Đã gửi Zalo (${body?.type}) nhưng KHÔNG ghi được "Phản hồi Zalo" cho bản ghi ${recordId}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json({ error: "write_failed" }, { status: 502 });
  }
}
