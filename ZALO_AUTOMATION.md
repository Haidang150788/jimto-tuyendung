# Luồng Zalo cho ứng viên tuyển dụng

Ứng viên nào cũng nhắn Zalo với **Minh Phương** (bot chạy trên tài khoản
Zalo riêng — xem project `zalo-recruit-bot`, thư mục anh em, ngoài repo
này) sau khi nộp hồ sơ trên web, không phân biệt vị trí. 4 loại kết quả
(từ chối CV / mời phỏng vấn / từ chối sau phỏng vấn / mời nhận việc) được
gửi qua Zalo, độc lập với việc ứng viên đó có email hay không (xem thêm
`EMAIL_AUTOMATION.md` cho kênh email song song).

**Nguyên tắc:** ứng viên phải nhắn cho Minh Phương trước (không bao giờ
nhắn trước cho người lạ) để tránh rủi ro tài khoản bị đánh dấu spam.

## Kiến trúc

```
Ứng viên bấm "Bấm vào đây" trên web (sau khi nộp hồ sơ, mọi vị trí)
  → nhắn số điện thoại cho Minh Phương
  → bot gọi GET /api/zalo/lookup (web) — tra theo số điện thoại ở CẢ 2
    bảng: "(NEW) Form tuyển dụng" (sales) và "DATA TUYỂN DỤNG" (còn lại)
  → Minh Phương tự động cảm ơn đã ứng tuyển (đúng tên vị trí thật); không
    khớp thì hỏi lại số

HR đổi cột trạng thái trong Lark — "Tình trạng" (DATA TUYỂN DỤNG) hoặc
"TRẠNG THÁI" ((NEW) Form tuyển dụng), 2 bảng có cùng bộ giá trị và cùng
cột "Phản hồi Zalo" để ghi lại kết quả
  → Lark Automation gọi POST /api/zalo/notify (web), kèm "table": "sales"
    hoặc "other" để hệ thống biết ghi lại đúng bảng
  → web xếp việc vào hàng đợi Redis
  → bot poll GET /api/zalo/pending, lấy UID đã lưu ở trên, gửi tin Zalo
  → bot gọi POST /api/zalo/mark-sent để ghi "Phản hồi Zalo" vào đúng bảng
```

Web **không** tự gửi Zalo — chỉ đóng vai trò tra cứu hồ sơ + hàng đợi. Việc
gửi thật sự do `zalo-recruit-bot` (chạy 24/7 trên máy Mac) thực hiện. Nếu
ứng viên chưa từng nhắn cho Minh Phương (chưa có UID đã lưu), bot bỏ qua,
ghi log, và báo vào group Lark — HR vẫn cần liên hệ trực tiếp cho trường
hợp đó.

Ứng viên "Tư vấn bán hàng" **không cần copy sang DATA TUYỂN DỤNG nữa** —
"(NEW) Form tuyển dụng" giờ tự vận hành automation riêng, độc lập.

## 1. Thêm biến môi trường vào Vercel

| Key | Value |
|---|---|
| `ZALO_WEBHOOK_SECRET` | đã có trong `.env.local` — copy y hệt, dùng lại ở bước 2 và trong `zalo-recruit-bot/.env` |
| `NEXT_PUBLIC_ZALO_BOT_PHONE` | `0839549997` |
| `LARK_ALERT_WEBHOOK_URL` | đã có trong `.env.local` — webhook group Lark báo lỗi tự động |
| `LARK_ALERT_WEBHOOK_SECRET` | đã có trong `.env.local` — chữ ký xác thực cho webhook trên |

Redeploy sau khi thêm.

## 2. Cấu hình Automation trong Lark

Tạo **4 automation** trên mỗi bảng (8 automation tổng cộng) — cùng cấu
trúc, chỉ khác trường nguồn dữ liệu và giá trị `"table"`.

- Action (cả 2 bảng): Send Webhook
  - Method: `POST`
  - URL: `https://tuyendung.jimto.vn/api/zalo/notify`
  - Header: `Content-Type: application/json`
  - Bấm "chèn trường" để lấy đúng token, **kể cả `{{Record ID}}`** (thường
    nằm trong nhóm trường hệ thống — nếu Lark không cho chèn được, bỏ dòng
    `recordId` đi, tin nhắn vẫn gửi bình thường, chỉ là cột "Phản hồi Zalo"
    không tự cập nhật).

### 2a. Bảng "DATA TUYỂN DỤNG" — trigger trường **Tình trạng**

