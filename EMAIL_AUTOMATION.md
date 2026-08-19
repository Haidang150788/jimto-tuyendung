# Luồng email tự động

4 loại thư:

1. **Xác nhận nhận CV** — tự động 100%, gửi ngay khi ứng viên nộp hồ sơ qua web (chỉ áp dụng cho các vị trí có thu email, tức là mọi vị trí trừ "Tư vấn bán hàng" — vị trí đó không thu email nên bỏ qua bước này).
2. **Mời phỏng vấn**
3. **Từ chối**
4. **Xác nhận công việc + hẹn ngày bắt đầu**

3 loại sau do HR chủ động gửi, bằng cách **đổi cột "Tình trạng"** của ứng viên trong bảng **DATA TUYỂN DỤNG** trên Lark — Automation của Lark sẽ tự gọi vào web để gửi thư. Chỉ áp dụng cho ứng viên nộp qua bảng này (có cột Email); ứng viên "Tư vấn bán hàng" không có email nên không dùng được 3 thư này qua Lark, vẫn liên hệ qua điện thoại như hiện tại.

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
| `EMAIL_WEBHOOK_SECRET` | `66b30960e9ebddb82b8e0d890844034c03df0d7a3cc9a50b` (mã này mình đã tạo sẵn — copy y hệt, sẽ dùng lại ở bước 3) |

Xong **Redeploy** như mọi lần thêm biến môi trường khác.

## 3. Cấu hình Automation trong Lark (bảng DATA TUYỂN DỤNG)

Mở bảng **DATA TUYỂN DỤNG** trong Base → tìm biểu tượng **Automation** (thường ở thanh công cụ phía trên, biểu tượng hình tia sét ⚡) → **Create Automation** (hoặc "+ Tạo tự động hoá").

Tạo **3 automation riêng biệt**, mỗi cái theo mẫu sau:

### Automation 1 — Mời phỏng vấn

- **Trigger (Khi nào chạy):** "Record updated" / "Khi bản ghi được cập nhật" → chọn trường **Tình trạng**
- **Condition (Điều kiện, nếu Lark cho thêm điều kiện riêng ngoài trigger):** Tình trạng **bằng** `Chờ phỏng vấn`
- **Action (Hành động):** chọn **Send Webhook** / **Gửi Webhook HTTP** (nếu không thấy, tìm mục "Webhook" hoặc "HTTP Request" trong danh sách action — có thể cần bật tính năng này trong cài đặt Base trước)
  - Method: `POST`
  - URL: `https://tuyendung.jimto.vn/api/email/notify`
  - Header: `Content-Type: application/json`
  - Body (JSON) — bấm vào từng dấu `{{...}}` để chèn đúng trường dữ liệu của bản ghi (Lark thường có nút "chèn trường"/"insert field" ngay trong ô nhập):

```json
{
  "secret": "66b30960e9ebddb82b8e0d890844034c03df0d7a3cc9a50b",
  "type": "interview",
  "email": "{{Email}}",
  "name": "{{Họ và tên}}",
  "position": "{{Vị trí ứng tuyển}}",
  "details": "{{Ghi chú}}"
}
```

> `details` sẽ được đưa nguyên văn vào email — trước khi đổi Tình trạng sang "Chờ phỏng vấn", HR nên gõ vào ô **Ghi chú** thông tin buổi phỏng vấn, ví dụ: `Phỏng vấn lúc 9h00 thứ Hai 20/10/2026, tại văn phòng Jim Tồ - 306 Nguyễn Trãi, phường Hạc Thành.`

### Automation 2 — Từ chối

Giống hệt Automation 1, chỉ khác:
- Điều kiện: Tình trạng **bằng** `Không đạt`
- Body:
```json
{
  "secret": "66b30960e9ebddb82b8e0d890844034c03df0d7a3cc9a50b",
  "type": "reject",
  "email": "{{Email}}",
  "name": "{{Họ và tên}}",
  "position": "{{Vị trí ứng tuyển}}"
}
```

### Automation 3 — Xác nhận công việc + hẹn ngày bắt đầu

Giống Automation 1, chỉ khác:
- Điều kiện: Tình trạng **bằng** `Đã nhận việc`
- Body:
```json
{
  "secret": "66b30960e9ebddb82b8e0d890844034c03df0d7a3cc9a50b",
  "type": "offer",
  "email": "{{Email}}",
  "name": "{{Họ và tên}}",
  "position": "{{Vị trí ứng tuyển}}",
  "details": "{{Ghi chú}}"
}
```

> Tương tự Automation 1 — gõ vào **Ghi chú** thông tin ngày bắt đầu làm việc trước khi đổi Tình trạng, ví dụ: `Ngày bắt đầu làm việc: Thứ Hai, 03/11/2026. Vui lòng có mặt lúc 8h00 tại văn phòng để nhận việc.`

## 4. Kiểm tra thử

1. Vào Lark, đổi Tình trạng của **1 bản ghi test** (dùng email thật của bạn, không phải email ứng viên) sang `Chờ phỏng vấn`.
2. Kiểm tra hộp thư — email "Jim Tồ mời bạn tham gia phỏng vấn" phải tới trong vòng vài giây tới vài phút.
3. Lặp lại với `Không đạt` và `Đã nhận việc` để kiểm tra 2 thư còn lại.
4. Nếu không nhận được thư: vào Lark Automation xem lịch sử chạy ("Run history"/"Lịch sử") để biết đã gọi webhook chưa và Lark báo lỗi gì; nếu Lark báo đã gửi thành công nhưng không có thư, kiểm tra domain đã "Verified" trên Resend chưa.

## Lưu ý bảo mật

`EMAIL_WEBHOOK_SECRET` đóng vai trò như mật khẩu để chặn người lạ gọi thẳng vào `/api/email/notify` và gửi thư giả danh Jim Tồ. Không chia sẻ chuỗi này ra ngoài Lark Automation. Nếu nghi bị lộ, đổi giá trị mới trong Vercel + cập nhật lại cả 3 Automation trong Lark cho khớp.
