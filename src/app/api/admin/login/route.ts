import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    console.error("[api/admin/login] ADMIN_PASSWORD is not set on the server.");
    return NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }

  if (password && password === expected) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
