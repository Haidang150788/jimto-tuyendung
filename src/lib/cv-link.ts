import { createHmac, timingSafeEqual } from "node:crypto";

// Link "Đơn ứng tuyển" cho từng hồ sơ "Tư vấn bán hàng" — trang /ho-so/<id>
// dựng lại mẫu CV của HCNS từ record Lark. Trang này chứa dữ liệu nhạy cảm
// (thai sản, hôn nhân, chiều cao/cân nặng) nên KHÔNG mở bằng record_id trơn:
// mỗi link mang chữ ký HMAC riêng, chỉ ai thấy link trong Lark mới mở được —
// tức đúng bằng quyền đã có sẵn khi xem bảng. Đổi CV_LINK_SECRET sẽ làm hỏng
// toàn bộ link cũ (chạy lại scripts/backfill-cv-links.mjs để ghi link mới).

const SITE_URL = process.env.SITE_URL || "https://tuyendung.jimto.vn";

function sign(recordId: string, secret: string): string {
  return createHmac("sha256", secret).update(`cv:${recordId}`).digest("base64url").slice(0, 22);
}

export function buildCvUrl(recordId: string): string {
  const secret = process.env.CV_LINK_SECRET;
  if (!secret) throw new Error("CV_LINK_SECRET is not configured");
  return `${SITE_URL}/ho-so/${recordId}?k=${sign(recordId, secret)}`;
}

export function verifyCvToken(recordId: string, token: string | undefined): boolean {
  const secret = process.env.CV_LINK_SECRET;
  if (!secret || !token || !/^rec[A-Za-z0-9]+$/.test(recordId)) return false;
  const expected = Buffer.from(sign(recordId, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
