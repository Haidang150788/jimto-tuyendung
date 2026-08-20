const RESEND_API_BASE = "https://api.resend.com";
const BRAND_RED = "#EC4176";
const SITE_URL = "https://tuyendung.jimto.vn";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY / EMAIL_FROM is not configured");
  }

  const res = await fetch(`${RESEND_API_BASE}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }
}

function wrapEmail(bodyHtml: string): string {
  return `
<div style="background:#FAFAFA;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
    <div style="background:linear-gradient(135deg,#f66a9c,${BRAND_RED});padding:24px;text-align:center;">
      <img src="${SITE_URL}/images/logo.png" alt="Jim Tồ" height="36" style="height:36px;width:auto;" />
    </div>
    <div style="padding:28px 28px 24px;color:#222;font-size:14px;line-height:1.7;">
      ${bodyHtml}
    </div>
    <div style="padding:16px 28px;background:#FAFAFA;color:#999;font-size:12px;text-align:center;">
      Jim Tồ — 306 Nguyễn Trãi, phường Hạc Thành, tỉnh Thanh Hoá · Hotline 1800.0046
    </div>
  </div>
</div>`.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Renders free-text HR notes (e.g. interview time/location) as paragraphs. */
function renderDetails(details: string): string {
  return details
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 10px;">${escapeHtml(line)}</p>`)
    .join("");
}

export type Gender = "Nam" | "Nữ" | "";

/** "Anh <name>" / "Chị <name>" when gender is known, plain "<name>" (no
 * generic "bạn") when it isn't — avoids ever guessing wrong. */
function salutation(name: string, gender: Gender): string {
  const prefix = gender === "Nam" ? "Anh " : gender === "Nữ" ? "Chị " : "";
  return escapeHtml(`${prefix}${name}`);
}

/** Mid-sentence pronoun ("...cảm ơn ĐẠI_TỪ đã...") — "Anh"/"Chị" when
 * gender is known, generic "Anh/Chị" when it isn't (never guessed). */
function pronoun(gender: Gender, capitalized: boolean): string {
  if (gender === "Nam") return "Anh";
  if (gender === "Nữ") return "Chị";
  return capitalized ? "Anh/Chị" : "anh/chị";
}

export async function sendCvReceivedEmail(
  to: string,
  name: string,
  position: string,
  gender: Gender = "",
) {
  const p = pronoun(gender, false);
  const html = wrapEmail(`
    <p style="margin:0 0 14px;">Kính gửi <strong>${salutation(name, gender)}</strong>,</p>
    <p style="margin:0 0 14px;">Hệ thống Mẹ &amp; Bé Jim Tồ đã nhận được CV ${p} gửi về ứng tuyển cho vị trí <strong>${escapeHtml(position)}</strong>.</p>
    <p style="margin:0 0 14px;">Bộ phận tuyển dụng sẽ xem xét hồ sơ và sắp xếp phản hồi kết quả đến ${p} trong thời gian sớm nhất.</p>
    <p style="margin:0;">Cảm ơn ${p} đã quan tâm và lựa chọn Hệ thống Mẹ &amp; Bé Jim Tồ.</p>
  `);
  await sendEmail(to, `Jim Tồ đã nhận được hồ sơ ứng tuyển của bạn`, html);
}

export async function sendCvRejectionEmail(
  to: string,
  name: string,
  position: string,
  gender: Gender = "",
) {
  const html = wrapEmail(`
    <p style="margin:0 0 14px;">Xin chào <strong>${salutation(name, gender)}</strong>, Hệ thống mẹ và bé Jim Tồ cảm ơn bạn đã quan tâm và ứng tuyển tại hệ thống. Sau khi xem xét, hiện tại hồ sơ của bạn chưa phù hợp với vị trí tuyển dụng đợt này.</p>
    <p style="margin:0;">Hy vọng sẽ có dịp được kết nối và hợp tác cùng bạn trong những cơ hội phù hợp sắp tới. Chúc bạn nhiều thành công!</p>
  `);
  await sendEmail(to, `Kết quả ứng tuyển vị trí ${position} tại Jim Tồ`, html);
}

