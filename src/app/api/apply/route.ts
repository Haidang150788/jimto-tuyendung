import { NextRequest, NextResponse } from "next/server";
import { submitApplicationToLark } from "@/lib/lark";

const MAX_CV_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const cvEntry = formData.get("cv");
  const cvFile = cvEntry instanceof File && cvEntry.size > 0 ? cvEntry : null;

  const step2Raw = formData.get("step2");
  let step2: Record<string, string> | undefined;
  if (typeof step2Raw === "string" && step2Raw) {
    try {
      const parsed: unknown = JSON.parse(step2Raw);
      if (parsed && typeof parsed === "object") {
        step2 = parsed as Record<string, string>;
      }
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
  }

  if (!name || !phone) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (cvFile && cvFile.size > MAX_CV_SIZE) {
    return NextResponse.json({ error: "cv_too_large" }, { status: 413 });
  }

  try {
    await submitApplicationToLark({ name, phone, email, position, location, cvFile, step2 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/apply] Failed to submit to Lark:", err);
    return NextResponse.json({ error: "submit_failed" }, { status: 502 });
  }
}
