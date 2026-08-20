# Luồng Zalo cho ứng viên "Tư vấn bán hàng"

Vị trí "Tư vấn bán hàng" không thu email (xem `EMAIL_AUTOMATION.md`), nên 3
loại kết quả (mời phỏng vấn / từ chối / xác nhận công việc) được gửi qua
**Zalo cá nhân** thay vì email, dùng một bot riêng chạy trên tài khoản Zalo
riêng ("Minh Phương") — xem project `zalo-recruit-bot` (thư mục anh em,
ngoài repo này).

**Nguyên tắc:** ứng viên phải nhắn cho Minh Phương trước (không bao giờ
nhắn trước cho người lạ) để tránh rủi ro tài khoản bị đánh dấu spam.

## Kiến trúc

```
Ứng viên bấm "Nhắn Zalo với Minh Phương" trên web (sau khi nộp hồ sơ)
  → nhắn số điện thoại cho Minh Phương
  → bot gọi GET /api/zalo/lookup (web) để xác nhận hồ sơ khớp số điện
    thoại đã đăng ký trong "(NEW) Form tuyển dụng", lưu UID Zalo
  → Minh Phương tự động cảm ơn đã ứng tuyển; không khớp thì hỏi lại số

HR đổi cột "Tình trạng" trong Lark (bảng "DATA TUYỂN DỤNG" — CÙNG bảng và
CÙNG cột dùng cho automation gửi email, xem EMAIL_AUTOMATION.md)
  → Lark Automation gọi POST /api/zalo/notify (web)
  → web xếp việc vào hàng đợi Redis
  → bot poll GET /api/zalo/pending, lấy UID đã lưu ở trên, gửi tin Zalo
```

Web **không** tự gửi Zalo — chỉ đóng vai trò tra cứu hồ sơ + hàng đợi. Việc
gửi thật sự do `zalo-recruit-bot` (chạy 24/7 trên máy Mac) thực hiện. Nếu
ứng viên chưa từng nhắn cho Minh Phương (chưa có UID đã lưu), bot bỏ qua
và ghi log — HR vẫn cần gọi điện cho trường hợp đó như quy trình cũ.

## 1. Thêm biến môi trường vào Vercel

| Key | Value |
|---|---|
| `ZALO_WEBHOOK_SECRET` | đã tạo sẵn trong `.env.local` — copy y hệt, dùng lại ở bước 2 và trong `zalo-recruit-bot/.env` |
| `NEXT_PUBLIC_ZALO_BOT_PHONE` | để trống cho tới khi có SIM/số Zalo riêng cho bot — điền vào rồi mới thấy CTA "Nhắn Zalo" trên web |

Redeploy sau khi thêm.

## 2. Cấu hình Automation trong Lark (bảng "DATA TUYỂN DỤNG")

**Dùng chung trigger với 3 Automation gửi email đã có sẵn** (xem
`EMAIL_AUTOMATION.md`) — không tạo automation mới, chỉ **thêm 1 action Send
Webhook thứ hai** vào mỗi automation hiện có, gọi sang `/api/zalo/notify`.
Cách này để một lần đổi "Tình trạng" tự lo cả 2 kênh: ứng viên có email thì
nhận email, ứng viên chỉ có số điện thoại (Tư vấn bán hàng) thì nhận Zalo —
bot tự bỏ qua nếu ứng viên đó không có trong danh sách đã nhắn Zalo, nên an
toàn để thêm action này cho mọi bản ghi, không cần lọc riêng theo vị trí.

Vào từng automation trong 3 automation đã tạo (Mời phỏng vấn / Từ chối /
Xác nhận công việc) → **Add Action** → **Send Webhook** thêm:

- Method: `POST`
- URL: `https://tuyendung.jimto.vn/api/zalo/notify`
- Header: `Content-Type: application/json`
- Body — 3 automation dùng đúng điều kiện trigger đã có (Tình trạng bằng
  `Chờ phỏng vấn` / `Không đạt` / `Đã nhận việc`), chỉ khác `type`:

**Automation 1 — Mời phỏng vấn** (Tình trạng = `Chờ phỏng vấn`):
```json
{
  "secret": "<ZALO_WEBHOOK_SECRET>",
  "type": "interview",
  "phone": "{{Sđt}}",
  "name": "{{Họ và tên}}",
  "position": "{{Vị trí ứng tuyển}}",
  "details": "{{Ghi chú}}",
  "gender": "{{Giới tính}}"
}
```

**Automation 2 — Từ chối** (Tình trạng = `Không đạt`): đổi `"type": "reject"`, bỏ `details`.

**Automation 3 — Xác nhận công việc** (Tình trạng = `Đã nhận việc`): đổi `"type": "offer"`, `details` nên ghi ngày bắt đầu làm việc.

> `<ZALO_WEBHOOK_SECRET>` giống hệt giá trị đã dùng cho automation email —
> copy y hệt chuỗi trong `.env.local` (khác `EMAIL_WEBHOOK_SECRET`, đừng
> nhầm 2 secret này).

## 3. Triển khai bot

Xem `zalo-recruit-bot/README.md` — cài đặt, quét QR đăng nhập số Zalo riêng
("Minh Phương"), chạy bằng pm2.

## 4. Kiểm tra thử

1. Tự nộp 1 hồ sơ test qua form "Tư vấn bán hàng" trên web bằng số điện
   thoại của bạn.
2. Bấm CTA "Nhắn Zalo với Minh Phương" (chỉ hiện khi đã điền
   `NEXT_PUBLIC_ZALO_BOT_PHONE`), nhắn đúng số điện thoại đó — phải nhận
   được lời cảm ơn ngay.
3. Thêm 1 bản ghi test vào "DATA TUYỂN DỤNG" với đúng số điện thoại đó
   (Sđt), đổi Tình trạng sang `Chờ phỏng vấn` — phải nhận được tin Zalo
   trong vòng `POLL_INTERVAL_MS` (mặc định 20 giây).
4. Lặp lại với `Không đạt` và `Đã nhận việc`.
5. Nếu không nhận được: xem log bot (`pm2 logs zalo-recruit-bot`) và lịch
   sử chạy Automation trong Lark.

## Lưu ý bảo mật

`ZALO_WEBHOOK_SECRET` chặn người lạ gọi thẳng vào `/api/zalo/notify`,
`/api/zalo/pending`, `/api/zalo/lookup`. Không chia sẻ ra ngoài Lark
Automation và `zalo-recruit-bot/.env`. Nếu nghi bị lộ, đổi giá trị mới trên
Vercel + cả 3 Automation trong Lark + `.env` của bot cho khớp.
