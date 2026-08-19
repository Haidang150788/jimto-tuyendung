import { NextRequest, NextResponse } from "next/server";
import { findSalesApplicationByPhone } from "@/lib/lark";

// Called by the Zalo bot when a stranger messages it for the first time —
// see ZALO_AUTOMATION.md. Confirms the phone number they send matches a
// real "Tư vấn bán hàng" application so the bot knows whether to greet them
// as a candidate or ask them to apply on the site first.
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
    const match = await findSalesApplicationByPhone(phone);
    return NextResponse.json({ found: Boolean(match), name: match?.name ?? null });
  } catch (err) {
    console.error("[api/zalo/lookup] Lookup failed:", err);
    return NextResponse.json({ error: "lookup_failed" }, { status: 502 });
  }
}