**Automation 1 — Từ chối CV** (Tình trạng = `Không đạt CV`):
```json
{
  "secret": "<ZALO_WEBHOOK_SECRET>",
  "type": "cv_reject",
  "phone": "{{Sđt}}",
  "name": "{{Họ và tên}}",
  "position": "{{Vị trí ứng tuyển}}",
  "gender": "{{Giới tính}}",
  "recordId": "{{Record ID}}",
  "table": "other"
}
```

**Automation 2 — Mời phỏng vấn** (Tình trạng = `Hẹn phỏng vấn`): đổi `"type": "interview"`, thêm `"details": "{{Ghi chú}}"`.

**Automation 3 — Từ chối sau phỏng vấn** (Tình trạng = `Không đạt phỏng vấn`): đổi `"type": "interview_reject"`, không cần `details`.

**Automation 4 — Mời nhận việc** (Tình trạng = `Mời nhận viêc`): đổi `"type": "offer"`, thêm `"details": "{{Ghi chú}}"`.

### 2b. Bảng "(NEW) Form tuyển dụng" — trigger trường **TRẠNG THÁI**

Giống hệt 2a, chỉ khác tên trường nguồn (bảng này không có cột "Ghi chú"
chung — dùng "Ghi chú phỏng vấn" riêng) và `"table": "sales"`:

```json
{
  "secret": "<ZALO_WEBHOOK_SECRET>",
  "type": "cv_reject",
  "phone": "{{Số điện thoại liên hệ}}",
  "name": "{{Họ Tên}}",
  "position": "{{Vị trí ứng tuyển}}",
  "gender": "{{Giới tính}}",
  "recordId": "{{Record ID}}",
  "table": "sales"
}
```

4 automation tương ứng cùng điều kiện TRẠNG THÁI như 2a (`Không đạt CV` /
`Hẹn phỏng vấn` / `Không đạt phỏng vấn` / `Mời nhận viêc`), `interview` và
`offer` thêm `"details": "{{Ghi chú phỏng vấn}}"`.

> Tin nhắn "Mời phỏng vấn" không có dòng địa chỉ cố định — HR gõ **đầy đủ
> cả giờ, ngày lẫn địa điểm** vào ô Ghi chú (hoặc Ghi chú phỏng vấn) trước
> khi đổi trạng thái, ví dụ: `Hẹn phỏng vấn lúc 9h ngày 25/8/2026 tại 306
> Nguyễn Trãi phường Hạc Thành`.

> `<ZALO_WEBHOOK_SECRET>` khác `EMAIL_WEBHOOK_SECRET` — copy đúng chuỗi
> trong `.env.local`, đừng nhầm 2 secret này.

## 3. Triển khai bot

Xem `zalo-recruit-bot/README.md` — cài đặt, quét QR đăng nhập số Zalo riêng
("Minh Phương"), chạy bằng pm2.

## 4. Kiểm tra thử

1. Tự nộp 1 hồ sơ test qua web (vị trí bất kỳ) bằng số điện thoại của bạn.
2. Bấm "Bấm vào đây" (chỉ hiện khi đã điền `NEXT_PUBLIC_ZALO_BOT_PHONE`),
   nhắn Minh Phương một câu chào — phải được hỏi lại số điện thoại, gửi
   đúng số vừa đăng ký thì nhận được lời cảm ơn.
3. Đổi trạng thái bản ghi test đó (Tình trạng hoặc TRẠNG THÁI tuỳ bảng)
   sang giá trị tương ứng "Hẹn phỏng vấn" — phải nhận được tin Zalo trong
   vòng `POLL_INTERVAL_MS` (mặc định 20 giây), và cột "Phản hồi Zalo" của
   bản ghi tự chuyển thành "Đã hẹn phỏng vấn" (nếu automation có chèn
   `{{Record ID}}`).
4. Lặp lại với `Không đạt CV`, `Không đạt phỏng vấn`, `Mời nhận viêc`.
5. Nếu không nhận được: xem log bot (`pm2 logs zalo-recruit-bot`), group
   Lark báo lỗi, và lịch sử chạy Automation trong Lark.

## Lưu ý bảo mật

`ZALO_WEBHOOK_SECRET` chặn người lạ gọi thẳng vào `/api/zalo/notify`,
`/api/zalo/pending`, `/api/zalo/lookup`, `/api/zalo/mark-sent`. Không chia
sẻ ra ngoài Lark Automation và `zalo-recruit-bot/.env`. Nếu nghi bị lộ, đổi
giá trị mới trên Vercel + cả 8 Automation trong Lark + `.env` của bot cho
khớp.
