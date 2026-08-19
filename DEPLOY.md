# Hướng dẫn deploy — Jim Tồ Tuyển dụng

Web này (Next.js) sẽ host trên **Vercel** (miễn phí, tối ưu sẵn cho Next.js), tên miền vẫn mua/quản lý ở **tenten.vn** — chỉ cần trỏ DNS từ tenten.vn sang Vercel.

## 1. Đưa code lên GitHub

Repo hiện đang trỏ về repo của template gốc (`JCodesMore/ai-website-cloner-template`) — cần đổi sang repo riêng của bạn trước khi deploy.

1. Tạo tài khoản GitHub (nếu chưa có): https://github.com/signup
2. Tạo repo mới, **để trống** (không tick thêm README/.gitignore) — ví dụ đặt tên `jimto-tuyendung`.
3. Chạy trong thư mục `website-clone`:

```bash
git remote set-url origin https://github.com/<tên-github-của-bạn>/jimto-tuyendung.git
git add -A
git commit -m "Chuẩn bị deploy"
git push -u origin master
```

## 2. Deploy lên Vercel

1. Tạo tài khoản tại https://vercel.com (đăng nhập bằng GitHub luôn cho tiện).
2. Bấm **Add New → Project**, chọn repo `jimto-tuyendung` vừa tạo → **Import**.
3. Ở bước cấu hình, thêm các **Environment Variable** sau (lấy giá trị y hệt trong file `.env.local` trên máy bạn):
   - `ADMIN_PASSWORD` = mật khẩu bạn muốn dùng để đăng nhập `/admin` (đổi khác mật khẩu demo `jimto-hr-2026` cho chắc ăn).
   - `LARK_APP_ID`, `LARK_APP_SECRET`, `LARK_BASE_APP_TOKEN`, `LARK_TABLE_NAME_SALES`, `LARK_TABLE_NAME_OTHER` — để nút "Ứng tuyển" gửi hồ sơ vào đúng bảng Lark (vị trí "Nhân viên tư vấn bán hàng" vào bảng screening riêng, các vị trí khác vào bảng chung). Thiếu biến nào thì gửi hồ sơ cho nhóm vị trí tương ứng sẽ báo lỗi.
4. Bấm **Deploy**. Sau ~1 phút sẽ có link dạng `jimto-tuyendung.vercel.app` — mở thử để chắc trang chạy được.

## 3. Bật lưu trữ để Admin lưu được thật (bắt buộc)

Nếu bỏ qua bước này, HR vào `/admin` sửa tin tuyển dụng sẽ báo lỗi "Không lưu được lên máy chủ" — vì chưa có nơi lưu dữ liệu.

1. Trong project vừa tạo trên Vercel → tab **Storage**.
2. Tạo một **Redis** database (Vercel dùng Upstash) — làm theo hướng dẫn trên màn hình, chọn gói Free.
3. Bấm **Connect** để gắn database vào project — Vercel sẽ **tự động** thêm 2 biến môi trường `KV_REST_API_URL` và `KV_REST_API_TOKEN` vào project, không cần tự nhập.
4. Vào tab **Deployments** → bấm **Redeploy** ở bản deploy mới nhất để áp dụng biến môi trường mới.

## 4. Trỏ tên miền tenten.vn sang Vercel

1. Trong project trên Vercel → **Settings → Domains** → nhập tên miền của bạn (ví dụ `tuyendung.tencongty.vn` hoặc domain gốc) → **Add**.
2. Vercel sẽ hiện ra các bản ghi DNS cần thêm — thường là:
   - Domain gốc (`tencongty.vn`): thêm bản ghi **A** trỏ tới IP Vercel đưa ra.
   - Subdomain (`www` hoặc `tuyendung`): thêm bản ghi **CNAME** trỏ tới giá trị Vercel đưa ra (dạng `cname.vercel-dns.com`).
3. Đăng nhập vào tenten.vn → vào phần quản lý DNS của tên miền → thêm đúng các bản ghi Vercel yêu cầu ở bước 2 (KHÔNG cần đổi Nameserver, chỉ cần thêm bản ghi).
4. Chờ 5–30 phút để DNS cập nhật (đôi khi lâu hơn), sau đó tên miền sẽ trỏ vào website. Vercel tự cấp SSL (https) miễn phí, không cần làm gì thêm.

## 5. Kiểm tra sau khi deploy

- Vào trang chủ bằng tên miền thật, xem danh sách việc làm hiển thị đúng.
- Vào `/admin`, đăng nhập bằng `ADMIN_PASSWORD` đã đặt ở bước 2.
- Thử thêm 1 tin test, mở trang chủ bằng **trình duyệt/máy khác** (hoặc điện thoại) xem tin đó có hiện ra không — nếu có nghĩa là đã lưu đúng lên server, mọi người xem đều thấy.
- Xoá tin test đi.
- Bấm thử "Ứng tuyển" ở 1 tin, điền form test, gửi — kiểm tra bảng "Danh sách ứng tuyển qua web" trên Lark có bản ghi mới không. Xoá bản ghi test đó trong Lark sau khi kiểm tra xong.

## Sau này muốn sửa nội dung Trang chủ / Giới thiệu / Giá trị cốt lõi / Footer

Các phần này chưa có giao diện Admin (chỉ Việc làm mới có, theo yêu cầu). Muốn đổi thì sửa trực tiếp trong `src/lib/site-content.ts`, commit, rồi `git push` — Vercel tự động deploy lại bản mới sau vài chục giây.

Redis chỉ lưu **danh sách việc làm**. Mọi phần khác luôn đọc từ `site-content.ts`, nên sửa file rồi push là hiện ra ngay, không bị dữ liệu cũ trong Redis đè lên.
