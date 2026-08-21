import { NextRequest, NextResponse } from "next/server";
import { submitApplicationToLark, writeBotResponseStatus } from "@/lib/lark";
import { sendCvReceivedEmail } from "@/lib/email";
import { isSalesPositionTitle } from "@/lib/sales-application-form";
import { extractEmailFromCv } from "@/lib/extract-email-from-cv";
import { sendLarkAlert } from "@/lib/lark-alert";

const MAX_CV_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  let email = String(formData.get("email") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const genderRaw = String(formData.get("gender") ?? "").trim();
  const gender = genderRaw === "Nam" || genderRaw === "Nữ" ? genderRaw : "";
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

  // Office positions require an email on file (sales-floor candidates never
  // have one by design — see sales-application-form.ts). Candidates often
  // only put it in their CV rather than the form field, so fall back to
  // extracting it from the file before treating it as truly missing.
  const isSalesPosition = isSalesPositionTitle(position);
  if (!isSalesPosition && !email && cvFile) {
    const extracted = await extractEmailFromCv(cvFile).catch((err) => {
      console.error("[api/apply] CV email extraction failed:", err);
      return null;
    });
    if (extracted) email = extracted;
  }
  if (!isSalesPosition && !email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  let recordId: string | null;
  try {
    recordId = await submitApplicationToLark({
      name,
      phone,
      email,
      position,
      location,
      gender,
      cvFile,
      step2,
    });
  } catch (err) {
    console.error("[api/apply] Failed to submit to Lark:", err);
    await sendLarkAlert(
      `Không lưu được hồ sơ ứng tuyển của ${name} (${phone}, vị trí "${position}") vào Lark: ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json({ error: "submit_failed" }, { status: 502 });
  }

  // The application is already recorded in Lark at this point — a failed
  // confirmation email shouldn't turn into a failed submission for the
  // candidate, so this is best-effort and never changes the response.
  if (email) {
    try {
      await sendCvReceivedEmail(email, name, position, gender);
    } catch (err) {
      console.error("[api/apply] Failed to send CV-received email:", err);
      await sendLarkAlert(
        `Không gửi được email xác nhận CV cho ${name} (${email}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // "Phản hồi email" chỉ tồn tại ở DATA TUYỂN DỤNG — recordId là null cho
  // hồ sơ "Tư vấn bán hàng" (bảng screening riêng, không có cột này). Ghi
  // vào đây (không phải "Phản hồi Zalo") vì "Đã chào mừng" ở bước này luôn
  // là email — hồ sơ Zalo/Tư vấn bán hàng không đi qua route này.
  if (recordId) {
    try {
      await writeBotResponseStatus(
        process.env.LARK_TABLE_NAME_OTHER || "DATA TUYỂN DỤNG",
        recordId,
        "phản hồi email",
        "Đã chào mừng",
      );
    } catch (err) {
      console.error("[api/apply] Failed to write back bot status:", err);
      await sendLarkAlert(
        `Đã nhận hồ sơ của ${name} nhưng KHÔNG ghi được "Phản hồi email": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
