import { NextRequest, NextResponse } from "next/server";
import { findStaleSalesApplications } from "@/lib/lark";
import { sendLarkAlert } from "@/lib/lark-alert";

const MIN_AGE_MINUTES = 15;

// Polled by the always-on Zalo bot to find sales-position candidates who
// haven't messaged Minh Phương within MIN_AGE_MINUTES of applying — see
// ZALO_AUTOMATION.md for the proactive-nudge flow. "Phản hồi Zalo" ==
// "Chưa bắt đầu" is the eligibility marker; the bot flips it to "Đã nhắn
// trước" via /api/zalo/mark-sent right after sending, which removes the
// candidate from this list on the next poll.
export async function GET(req: NextRequest) {
  const expected = process.env.ZALO_WEBHOOK_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const candidates = await findStaleSalesApplications(MIN_AGE_MINUTES);
    return NextResponse.json({ candidates });
  } catch (err) {
    console.error("[api/zalo/nudge-candidates] Failed to list candidates:", err);
    await sendLarkAlert(
      `Không lấy được danh sách ứng viên cần nhắn trước: ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json({ error: "list_failed" }, { status: 502 });
  }
}
