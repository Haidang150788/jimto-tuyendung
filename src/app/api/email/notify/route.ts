import { NextRequest, NextResponse } from "next/server";
import {
  sendInterviewInviteEmail,
  sendOfferEmail,
  sendRejectionEmail,
} from "@/lib/email";

// Called by a Lark Base Automation webhook action when HR changes a
// candidate's status in "DATA TUYỂN DỤNG" — see EMAIL_AUTOMATION.md for how
// the automation rules are configured on the Lark side.
export async function POST(req: NextRequest) {
  const expected = process.env.EMAIL_WEBHOOK_SECRET;
  const body = (await req.json().catch(() => null)) as {
    secret?: string;
    type?: string;
    email?: string;
    name?: string;
    position?: string;
    details?: string;
  } | null;

  if (!expected || body?.secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const type = body?.type ?? "";
  const email = body?.email?.trim() ?? "";
  const name = body?.name?.trim() ?? "";
  const position = body?.position?.trim() ?? "";
  const details = body?.details?.trim() ?? "";

  if (!email || !name || !position) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!["interview", "reject", "offer"].includes(type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  try {
    if (type === "interview") {
      await sendInterviewInviteEmail(email, name, position, details);
    } else if (type === "reject") {
      await sendRejectionEmail(email, name, position);
    } else {
      await sendOfferEmail(email, name, position, details);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/email/notify] Failed to send email:", err);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
}
