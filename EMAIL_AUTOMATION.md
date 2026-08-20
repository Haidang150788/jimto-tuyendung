# Luồng email tự động

5 loại thư:

1. **Xác nhận nhận CV** — tự động 100%, gửi ngay khi ứng viên nộp hồ sơ qua web (chỉ áp dụng cho các vị trí có thu email, tức là mọi vị trí trừ "Tư vấn bán hàng" — vị trí đó không thu email nên bỏ qua bước này).
2. **Từ chối CV**
3. **Mời phỏng vấn**
4. **Từ chối sau phỏng vấn**
5. **Xác nhận công việc + hẹn ngày bắt đầu**

4 loại sau do HR chủ động gửi, bằng cách **đổi cột "Tình trạng"** của ứng viên trong bảng **DATA TUYỂN DỤNG** trên Lark — Automation của Lark sẽ tự gọi vào web để gửi thư. Chỉ áp dụng cho ứng viên có cột Email; ứng viên "Tư vấn bán hàng" không có email nên không dùng được các thư này, nhận kết quả qua Zalo thay thế (xem `ZALO_AUTOMATION.md`).

> **Mẹo:** cột "Tình trạng" và các giá trị trạng thái dùng ở đây **giống hệt** bên Zalo — nếu đã tạo 4 automation Zalo theo `ZALO_AUTOMATION.md`, chỉ cần **thêm 1 action Send Webhook thứ hai** vào mỗi automation đó (gọi sang `/api/email/notify`) thay vì tạo mới từ đầu. Ứng viên có email sẽ nhận cả 2, ứng viên không có email thì action email tự báo lỗi "missing_fields" — vô hại, bỏ qua.

## 1. Đăng ký Resend (dịch vụ gửi email)

1. Vào https://resend.com → **Sign Up** (dùng email của bạn).
2. Vào **Domains** → **Add Domain** → nhập `jimto.vn`.
3. Resend hiện ra vài bản ghi DNS (thường là 2-3 bản ghi TXT/MX/CNAME cho SPF, DKIM). Đăng nhập tenten.vn → quản lý DNS của `jimto.vn` → thêm đúng các bản ghi đó (giống hệt cách bạn từng thêm bản ghi trỏ domain sang Vercel).
4. Quay lại Resend, bấm **Verify** — có thể mất vài phút tới vài giờ để DNS cập nhật xong. Domain hiện "Verified" là xong.
5. Vào **API Keys** → **Create API Key** → đặt tên tuỳ ý (ví dụ "jimto-web") → copy chuỗi key (dạng `re_xxxxxxxx`) — **chỉ hiện 1 lần**, lưu lại ngay.

## 2. Thêm biến môi trường vào Vercel

Vào project trên Vercel → **Settings → Environment Variables**, thêm:

| Key | Value |
|---|---|
| `RESEND_API_KEY` | key vừa tạo ở bước 1.5 |
| `EMAIL_FROM` | `Tuyển dụng Jim Tồ <tuyendung@jimto.vn>` (đổi địa chỉ nếu muốn, miễn thuộc domain đã verify) |
| `EMAIL_WEBHOOK_SECRET` | `66b30960e9ebddb82b8e0d890844034c03df0d7a3cc9a50b` (mã này đã tạo sẵn — copy y hệt, dùng lại ở bước 3) |

Xong **Redeploy** như mọi lần thêm biến môi trường khác.

## 3. Cấu hình Automation trong Lark (bảng DATA TUYỂN DỤNG)

Trigger: Record updated → trường **Tình trạng**. Action: Send Webhook:
- Method: `POST`
- URL: `https://tuyendung.jimto.vn/api/email/notify`
- Header: `Content-Type: application/json`
- Body — bấm "chèn trường" để lấy đúng token, **kể cả `{{Record ID}}`** (để tự ghi lại cột "Phản hồi email" sau khi gửi — bỏ dòng `recordId` nếu Lark không cho chèn được, thư vẫn gửi bình thường).

### Automation 1 — Từ chối CV (Tình trạng = `Không đạt CV`)

```json
{
  "secret": "66b30960e9ebddb82b8e0d890844034c03df0d7a3cc9a50b",
  "type": "cv_reject",
  "email": "{{Email}}",
  "name": "{{Họ và tên}}",
  "position": "{{Vị trí ứng tuyển}}",
  "gender": "{{Giới tính}}",
  "recordId": "{{Record ID}}"
}
```

### Automation 2 — Mời phỏng vấn (Tình trạng = `Hẹn phỏng vấn`)

Giống Automation 1, đổi `"type": "interview"`, thêm `"details": "{{Ghi chú}}"`.

> `details` được đưa nguyên văn vào email — trước khi đổi Tình trạng, HR nên gõ vào ô **Ghi chú** đầy đủ giờ/ngày/địa điểm phỏng vấn, ví dụ: `Phỏng vấn lúc 9h00 thứ Hai 20/10/2026, tại văn phòng Jim Tồ - 306 Nguyễn Trãi, phường Hạc Thành.`

### Automation 3 — Từ chối sau phỏng vấn (Tình trạng = `Không đạt phỏng vấn`)

Giống Automation 1, đổi `"type": "interview_reject"`, không cần `details`.

### Automation 4 — Xác nhận công việc + hẹn ngày bắt đầu (Tình trạng = `Mời nhận viêc`)

Giống Automation 1, đổi `"type": "offer"`, thêm `"details": "{{Ghi chú}}"`.

> Gõ vào **Ghi chú** thông tin ngày bắt đầu làm việc trước khi đổi Tình trạng, ví dụ: `Ngày bắt đầu làm việc: Thứ Hai, 03/11/2026. Vui lòng có mặt lúc 8h00 tại văn phòng để nhận việc.`

## 4. Kiểm tra thử

1. Vào Lark, đổi Tình trạng của **1 bản ghi test** (dùng email thật của bạn, không phải email ứng viên) sang `Hẹn phỏng vấn`.
2. Kiểm tra hộp thư — email mời phỏng vấn phải tới trong vòng vài giây tới vài phút, và cột "Phản hồi email" của bản ghi tự chuyển thành "Đã hẹn phỏng vấn".
3. Lặp lại với `Không đạt CV`, `Không đạt phỏng vấn`, `Mời nhận viêc` để kiểm tra 3 thư còn lại.
4. Nếu không nhận được thư: kiểm tra group Lark báo lỗi trước (mọi lỗi gửi email đều báo vào đó), rồi mới vào Lark Automation xem lịch sử chạy ("Run history"/"Lịch sử"); nếu Lark báo đã gửi thành công nhưng không có thư, kiểm tra domain đã "Verified" trên Resend chưa.

## Lưu ý bảo mật

`EMAIL_WEBHOOK_SECRET` đóng vai trò như mật khẩu để chặn người lạ gọi thẳng vào `/api/email/notify` và gửi thư giả danh Jim Tồ. Không chia sẻ chuỗi này ra ngoài Lark Automation. Nếu nghi bị lộ, đổi giá trị mới trong Vercel + cập nhật lại cả 4 Automation trong Lark cho khớp.
