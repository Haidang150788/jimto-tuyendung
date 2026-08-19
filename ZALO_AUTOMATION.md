# Luồng Zalo cho ứng viên "Tư vấn bán hàng"

Vị trí "Tư vấn bán hàng" không thu email (xem `EMAIL_AUTOMATION.md`), nên 3
loại kết quả (mời phỏng vấn / từ chối / xác nhận công việc) được gửi qua
**Zalo cá nhân** thay vì email, dùng một bot riêng chạy trên tài khoản Zalo
riêng — xem project `zalo-recruit-bot` (thư mục anh em, ngoài repo này).

**Nguyên tắc:** ứng viên phải nhắn cho bot trước (không bao giờ nhắn trước
cho người lạ) để tránh rủi ro tài khoản bị đánh dấu spam.

## Kiến trúc

```
Ứng viên bấm "Nhắn Zalo" trên web (sau khi nộp hồ sơ)
  → nhắn số điện thoại cho bot
  → bot gọi GET /api/zalo/lookup (web) để xác nhận hồ sơ, lưu UID Zalo

HR đổi cột "TRẠNG THÁI" trong Lark (bảng "(NEW) Form tuyển dụng")
  → Lark Automation gọi POST /api/zalo/notify (web)
  → web xếp việc vào hàng đợi Redis
  → bot poll GET /api/zalo/pending, lấy UID đã lưu ở trên, gửi tin Zalo
```

Web **không** tự gửi Zalo — chỉ đóng vai trò tra cứu hồ sơ + hàng đợi. Việc
gửi thật sự do `zalo-recruit-bot` (chạy 24/7 trên máy Mac) thực hiện.

## 1. Thêm biến môi trường vào Vercel

| Key | Value |
|---|---|
| `ZALO_WEBHOOK_SECRET` | đã tạo sẵn trong `.env.local` — copy y hệt, dùng lại ở bước 2 và trong `zalo-recruit-bot/.env` |
| `NEXT_PUBLIC_ZALO_BOT_PHONE` | để trống cho tới khi có SIM/số Zalo riêng cho bot — điền vào rồi mới thấy CTA "Nhắn Zalo" trên web |

Redeploy sau khi thêm.

## 2. Cấu hình Automation trong Lark (bảng "(NEW) Form tuyển dụng")

Cột trạng thái ở bảng này tên là **TRẠNG THÁI** (khác "Tình trạng" ở bảng
DATA TUYỂN DỤNG — đã kiểm tra trực tiếp qua API, không phải đoán). Các giá
trị đang có trong cột này: `Đã hẹn lịch PV`, `Không phù hợp`,
`Đã chốt ngày thử việc`, cùng vài trạng thái trung gian khác
(`Đã phỏng vấn-chưa chốt`, `Liên hệ lần 1/2 không được`) không cần automation.

Mở bảng → **Automation** → tạo **3 automation riêng biệt**:

### Automation 1 — Mời phỏng vấn
- Trigger: Record updated → trường **TRẠNG THÁI**
- Điều kiện: TRẠNG THÁI **bằng** `Đã hẹn lịch PV`
- Action: Send Webhook
  - Method: `POST`
  - URL: `https://tuyendung.jimto.vn/api/zalo/notify`
  - Header: `Content-Type: application/json`
  - Body:
```json
{
  "secret": "<ZALO_WEBHOOK_SECRET>",
  "type": "interview",
  "phone": "{{Số điện thoại liên hệ}}",
  "name": "{{Họ Tên}}",
  "position": "Tư vấn bán hàng",
  "details": "{{Đã gọi}}"
}
```
> Gõ thông tin buổi phỏng vấn (giờ, địa điểm) vào ô ghi chú mà HR đang dùng
> cho bảng này trước khi đổi trạng thái — chèn đúng field đó thay cho
> `{{Đã gọi}}` nếu HR dùng cột khác để ghi chú.

### Automation 2 — Từ chối
Giống Automation 1, khác:
- Điều kiện: TRẠNG THÁI **bằng** `Không phù hợp`
- Body: đổi `"type": "reject"`, bỏ `details`.

### Automation 3 — Xác nhận công việc
Giống Automation 1, khác:
- Điều kiện: TRẠNG THÁI **bằng** `Đã chốt ngày thử việc`
- Body: đổi `"type": "offer"`, `details` nên ghi ngày bắt đầu làm việc.

## 3. Triển khai bot

Xem `zalo-recruit-bot/README.md` — cài đặt, quét QR đăng nhập số Zalo riêng,
chạy bằng pm2.

## 4. Kiểm tra thử

1. Tự nộp 1 hồ sơ test qua form "Tư vấn bán hàng" trên web bằng số điện
   thoại của bạn.
2. Bấm CTA "Nhắn Zalo" (chỉ hiện khi đã điền `NEXT_PUBLIC_ZALO_BOT_PHONE`),
   nhắn đúng số điện thoại đó cho bot — phải nhận được xác nhận ngay.
3. Đổi TRẠNG THÁI bản ghi test đó sang `Đã hẹn lịch PV` trong Lark — phải
   nhận được tin Zalo trong vòng `POLL_INTERVAL_MS` (mặc định 20 giây).
4. Lặp lại với `Không phù hợp` và `Đã chốt ngày thử việc`.
5. Nếu không nhận được: xem log bot (`pm2 logs zalo-recruit-bot`) và lịch
   sử chạy Automation trong Lark.

## Lưu ý bảo mật

`ZALO_WEBHOOK_SECRET` chặn người lạ gọi thẳng vào `/api/zalo/notify`,
`/api/zalo/pending`, `/api/zalo/lookup`. Không chia sẻ ra ngoài Lark
Automation và `zalo-recruit-bot/.env`. Nếu nghi bị lộ, đổi giá trị mới trên
Vercel + cả 3 Automation trong Lark + `.env` của bot cho khớp.
