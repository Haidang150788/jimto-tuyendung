import { NextRequest, NextResponse } from "next/server";
import { submitApplicationToLark } from "@/lib/lark";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    name?: string;
    phone?: string;
    email?: string;
    position?: string;
  } | null;

  const name = body?.name?.trim() ?? "";
  const phone = body?.phone?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  const position = body?.position?.trim() ?? "";

  if (!name || !phone) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    await submitApplicationToLark({ name, phone, email, position });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/apply] Failed to submit to Lark:", err);
    return NextResponse.json({ error: "submit_failed" }, { status: 502 });
  }
}
