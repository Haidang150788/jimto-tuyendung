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

export async function sendCvReceivedEmail(
  to: string,
  name: string,
  position: string,
  gender: Gender = "",
) {
  const html = wrapEmail(`
    <p style="margin:0 0 14px;">Xin chào <strong>${salutation(name, gender)}</strong>,</p>
    <p style="margin:0 0 14px;">Cảm ơn bạn đã quan tâm và ứng tuyển vị trí <strong>${escapeHtml(position)}</strong> tại Jim Tồ.</p>
    <p style="margin:0 0 14px;">Chúng tôi đã nhận được hồ sơ của bạn và sẽ tiến hành xem xét trong thời gian sớm nhất. Bộ phận nhân sự sẽ phản hồi trong vòng 24 giờ làm việc.</p>
    <p style="margin:0;">Trân trọng,<br/>Đội ngũ Tuyển dụng Jim Tồ</p>
  `);
  await sendEmail(to, `Jim Tồ đã nhận được hồ sơ ứng tuyển của bạn`, html);
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

export async function sendRejectionEmail(
  to: string,
  name: string,
  position: string,
  gender: Gender = "",
) {
  const html = wrapEmail(`
    <p style="margin:0 0 14px;">Xin chào <strong>${salutation(name, gender)}</strong>,</p>
    <p style="margin:0 0 14px;">Cảm ơn bạn đã dành thời gian ứng tuyển vị trí <strong>${escapeHtml(position)}</strong> tại Jim Tồ.</p>
    <p style="margin:0 0 14px;">Sau khi xem xét kỹ lưỡng, chúng tôi rất tiếc phải thông báo rằng hồ sơ của bạn chưa phù hợp với vị trí này ở thời điểm hiện tại. Chúng tôi đánh giá cao sự quan tâm của bạn và mong có cơ hội hợp tác trong tương lai.</p>
    <p style="margin:0 0 14px;">Chúc bạn sớm tìm được công việc phù hợp.</p>
    <p style="margin:0;">Trân trọng,<br/>Đội ngũ Tuyển dụng Jim Tồ</p>
  `);
  await sendEmail(to, `Kết quả ứng tuyển vị trí ${position} tại Jim Tồ`, html);
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
