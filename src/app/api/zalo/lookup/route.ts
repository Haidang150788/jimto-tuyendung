import { NextRequest, NextResponse } from "next/server";
import { findApplicationByPhone } from "@/lib/lark";
import { sendLarkAlert } from "@/lib/lark-alert";

// Called by the Zalo bot when a stranger messages it for the first time —
// see ZALO_AUTOMATION.md. Confirms the phone number they send matches a
// real application (any position — sales or office) so the bot knows
// whether to greet them as a candidate or ask them to apply on the site
// first.
export async function GET(req: NextRequest) {
  const expected = process.env.ZALO_WEBHOOK_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const phone = req.nextUrl.searchParams.get("phone")?.trim() ?? "";
  if (!phone) {
    return NextResponse.json({ error: "missing_phone" }, { status: 400 });
  }

  try {
    const match = await findApplicationByPhone(phone);
    return NextResponse.json({
      found: Boolean(match),
      name: match?.name ?? null,
      gender: match?.gender || null,
      position: match?.position || null,
    });
  } catch (err) {
    console.error("[api/zalo/lookup] Lookup failed:", err);
    await sendLarkAlert(
      `Tra cứu hồ sơ theo số điện thoại thất bại: ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json({ error: "lookup_failed" }, { status: 502 });
  }
}
