# Luồng Zalo cho ứng viên tuyển dụng

3 nhóm vị trí đi qua Zalo với **Minh Phương** (bot chạy trên tài khoản
Zalo riêng — xem project `zalo-recruit-bot`, thư mục anh em, ngoài repo
này), mỗi nhóm một cách đối xử khác nhau — xem `isZaloCtaPosition()` /
`isZaloOnlyPosition()` trong `sales-application-form.ts`:

- **"Tư vấn bán hàng"** — khối tư vấn viên, dùng form sàng lọc 2 bước
  riêng (bảng "(NEW) Form tuyển dụng"), không có email ngay từ đầu.
- **"Cửa hàng trưởng"** — vị trí văn phòng, dùng form văn phòng bình
  thường (email/CV, 1 bước), nhận **cả Zalo lẫn email song song** (quyết
  định 21/08/2026).
- **"Nhân viên kho"** — vị trí văn phòng, dùng form văn phòng bình
  thường, nhưng **Zalo thay thế hoàn toàn Email** (quyết định
  25/08/2026): form không hiện ô email, không bắt buộc, không trích từ CV;
  record tạo ra có "Phản hồi email" = `Không áp dụng` ngay từ đầu, và
  `/api/email/notify` tự bỏ qua êm (không báo lỗi) nếu Automation lỡ bắn
  vào vị trí này.

Các vị trí văn phòng còn lại (không thuộc 3 nhóm trên) chỉ dùng kênh email
(xem `EMAIL_AUTOMATION.md`) — CTA nhắn Minh Phương trên web không hiện với
họ, và cột "Phản hồi Zalo" được đặt sẵn `Không áp dụng` ngay lúc tạo bản
ghi (thay vì `Chưa bắt đầu`) để không bị hiểu nhầm là "đang chờ Zalo".

4 loại kết quả (từ chối CV / mời phỏng vấn / từ chối sau phỏng vấn / mời
nhận việc) được gửi qua Zalo cho cả 3 nhóm vị trí trên — riêng "Nhân viên
kho" thì đây là kênh DUY NHẤT, không có email dự phòng.

**Nguyên tắc gốc:** ứng viên nên nhắn cho Minh Phương trước. Từ 21/08/2026
có thêm ngoại lệ có chủ đích — xem mục "Nhắn trước (proactive nudge)" bên
dưới — quyết định sau khi đối chiếu thực tế vận hành "thu-ky-kim" (bot Zalo
nội bộ khác của Sếp, chủ động nhắn người lạ thường xuyên, chưa từng gặp
rủi ro).

## Kiến trúc

```
Ứng viên "Tư vấn bán hàng" bấm "Bấm vào đây" trên web (sau khi nộp hồ sơ)
  → nhắn số điện thoại cho Minh Phương
  → bot gọi GET /api/zalo/lookup (web) — tra theo số điện thoại ở CẢ 2
    bảng: "(NEW) Form tuyển dụng" (sales) và "DATA TUYỂN DỤNG" (còn lại,
    vẫn khớp được phòng khi có người lạc vào nhắn, dù CTA không mời họ)
  → Minh Phương tự động cảm ơn đã ứng tuyển (đúng tên vị trí thật); không
    khớp thì hỏi lại số

Nếu sau 15 phút ứng viên sales chưa tự nhắn — xem "Nhắn trước" bên dưới.

HR đổi cột trạng thái trong Lark — "Tình trạng" (DATA TUYỂN DỤNG) hoặc
"TRẠNG THÁI" ((NEW) Form tuyển dụng), 2 bảng có cùng bộ giá trị và cùng
cột "Phản hồi Zalo" để ghi lại kết quả
  → Lark Automation gọi POST /api/zalo/notify (web), kèm "table": "sales"
    hoặc "other" để hệ thống biết ghi lại đúng bảng
  → web xếp việc vào hàng đợi Redis
  → bot poll GET /api/zalo/pending, lấy UID đã lưu ở trên, gửi tin Zalo
  → bot gọi POST /api/zalo/mark-sent để ghi "Phản hồi Zalo" vào đúng bảng
```

## Nhắn trước (proactive nudge)

Áp dụng cho mọi vị trí có Zalo — `findStaleZaloApplications()` trong
`src/lib/lark.ts` quét cả bảng "(NEW) Form tuyển dụng" (toàn bộ, luôn là
sales) lẫn bảng "DATA TUYỂN DỤNG" (chỉ lọc ra "Cửa hàng trưởng" và "Nhân
viên kho" qua `isZaloCtaPosition()` — các vị trí văn phòng khác không có
Zalo nên không bao giờ khớp). Ứng viên có "Phản hồi Zalo" == `Chưa bắt
đầu` (giá trị mặc định lúc tạo bản ghi) và "Submitted on" đã quá 15 phút
được coi là chưa tự liên hệ, bot sẽ chủ động nhắn trước. Với "Nhân viên
kho" đây đặc biệt quan trọng vì Zalo là kênh liên lạc DUY NHẤT — ứng viên
im lặng 15 phút mà không được nhắn trước thì coi như mất liên lạc hoàn
toàn, không có email dự phòng.

```
bot poll GET /api/zalo/nudge-candidates mỗi NUDGE_POLL_INTERVAL_MS (mặc
định 5 phút) — web lọc sẵn điều kiện 15 phút + "Chưa bắt đầu"
  → với mỗi ứng viên: bot gọi api.findUser(phone) lấy UID Zalo, rồi
    api.sendFriendRequest(msg, uid) — vì hai bên CHƯA từng nhắn nên chưa
    phải bạn bè, không dùng sendMessage được (xem sendProactiveNudge())
  → thành công: lưu UID vào candidates.json như bình thường (để nếu họ
    trả lời, bot xử lý qua đúng luồng hội thoại có sẵn), gọi mark-sent
    với type "proactive_nudge" → cột "Phản hồi Zalo" thành "Đã nhắn
    trước" (không còn == "Chưa bắt đầu" nữa, tự động không bị nhắn lại)
  → thất bại (không tìm thấy trên Zalo, bị chặn, lỗi mạng...): mark-sent
    với type "proactive_nudge_failed" → "Lỗi nhắn trước - cần gọi điện",
    báo group Lark để HR gọi tay
```

Nội dung: cảm ơn đã nộp hồ sơ + hứa phản hồi khi có thông tin từ bộ phận
tuyển dụng (không hẹn thời gian cụ thể). Xoay vòng 3 cách diễn đạt khác
nhau (`NUDGE_MESSAGE_VARIANTS` trong `zalo-recruit-bot/src/index.js`) để
nội dung không lặp y hệt giữa các lần gửi.

**Giới hạn an toàn** (env, có default, đặt trong `zalo-recruit-bot/.env`
nếu muốn đổi):
- `DAILY_NUDGE_LIMIT` (mặc định `10`) — tối đa số tin chủ động/ngày, tính
  theo giờ Việt Nam, lưu trong `zalo-recruit-bot/data/nudge-log.json`.
  Ứng viên vượt quá giới hạn ngày đó vẫn còn "Chưa bắt đầu", sẽ được nhắn
  vào lượt poll của ngày hôm sau.
- `NUDGE_POLL_INTERVAL_MS` (mặc định `300000` = 5 phút).
- Nếu nhiều ứng viên đủ điều kiện cùng lúc, bot rải ngẫu nhiên 5–15 giây
  giữa mỗi lượt gửi thay vì bắn liên tiếp.

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
