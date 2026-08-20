# Luồng Zalo cho ứng viên "Tư vấn bán hàng"

Vị trí "Tư vấn bán hàng" không thu email, nên 4 loại kết quả (từ chối CV /
mời phỏng vấn / từ chối sau phỏng vấn / mời nhận việc) được gửi qua **Zalo
cá nhân** thay vì email, dùng một bot riêng chạy trên tài khoản Zalo riêng
("Minh Phương") — xem project `zalo-recruit-bot` (thư mục anh em, ngoài
repo này).

**Nguyên tắc:** ứng viên phải nhắn cho Minh Phương trước (không bao giờ
nhắn trước cho người lạ) để tránh rủi ro tài khoản bị đánh dấu spam.

## Kiến trúc

```
Ứng viên bấm "Nhắn Zalo với Minh Phương" trên web (sau khi nộp hồ sơ)
  → nhắn số điện thoại cho Minh Phương
  → bot gọi GET /api/zalo/lookup (web) để xác nhận hồ sơ khớp số điện
    thoại đã đăng ký trong "(NEW) Form tuyển dụng", lưu UID Zalo
  → Minh Phương tự động cảm ơn đã ứng tuyển; không khớp thì hỏi lại số

HR đổi cột "Tình trạng" trong Lark (bảng "DATA TUYỂN DỤNG")
  → Lark Automation gọi POST /api/zalo/notify (web)
  → web xếp việc vào hàng đợi Redis
  → bot poll GET /api/zalo/pending, lấy UID đã lưu ở trên, gửi tin Zalo
  → bot gọi POST /api/zalo/mark-sent để ghi lại "Phản hồi Zalo"
```

Web **không** tự gửi Zalo — chỉ đóng vai trò tra cứu hồ sơ + hàng đợi. Việc
gửi thật sự do `zalo-recruit-bot` (chạy 24/7 trên máy Mac) thực hiện. Nếu
ứng viên chưa từng nhắn cho Minh Phương (chưa có UID đã lưu), bot bỏ qua,
ghi log, và báo vào group Lark — HR vẫn cần gọi điện cho trường hợp đó.

Lưu ý: bảng "DATA TUYỂN DỤNG" dùng chung cho cả ứng viên có email (nhận
email — xem `EMAIL_AUTOMATION.md`) lẫn ứng viên "Tư vấn bán hàng" (nhận
Zalo). Cột **Tình trạng** hiện có các giá trị dùng cho Zalo:
`Không đạt CV`, `Hẹn phỏng vấn`, `Không đạt phỏng vấn`, `Mời nhận viêc`
(giữ nguyên chính tả "viêc" — đúng tên option đang có trong Lark, đừng gõ
lại "việc" vì Lark sẽ coi là 2 option khác nhau).

## 1. Thêm biến môi trường vào Vercel

| Key | Value |
|---|---|
| `ZALO_WEBHOOK_SECRET` | đã có trong `.env.local` — copy y hệt, dùng lại ở bước 2 và trong `zalo-recruit-bot/.env` |
| `NEXT_PUBLIC_ZALO_BOT_PHONE` | `0839549997` |
| `LARK_ALERT_WEBHOOK_URL` | đã có trong `.env.local` — webhook group Lark báo lỗi tự động |
| `LARK_ALERT_WEBHOOK_SECRET` | đã có trong `.env.local` — chữ ký xác thực cho webhook trên |

Redeploy sau khi thêm.

## 2. Cấu hình Automation trong Lark (bảng "DATA TUYỂN DỤNG")

Tạo **4 automation riêng biệt** (khác số loại với 3 automation email, nên
không dùng chung được nữa — xem ghi chú cuối mục này):

- Trigger: Record updated → trường **Tình trạng**
- Action: Send Webhook
  - Method: `POST`
  - URL: `https://tuyendung.jimto.vn/api/zalo/notify`
  - Header: `Content-Type: application/json`
  - Body — bấm "chèn trường" để lấy đúng token, **kể cả `{{Record ID}}`**
    (thường nằm trong nhóm trường hệ thống, không phải nhóm cột dữ liệu
    thường — nếu Lark không cho chèn được, bỏ dòng `recordId` đi, mọi thứ
    khác vẫn chạy bình thường, chỉ là cột "Phản hồi Zalo" sẽ không được
    tự cập nhật):

**Automation 1 — Từ chối CV** (Tình trạng = `Không đạt CV`):
```json
{
  "secret": "<ZALO_WEBHOOK_SECRET>",
  "type": "cv_reject",
  "phone": "{{Sđt}}",
  "name": "{{Họ và tên}}",
  "position": "{{Vị trí ứng tuyển}}",
  "gender": "{{Giới tính}}",
  "recordId": "{{Record ID}}"
}
```

**Automation 2 — Mời phỏng vấn** (Tình trạng = `Hẹn phỏng vấn`): đổi `"type": "interview"`, thêm `"details": "{{Ghi chú}}"` (gõ giờ/ngày phỏng vấn vào Ghi chú trước khi đổi Tình trạng).

**Automation 3 — Từ chối sau phỏng vấn** (Tình trạng = `Không đạt phỏng vấn`): đổi `"type": "interview_reject"`, không cần `details`.

**Automation 4 — Mời nhận việc** (Tình trạng = `Mời nhận viêc`): đổi `"type": "offer"`, thêm `"details": "{{Ghi chú}}"` (gõ thời gian thử việc vào Ghi chú trước khi đổi Tình trạng).

> `<ZALO_WEBHOOK_SECRET>` khác `EMAIL_WEBHOOK_SECRET` — copy đúng chuỗi
> trong `.env.local`, đừng nhầm 2 secret này.

> **Vì sao không dùng chung với 3 automation email:** hai bên hiện có số
> loại kết quả khác nhau (email 3 loại theo nội dung cũ, Zalo 4 loại theo
> nội dung Sếp vừa gửi) và cũng có thể đang trỏ vào giá trị Tình trạng
> khác nhau. Khi có nội dung email mới, nên rà lại cả 2 bên cho khớp số
> loại và giá trị Tình trạng, tránh 1 trạng thái vô tình bắn 2 automation
> gửi 2 nội dung không tương ứng.

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
   (Sđt), đổi Tình trạng sang `Hẹn phỏng vấn` — phải nhận được tin Zalo
   trong vòng `POLL_INTERVAL_MS` (mặc định 20 giây), và cột "Phản hồi
   Zalo" của bản ghi đó tự chuyển thành "Đã hẹn phỏng vấn" (nếu automation
   có chèn `{{Record ID}}`).
4. Lặp lại với `Không đạt CV`, `Không đạt phỏng vấn`, `Mời nhận viêc`.
5. Nếu không nhận được: xem log bot (`pm2 logs zalo-recruit-bot`), group
   Lark báo lỗi, và lịch sử chạy Automation trong Lark.

## Lưu ý bảo mật

`ZALO_WEBHOOK_SECRET` chặn người lạ gọi thẳng vào `/api/zalo/notify`,
`/api/zalo/pending`, `/api/zalo/lookup`, `/api/zalo/mark-sent`. Không chia
sẻ ra ngoài Lark Automation và `zalo-recruit-bot/.env`. Nếu nghi bị lộ, đổi
giá trị mới trên Vercel + cả 4 Automation trong Lark + `.env` của bot cho
khớp.
