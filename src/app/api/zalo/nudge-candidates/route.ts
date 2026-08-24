import { NextRequest, NextResponse } from "next/server";
import { findStaleZaloApplications } from "@/lib/lark";
import { sendZaloAlert } from "@/lib/lark-alert";

const MIN_AGE_MINUTES = 15;

// Polled by the always-on Zalo bot to find Zalo-eligible candidates (sales
// + "Cửa hàng trưởng") who haven't messaged Minh Phương within
// MIN_AGE_MINUTES of applying — see ZALO_AUTOMATION.md for the
// proactive-nudge flow. "Phản hồi Zalo" == "Chưa bắt đầu" is the
// eligibility marker; the bot flips it to "Đã nhắn trước" via
// /api/zalo/mark-sent right after sending, which removes the candidate
// from this list on the next poll. Each candidate carries which table
// (`sales` | `other`) it came from, since the bot must write "Phản hồi
// Zalo" back to the right one.
export async function GET(req: NextRequest) {
  const expected = process.env.ZALO_WEBHOOK_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const candidates = await findStaleZaloApplications(MIN_AGE_MINUTES);
    return NextResponse.json({ candidates });
  } catch (err) {
    console.error("[api/zalo/nudge-candidates] Failed to list candidates:", err);
    await sendZaloAlert(
      `Không lấy được danh sách ứng viên cần nhắn trước: ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json({ error: "list_failed" }, { status: 502 });
  }
}
