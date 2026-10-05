# Owllee Skill Web

Prototype giao diện quản lý Skill của Owllee Agent, dùng React 18, Vite, Ant Design,
Tailwind CSS và Monaco Editor. Ứng dụng gọi API thật của `owlla_backend` và đăng nhập
bằng cookie; không có chế độ mock dữ liệu.

## Yêu cầu

- Node.js **24.x** theo `.nvmrc` và `package.json`, kèm npm.
- Backend mặc định: `https://owlla-dev.ih1.thinklabs.com.vn`; có thể đổi sang backend local.
- Tài khoản đăng nhập hợp lệ trên backend.
- Nếu kiểm tra upload ZIP: cần worker Celery xử lý queue `skill_scan` và sandbox của backend.

## Chạy nhanh frontend

Mở terminal tại thư mục `design-web/skill-web`.

Nếu dùng nvm, chọn phiên bản Node theo dự án:

```bash
nvm install
nvm use
```

Nếu không dùng nvm, cài Node.js 24.x và kiểm tra bằng `node --version`.

Cài thư viện theo lockfile và tạo cấu hình local nếu chưa có:

```bash
npm ci
test -f .env || cp .env.example .env
```

Trong `.env`, đặt địa chỉ backend:

```dotenv
DOMAIN_BE=https://owlla-dev.ih1.thinklabs.com.vn
```

Không thêm `/api` vào cuối domain. Để dùng backend local, đặt
`DOMAIN_BE=http://localhost:5055` (thay cổng theo backend). Nếu `.env` đã tồn tại,
sửa giá trị trong file đó. `DEV_PROXY_TARGET` vẫn được hỗ trợ khi không có `DOMAIN_BE`.

Khởi động frontend:

```bash
npm run dev
```