export async function sendInterviewRejectionEmail(
  to: string,
  name: string,
  position: string,
  gender: Gender = "",
) {
  const p = pronoun(gender, false);
  const P = pronoun(gender, true);
  const html = wrapEmail(`
    <p style="margin:0 0 4px;font-weight:bold;">THƯ CẢM ƠN</p>
    <p style="margin:0 0 14px;">Kính gửi: <strong>${salutation(name, gender)}</strong></p>
    <p style="margin:0 0 14px;">Ban Giám đốc hệ thống mẹ và bé Jim Tồ bày tỏ lời cảm ơn chân thành đến ${p} đã nhiệt tình hưởng ứng lời mời cộng tác của Công ty chúng tôi trong đợt tuyển dụng vừa qua</p>
    <p style="margin:0 0 14px;">Chúng tôi đánh giá cao khả năng, lòng nhiệt tình và thái độ tích cực mà ${P} muốn được góp sức cho sự phát triển lớn mạnh đối với Công ty. Đây là sự động viên to lớn đối với Công ty đang trên đà phát triển càng thêm vững tin chọn lựa, triển khai thực hiện các mục tiêu đã định cho tương lai.</p>
    <p style="margin:0 0 14px;">Chúng tôi lấy làm tiếc vì chưa đủ điều kiện để được công tác ngay với ${P}. Song chúng tôi mạn phép cập nhật để lưu trữ hồ sơ của ${P} với hy vọng sẽ có cơ hội hợp tác trong một tương lai gần nhất.</p>
    <p style="margin:0 0 14px;">Chúc ${P} gặt hái được nhiều thành công trong công việc.</p>
    <p style="margin:0;">Trân trọng!</p>
  `);
  await sendEmail(to, `Kết quả phỏng vấn vị trí ${position} tại Jim Tồ`, html);
}

export async function sendInterviewInviteEmail(
  to: string,
  name: string,
  position: string,
  details: string,
  gender: Gender = "",
) {
  const html = wrapEmail(`
    <p style="margin:0 0 14px;">Xin chào <strong>${salutation(name, gender)}</strong>,</p>
    <p style="margin:0 0 14px;">Chúc mừng bạn đã vượt qua vòng sơ tuyển cho vị trí <strong>${escapeHtml(position)}</strong> tại Jim Tồ! Chúng tôi muốn mời bạn tham gia buổi phỏng vấn để tìm hiểu thêm về bạn.</p>
    ${details ? renderDetails(details) : ""}
    <p style="margin:14px 0;">Vui lòng phản hồi email này hoặc liên hệ lại để xác nhận lịch hẹn. Nếu có thay đổi, hãy báo cho chúng tôi sớm nhất có thể.</p>
    <p style="margin:0;">Trân trọng,<br/>Đội ngũ Tuyển dụng Jim Tồ</p>
  `);
  await sendEmail(to, `Jim Tồ mời bạn tham gia phỏng vấn — ${position}`, html);
}

export async function sendOfferEmail(
  to: string,
  name: string,
  position: string,
  details: string,
  gender: Gender = "",
) {
  const html = wrapEmail(`
    <p style="margin:0 0 14px;">Xin chào <strong>${salutation(name, gender)}</strong>,</p>
    <p style="margin:0 0 14px;">Chúc mừng bạn đã chính thức trúng tuyển vị trí <strong>${escapeHtml(position)}</strong> tại Jim Tồ!</p>
    ${details ? renderDetails(details) : ""}
    <p style="margin:14px 0;">Vui lòng phản hồi email này để xác nhận. Nếu có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>
    <p style="margin:0;">Rất mong được chào đón bạn gia nhập đội ngũ Jim Tồ!<br/><br/>Trân trọng,<br/>Đội ngũ Tuyển dụng Jim Tồ</p>
  `);
  await sendEmail(to, `Chúc mừng bạn đã trúng tuyển vị trí ${position} tại Jim Tồ!`, html);
}
