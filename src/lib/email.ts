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
  const p = pronoun(gender, false);
  const P = pronoun(gender, true);
  const html = wrapEmail(`
    <p style="margin:0 0 14px;">Kính gửi: <strong>${salutation(name, gender)}</strong></p>
    <p style="margin:0 0 14px;">Bộ phận Tuyển dụng của Hệ thống mẹ và bé Jim Tồ chúc mừng bạn đã vượt qua vòng sơ loại hồ sơ vị trí <strong>${escapeHtml(position)}</strong></p>
    <p style="margin:0 0 14px;">Công ty trân trọng kính mời bạn tới tham dự buổi phỏng vấn được tổ chức tại văn phòng Công ty cụ thể như sau:</p>
    <p style="margin:0 0 14px;"><strong>Thời gian, địa điểm phỏng vấn:</strong> ${details ? escapeHtml(details) : "(sẽ được thông báo cụ thể)"}</p>
    <p style="margin:0 0 14px;">Kính mong ${P} phản hồi email này sớm để xác nhận tham gia phỏng vấn. Rất mong ${P} sắp xếp thời gian và có mặt đúng giờ theo lịch hẹn.</p>
    <p style="margin:0 0 14px;">Nếu cần hỗ trợ hoặc có bất kỳ thắc mắc nào, vui lòng liên hệ Bộ phận Hành chính – Nhân sự qua số điện thoại <strong>0948 027 756</strong> (Ms. Tuyết Nhi).</p>
    <p style="margin:0;">Trân trọng cảm ơn và hẹn gặp ${p} tại buổi phỏng vấn!<br/><br/>Bộ phận Hành chính - Nhân sự</p>
  `);
  await sendEmail(to, `Jim Tồ mời bạn tham gia phỏng vấn — ${position}`, html);
}

export async function sendOfferEmail(
  to: string,
  name: string,
  phone: string,
  position: string,
  details: string,
  gender: Gender = "",
) {
  const greetPronoun = gender === "Nam" ? "Anh" : gender === "Nữ" ? "Chị" : "Bạn";
  const html = wrapEmail(`
    <p style="margin:0 0 14px;">Gửi tới: <strong>${greetPronoun} ${escapeHtml(name)}</strong> &nbsp;&nbsp; SĐT: ${escapeHtml(phone)}</p>
    <p style="margin:0 0 14px;">Chức danh công việc: <strong>${escapeHtml(position)}</strong> &nbsp;&nbsp; Email: ${escapeHtml(to)}</p>
    <p style="margin:0 0 14px;">Công ty Cổ phần MomKid Việt Nam (&quot;Jim Tồ&quot;) trân trọng cảm ơn sự quan tâm của bạn về cơ hội hợp tác và làm việc tại Jim Tồ.</p>
    <p style="margin:0 0 14px;">Bằng thư mời làm việc này, Chúng tôi hân hạnh được gửi tới bạn lời đề nghị làm việc tại Jim Tồ với các điều kiện và điều khoản như sau:</p>
    <p style="margin:0 0 4px;"><strong>1. Tên công ty:</strong> Công ty Cổ phần Momkid Việt Nam</p>
    <p style="margin:0 0 4px;"><strong>2. Địa điểm làm việc:</strong> 306 Nguyễn Trãi, Phường Hạc Thành, Tỉnh Thanh Hoá</p>
    <p style="margin:0 0 4px;"><strong>3. Thời giờ làm việc:</strong> Sáng 7h30-11h30, Chiều: 13h00-17h00. Ngày nghỉ hàng tuần theo sự sắp xếp của công ty đảm bảo mỗi tuần NLĐ được nghỉ 1 ngày (24h liên tục).</p>
    <p style="margin:0 0 4px;"><strong>4. Thời gian thử việc:</strong> ${details ? escapeHtml(details) : "(sẽ được thông báo cụ thể)"}</p>
    <p style="margin:0 0 4px;"><strong>5. Mức lương:</strong> Theo hợp đồng được ký kết tại thời điểm nhận việc</p>
    <p style="margin:0 0 14px;"><strong>6. Trách nhiệm:</strong> Hoàn thành các công việc theo Bản mô tả vị công việc, hợp đồng lao động, hợp đồng thử việc và các văn bản khác có liên quan theo quy định của Jim Tồ và Pháp luật.</p>
    <p style="margin:0 0 4px;"><strong>7. Thư mời này sẽ tự động chấm dứt hiệu lực nếu:</strong></p>
    <p style="margin:0 0 14px;">Jim Tồ không nhận được xác nhận đồng ý của bạn với thư mời này trong thời hạn 03 ngày. Bạn không đến làm việc tại Jim Tồ mà không có lý do chính đáng trong thời hạn 03 ngày làm việc, kể từ ngày bạn xác nhận bắt đầu làm việc tại Jim Tồ, hoặc thông tin trong hồ sơ tuyển dụng do bạn cung cấp là không chính xác, không khách quan và không trung thực. Thư mời này không phải là hợp đồng lao động. Quan hệ lao động giữa bạn và Jim Tồ chỉ được xác lập khi hợp đồng thử việc (nếu có)/hợp đồng lao động giữa bạn và Jim Tồ được ký kết.</p>
    <p style="margin:0 0 4px;"><strong>8. Hồ sơ cần chuẩn bị:</strong></p>
    <p style="margin:0 0 2px;">- Sơ yếu lý lịch (công chứng)</p>
    <p style="margin:0 0 2px;">- Bản sao CCCD/CMND (công chứng)</p>
    <p style="margin:0 0 2px;">- Bản sao Bằng cấp (nếu có) (công chứng)</p>
    <p style="margin:0 0 14px;">- Giấy khám sức khoẻ + 1 Ảnh 3x4</p>
    <p style="margin:0 0 14px;"><em>Tất cả những giấy tờ trên đều phải được xác nhận công chứng/sao y bản chính và hoàn thiện trong vòng 7 ngày từ ngày làm việc đầu tiên.</em></p>
    <p style="margin:0 0 14px;">Sau khi nhận được thông tin xác nhận thư mời làm việc của bạn, Bộ phận tiếp nhận nhân sự của Jim Tồ sẽ hướng dẫn bạn hoàn thiện thông tin, thủ tục trước khi gia nhập Jim Tồ. Chúng tôi hy vọng được sớm tiếp nhận bạn vào làm việc, hợp tác và phát triển bền vững cùng Jim Tồ.</p>
    <p style="margin:0;">Trân trọng cảm ơn!</p>
  `);
  await sendEmail(to, `Thư mời nhận việc — ${position} tại Jim Tồ`, html);
}