Mở [http://localhost:5180](http://localhost:5180), đăng nhập rồi vào mục **Skill**.
Nếu tài khoản bật 2FA, ứng dụng sẽ yêu cầu mã xác thực.

Vite có thể chọn cổng tiếp theo nếu `5180` đang được sử dụng. Xem URL trong terminal,
hoặc yêu cầu đúng cổng và báo lỗi khi cổng bận:

```bash
npm run dev -- --port 5180 --strictPort
```

Dừng server bằng `Ctrl+C`. Sau khi thay đổi `.env`, dừng và chạy lại Vite.

## Chạy backend và worker

Backend mặc định dùng server dev ở domain trên, không cần chạy backend local.
Nếu dùng backend khác, đặt `DOMAIN_BE` trỏ tới backend đó. Các lệnh dưới đây dành cho cấu trúc thư mục hiện tại:

```text
Thinklabs/
├── owlla_backend/
└── design-web/
    └── skill-web/
```

Backend có môi trường và `.env` riêng. Làm theo `owlla_backend/README.md` để chuẩn bị
Python 3.11, uv, các thư viện và kết nối MongoDB, Redis, MinIO cùng những dịch vụ mà
backend yêu cầu. `.env` của frontend không thay thế cấu hình backend.

**Terminal 1 — API**, bắt đầu từ thư mục `skill-web`:

```bash
cd ../../owlla_backend
uv run main.py
```

Địa chỉ API lấy theo `HOST`/`PORT` của backend; để chạy local có thể dùng
`DOMAIN_BE=http://localhost:5055`.

**Terminal 2 — worker quét upload**, cũng bắt đầu từ thư mục `skill-web`:

```bash
cd ../../owlla_backend
uv run celery -A worker_config.celery_config.celery_app worker -Q skill_scan --concurrency=2 --loglevel=info
```

Worker cần kết nối Redis của backend. Luồng quét ZIP còn cần cấu hình sandbox trong
backend, gồm `SANDBOX_API_URL`, `SANDBOX_API_KEY`, `SANDBOX_SESSION_SECRET`.
Thiếu worker có thể khiến upload chờ xử lý; sandbox lỗi có thể khiến upload thử lại
rồi chuyển sang trạng thái lỗi. Xem log worker và **Lịch sử upload** để biết nguyên nhân.

**Terminal 3 — frontend:** chạy `npm run dev` tại thư mục `skill-web`.

## Cách frontend kết nối API

```text
Trình duyệt → localhost:5180/api/... → Vite proxy → DOMAIN_BE/api/...
```

- Proxy `/api` trong `vite.config.mjs` ưu tiên `DOMAIN_BE`, sau đó đến `DEV_PROXY_TARGET`.
- Proxy xác minh chứng chỉ HTTPS và chuyển cookie domain của backend về hostname frontend.
- Axios gửi cookie bằng `withCredentials`.
- Khi API trả `401`, frontend thử làm mới phiên qua `/api/refresh`; nếu thất bại,
  ứng dụng chuyển về trang đăng nhập.
- Dùng nhất quán hostname khi mở frontend, tránh đổi qua lại giữa `localhost` và
  `127.0.0.1` trong cùng phiên đăng nhập.
- Monaco Editor và worker được tải từ app, không phụ thuộc CDN bên ngoài.

## Các lệnh

| Lệnh | Mục đích |
|---|---|
| `npm ci` | Cài thư viện theo `package-lock.json` |
| `npm run dev` | Chạy server phát triển, mặc định cổng 5180 |
| `npm run build` | Tạo bản build trong `dist/` |
| `npm run preview` | Xem thử bản build, mặc định cổng 4173 |

Xem thử bản build:

```bash
npm run build
npm run preview
```

Mở URL mà terminal hiển thị, thường là [http://localhost:4173](http://localhost:4173).
Backend vẫn cần hoạt động; preview kế thừa proxy `/api` của cấu hình Vite.
Cookie không phân biệt cổng, nên phiên đăng nhập trên cùng hostname có thể được dùng chung.

`vite preview` dùng để kiểm tra local. Khi đưa `dist/` lên máy chủ thật, cấu hình
reverse proxy `/api` tới backend và fallback các route frontend về `index.html`.
Biến `DOMAIN_BE`/`DEV_PROXY_TARGET` không tự tạo proxy cho máy chủ phục vụ file tĩnh.

Hiện dự án chưa khai báo script `test` hoặc `lint`. Build có thể báo cảnh báo chunk
lớn do các thư viện giao diện và editor; cảnh báo này không đồng nghĩa build thất bại.

## Các trang chính

| Đường dẫn | Nội dung |
|---|---|
| `/login` | Đăng nhập và xác thực 2FA |
| `/skills` | Danh sách Skill |
| `/skills/uploads` | Lịch sử upload |
| `/skills/:id` | Chi tiết Skill, mặc định mở trình soạn thảo |
| `/skills/:id?tab=info` | Thông tin Skill và kết quả quét |

Các mục sidebar ngoài Skill chủ yếu là trang giữ chỗ trong prototype.
Trang chi tiết đã bỏ hàng 4 thẻ thống kê theo quyết định ghi trong `PLAN.md`.

## Kiểm tra sau khi chạy

1. Đăng nhập và mở được danh sách Skill.
2. Mở một Skill, kiểm tra cây file và nội dung `SKILL.md`.
3. Chuyển giữa **Trình soạn thảo** và **Thông tin**.
4. Trên Skill dùng để thử nghiệm, sửa nội dung nhưng chưa lưu rồi bấm sidebar hoặc
   Back: phải xuất hiện xác nhận; chọn **Ở lại** phải giữ bản sửa.
5. Nếu cần kiểm tra upload, dùng gói ZIP thử nghiệm tối đa 50 MB và theo dõi kết quả
   tại **Lịch sử upload**. Upload phiên bản mới sẽ thay toàn bộ file của Skill đích.

## Khi gặp lỗi

| Hiện tượng | Cách kiểm tra |
|---|---|
| Không kết nối được máy chủ / lỗi proxy | Kiểm tra backend đang chạy, địa chỉ `DOMAIN_BE` và log Vite; khởi động lại Vite sau khi sửa `.env`. |
| Đăng nhập xong vẫn quay về login | Kiểm tra request `/api/users/me`, cookie đăng nhập, cấu hình cookie phía backend và hostname đang dùng. |
| Upload chờ xử lý lâu | Kiểm tra worker đang nghe queue `skill_scan` và kết nối Redis. |
| Upload chuyển sang lỗi | Mở chi tiết upload, xem log worker và cấu hình/kết nối sandbox. |
| Editor báo không tải được | Dùng nút thử lại; kiểm tra terminal Vite và lỗi tải module/worker trong trình duyệt. |
| `npm ci` báo phiên bản Node không phù hợp | Chuyển sang Node.js 24.x rồi chạy lại. |
| Không dùng được cổng 5180 | Dừng tiến trình đang chiếm cổng hoặc chạy `npm run dev -- --port 5181`. |

## Khi nhiều phiên cùng sửa file

Mỗi lần lưu gửi kèm `expected_sha256` của phiên bản đã mở. Nếu file đã được phiên
khác cập nhật, backend trả `409 file_changed`; editor giữ bản sửa cục bộ và cho chọn
**Tải lại bản mới**, **So sánh**, hoặc **Ghi đè bằng bản của tôi**.
Ghi đè vẫn kiểm tra hash của phiên bản server đã biết; nếu file tiếp tục thay đổi,
cần xử lý xung đột lại. Đây là phát hiện xung đột khi lưu, chưa có đồng bộ cùng gõ
theo thời gian thực hay tự động gộp nội dung. Quyền truy cập Skill do backend quyết định.

## Cấu trúc mã nguồn

```text
src/
├── main.js                      # Khởi tạo theme, router và xác thực
├── setup/                       # Axios và Monaco
├── constants/                   # Route, endpoint, giới hạn Skill
└── app/
    ├── auth/                    # Phiên đăng nhập
    ├── layout/                  # Khung trang và sidebar
    ├── routing/                 # Khai báo route
    ├── services/                # Gọi API Auth và Skill
    └── pages/
        ├── Login/
        └── Skill/               # Danh sách, editor, thông tin và upload
```

Tham khảo `PLAN.md` để xem phạm vi và các yêu cầu giao diện.

## Demo deployment

- Frontend: https://demo-skill.viendev.xyz
- Backend: https://owlla-dev.ih1.thinklabs.com.vn
- Public repository: https://github.com/tranvien98/skill-web

Nginx proxies `/api/` to the backend over verified HTTPS and rewrites backend cookie
domains to the demo host. Frontend routes fall back to `index.html`. Kubernetes
manifests live in `deploy/`; ArgoCD manages namespace `skill-web-dev` on Contabo.
Push to `main` builds a GHCR image; Image Updater selects the new build and ArgoCD
rolls out the app automatically. `.env` is excluded from Git and Docker builds.
