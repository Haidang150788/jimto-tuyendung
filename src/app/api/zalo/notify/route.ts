import { NextRequest, NextResponse } from "next/server";
import { pushZaloJob, type ZaloNotifyType } from "@/lib/zalo-queue";
import { sendLarkAlert } from "@/lib/lark-alert";
import { isZaloCtaPosition } from "@/lib/sales-application-form";

const VALID_TYPES: ZaloNotifyType[] = ["cv_reject", "interview", "interview_reject", "offer"];

// Called by a Lark Base Automation webhook action when HR changes the
// status field in DATA TUYỂN DỤNG ("Tình trạng") or "(NEW) Form tuyển
// dụng" ("TRẠNG THÁI") — see ZALO_AUTOMATION.md. Mirrors /api/email/notify
// but keyed by phone (candidates messaging Minh Phương may not have an
// email on file) and queues the job for the always-on Zalo bot to pick
// up, instead of sending anything itself.
export async function POST(req: NextRequest) {
  const expected = process.env.ZALO_WEBHOOK_SECRET;
  const body = (await req.json().catch(() => null)) as {
    secret?: string;
    type?: string;
    phone?: string;
    name?: string;
    position?: string;
    details?: string;
    gender?: string;
    recordId?: string;
    table?: string;
  } | null;

  if (!expected || body?.secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const type = body?.type ?? "";
  const phone = body?.phone?.trim() ?? "";
  const name = body?.name?.trim() ?? "";
  const position = body?.position?.trim() ?? "";
  const details = body?.details?.trim() ?? "";
  const recordId = body?.recordId?.trim() ?? "";
  const table = body?.table === "sales" ? "sales" : "other";
  const genderRaw = body?.gender?.trim() ?? "";
  const gender = genderRaw === "Nam" || genderRaw === "Nữ" ? genderRaw : "";

  // Chỉ tới được đây khi secret đúng — nghĩa là request thật sự đến từ
  // Automation của mình, không phải bot dò quét. Thiếu field/sai type ở
  // đây luôn là lỗi cấu hình Automation, im lặng bỏ qua sẽ không ai biết —
  // phải báo ngay, khác với 401 ở trên (request lạ, im lặng là đúng).
  if (!phone || !name || !position) {
    console.error("[api/zalo/notify] Missing fields:", { type, phone, name, position, recordId });
    await sendLarkAlert(
      `Automation "${type || "?"}" gọi /api/zalo/notify thiếu field bắt buộc (phone/name/position) — kiểm tra lại JSON body của Automation. recordId: ${recordId || "?"}`,
    );
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type as ZaloNotifyType)) {
    await sendLarkAlert(
      `Automation gọi /api/zalo/notify với type "${type}" không hợp lệ — kiểm tra lại Automation. recordId: ${recordId || "?"}`,
    );
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  // Automation trên DATA TUYỂN DỤNG bắn cho MỌI vị trí khi "Tình trạng"
  // đổi (Lark không lọc theo vị trí được ở bước trigger) — nhưng chỉ "Cửa
  // hàng trưởng" thực sự dùng kênh Zalo ở bảng này (xem isZaloCtaPosition
  // và ZALO_AUTOMATION.md). Bỏ qua êm cho các vị trí văn phòng còn lại:
  // không xếp hàng đợi, không báo lỗi — họ chưa từng có UID và sẽ không
  // bao giờ có, nên "gửi thất bại" ở đây không phải sự cố cần biết.
  if (table === "other" && !isZaloCtaPosition(position)) {
    return NextResponse.json({ ok: true, skipped: "not_zalo_eligible" });
  }

  try {
    await pushZaloJob({
      type: type as ZaloNotifyType,
      phone,
      name,
      position,
      details: details || undefined,
      gender: gender || undefined,
      recordId: recordId || undefined,
      table,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/zalo/notify] Failed to queue job:", err);
    await sendLarkAlert(
      `Không xếp được hàng đợi Zalo cho ${name} (${phone}, loại "${type}"): ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json({ error: "queue_failed" }, { status: 502 });
  }
}
