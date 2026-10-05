# Kế hoạch dựng giao diện Skill (`design-web/skill-web`)

Bản để review trước khi code (cập nhật: gọi API thật, có trang login). Trong `skill-web` hiện chỉ có file này.

---

## 1. Hiểu yêu cầu

- Dựng **một app riêng** trong `design-web/skill-web`, **cùng stack và cùng cấu trúc thư mục với `owlla_frontend`**,
  để sau này copy sang repo thật mà sửa ít nhất.
- Chỉ dựng lại **khung trang** của `owlla_frontend`: layout, sidebar và theme. Toàn bộ phần còn lại là **chức năng Skill**.
- Sidebar hiện đủ các mục như app thật (Agent, MCP, Quy trình, Triggers, Kiến thức, Đánh giá, Mô hình), thêm mục
  **Skill**. Chỉ Skill bấm vào chạy được; các mục khác mở trang giữ chỗ "Không thuộc phạm vi prototype".
- **Gọi API thật** của module `skill_agent` trong `owlla_backend` (đã code xong, đúng hợp đồng trong
  `owlla_backend/docs/skill_agent_api.html`). Không có mock.
- Cần đăng nhập để có cookie `access_token` → thêm **trang login tối giản**.

---

## 2. Stack (giống `owlla_frontend`)

| Thứ | Phiên bản theo repo | Dùng để |
|---|---|---|
| React 18 + Vite | `react ^18.2`, `vite ^8` | khung app |
| antd 5 | `^5.11`, `ConfigProvider colorPrimary #16a286` | Modal, Table, Tag, Switch, Dropdown, Steps, Drawer, Tooltip |
| Tailwind 3 | dùng lại `tailwind.config.js` + biến CSS trong `styles/tailwind.css` | style giống hệt app |
| lucide-react | `^0.562` | icon (app đang dùng) |
| react-router-dom 6 | `^6.17` | route |
| @monaco-editor/react | `^4.7` (repo đã có) | editor kiểu VSCode, diff editor |
| react-dropzone | `^11` (repo đã có) | kéo thả zip |
| react-resizable-panels | `^3` (repo đã có) | chia khung cây file / editor / panel lỗi |
| axios, dayjs, filesize, react-toastify, i18next | như repo | gọi API, ngày giờ, dung lượng, thông báo, chuỗi tiếng Việt |

Không dùng Redux cho Skill (trang Kiến thức cũng dùng state cục bộ + service). Node 24 / npm 11 như repo
(máy đang có Node 24.14, npm 11.9).

Alias giữ đúng như repo: `@app`, `@src`, `@component`, `@services`, `@api`, `@link`, `@constant`.

---

## 3. Lấy gì từ `owlla_frontend`

| Copy (cắt gọn) | Ghi chú |
|---|---|
| `layout/index.js`, `layout/MenuUser/*`, `MenuAdmin/LogoComponent.js` | Bỏ Redux, user giả "Quản trị viên". Thêm mục Skill |
| `tailwind.config.js`, `styles/tailwind.css`, phần cần của `custom-antd.scss`, `main.scss` | Để màu, bo góc, font giống hệt |
| `helper/utils.js` (`cn`), `common/prototype.js` (`String.format`) | Tiện ích dùng chung |
| `constants/link.js`, `constants/api.js` | Chỉ giữ phần của Skill, cùng kiểu viết |
| `services/Base` (dạng hàm) | Để service Skill viết cùng kiểu `getAllPaginationBaseNew`… |
| Component nhỏ, không kéo theo phụ thuộc nặng: `SearchInput`, `Pagination`, `ActionDropdown`, `ModalConfirm`, `DataEmpty` | Copy nguyên nếu tự đứng được; không thì viết lại nhìn giống |

Mục menu mới (thêm vào `menuItems` trong `MenuUser/index.js`, sau "Kiến thức"):

```
{ key: "skill", title: "SKILL", path: LINK.SKILL, icon: <Puzzle className="w-5 h-5 text-indigo-600 font-icon"/> }
```

---

## 4. Cấu trúc thư mục

```
skill-web/
├── package.json  vite.config.mjs  tailwind.config.js  postcss.config.js  index.html  .nvmrc
└── src/
    ├── main.js                       # ConfigProvider + Router + i18n + ToastContainer
    ├── app/
    │   ├── layout/                   # copy từ repo + mục Skill
    │   ├── routing/AppRoutes.js
    │   ├── styles/                   # copy từ repo
    │   ├── component/                # các component nhỏ copy từ repo
    │   ├── services/Skills/index.js  # hàm gọi API skill (axios), cùng kiểu services/Knowledges
    │   ├── services/Auth/index.js    # login, verify 2FA, refresh, logout, users/me
    │   ├── pages/Login/index.js      # form đăng nhập tối giản (+ bước nhập mã 2FA)
    │   └── pages/Skill/
    │       ├── index.js              # danh sách skill
    │       ├── SkillCard.js  SkillTable.js  QuotaBar.js
    │       ├── CreateSkillModal.js
    │       ├── UploadSkillModal/     # index.js, UploadSteps.js, FindingsTable.js, DuplicateCompare.js
    │       ├── UploadHistory/        # index.js, UploadDetailDrawer.js
    │       ├── DetailSkill/          # index.js (header, thống kê, tab), InfoTab.js
    │       ├── SkillEditor/          # index.js, FileTree.js, EditorTabs.js, ProblemsPanel.js,
    │       │                         # StatusBar.js, ConflictModal.js, DiffModal.js, MoveModal.js
    │       ├── utils.js              # phân loại file, map extension → ngôn ngữ Monaco, validate name
    │       └── Skill.scss
    ├── constants/  link.js  api.js
    └── translations/  i18n.js  lang_vi.js (khóa SKILL_*)
```

**Kết nối backend** giống hệt `owlla_frontend`: axios `withCredentials`, Vite proxy `/api` → `DEV_PROXY_TARGET`
(backend local), cookie do backend set qua proxy nên cùng origin. Gặp `401` thì gọi `/api/refresh` một lần
rồi gửi lại request; vẫn lỗi thì về trang login.

---

## 5. Route

| Path | Trang |
|---|---|
| `/login` | Đăng nhập (email/username + mật khẩu, bước mã 2FA nếu tài khoản bật) |
| `/` | chuyển tới `/skills` (chưa đăng nhập thì về `/login`) |
| `/skills` | Danh sách skill |
| `/skills/uploads` | Lịch sử upload |
| `/skills/:id?tab=editor` | Chi tiết skill, tab Trình soạn thảo (mặc định) |
| `/skills/:id?tab=info` | Chi tiết skill, tab Thông tin |
| các mục menu khác | Trang giữ chỗ |

---

## 6. Từng màn hình

### 6.1 Danh sách skill (`/skills`) — theo kiểu trang Agent + Kiến thức

- **Hàng tiêu đề:** "Skill" (text-2xl bold) · ô tìm kiếm 280px · Select trạng thái (Tất cả / Đang bật / Đã tắt) ·
  nút viền "Lịch sử upload" · nút chính **"+ Thêm mới"** (dropdown: *Upload file zip* / *Tạo skill trống*) ·
  nút chuyển lưới / bảng như trang Agent.
- **Thanh quota:** dung lượng `24.6 MB / 1 GB` (progress) · `7 / 50 skill` · `1 / 3 upload đang xử lý`.
- **Dạng lưới** (card giống card Agent): tên skill + dấu tích khi đang bật · mô tả 2 dòng · ô icon gradient bên
  phải · gạch ngang · `6 file` · `1.2 MB` · giờ cập nhật · nhãn cảnh báo vàng "2 cảnh báo" hoặc "Không có cảnh báo" ·
  Switch bật/tắt · menu ⋮ (Mở trình soạn thảo, Tải zip, Xóa).
- **Dạng bảng** (giống bảng Kiến thức): Skill · Số file · Dung lượng · Cảnh báo · Cập nhật · Trạng thái (Switch) ·
  Hành động (nút bút xanh, nút thùng rác đỏ).
- Phân trang như app. Trạng thái rỗng (chưa có skill → gợi ý Upload / Tạo trống). Xóa → ModalConfirm.

### 6.2 Modal Upload zip — theo kiểu modal "Tạo kiến thức"

1. **Chọn file:** vùng kéo thả (chỉ `.zip`, ≤ 50 MB, báo lỗi ngay ở client), checkbox "Ghi đè nếu trùng tên",
   gợi ý cấu trúc `SKILL.md / scripts / references / assets`.
2. **Đang xử lý:** antd `Steps` *Tải lên → Chờ quét → Quét trong sandbox → Kết quả*; % tải lên; gọi
   `GET /skills/uploads/{id}` mỗi 2 giây. Đóng modal vẫn chạy nền, xem tiếp ở Lịch sử upload.
   - **Thời gian đã chờ:** "Đã chờ 3 phút 2 giây", lấy `elapsed_seconds` do server tính (tránh lệch giờ máy) và
     đếm tiếp giữa hai lần poll.
   - **Chờ quá 2 phút:** cảnh báo vàng. Đang `pending` → "Hệ thống quét đang bận… quá 30 phút sẽ tự hủy và trả
     lượt upload". Đang `scanning` → "Quét lâu hơn bình thường… quá 2 phút một lần sẽ tự thử lại (tối đa 3 lần)".
   - **Nút "Hủy upload"** khi còn `pending`. Worker vừa nhận việc thì hủy bị từ chối (`409`), modal tải lại trạng
     thái và theo dõi tiếp.
3. **Kết quả:**

| status | Hiển thị |
|---|---|
| `passed` | Thành công, tên skill, danh sách cảnh báo MEDIUM (nếu có) · nút "Mở skill" |
| `rejected` | Lỗi, bảng findings: mức độ (Tag đỏ/cam/vàng) · `path:line` · mô tả · nút "Chọn file khác" |
| `duplicate` | So sánh skill hiện có (revision, sửa lần cuối, số file, dung lượng) với gói mới · "Hủy" / "Ghi đè" (gửi `expected_revision`). Nhận `409 revision_changed` → báo "Skill vừa được sửa", cập nhật revision, hỏi lại |
| `failed` | Lỗi hệ thống + nội dung `error` (vd "Hệ thống quét đang quá tải, upload đã chờ quá 30 phút") · "Thử lại" |
| `cancelled` / `expired` | "Đã hủy upload" / "Hết hạn chờ ghi đè"; thanh bước dừng đúng ở bước đã tới |
| `413` / `429` | Báo vượt 50 MB / đã có 3 upload đang xử lý |

### 6.3 Modal Tạo skill trống

- `name`: kiểm tra trực tiếp theo spec (chữ thường, số, `-`, không đầu/cuối `-`, không `--`, ≤ 64) + bộ đếm `0/64`.
- `description`: TextArea, bộ đếm `0/1024`.
- Lỗi server: `409 name_taken`. Tạo xong mở thẳng trình soạn thảo với `SKILL.md` mẫu.

### 6.4 Chi tiết skill (`/skills/:id`) — theo kiểu trang chi tiết Kiến thức

- **Header:** nút quay lại · icon · tên skill · "Cập nhật lúc 09:12 02/10/2026 · Revision 4" · Switch trạng thái ·
  nút "Tải zip".
- **Đã bỏ "Upload phiên bản mới"** (chốt 05/10/2026). Muốn thay toàn bộ file của skill thì upload zip cùng `name`
  từ trang danh sách: hệ thống báo trùng tên và hỏi ghi đè (hoặc tick "Ghi đè luôn nếu đã có skill cùng tên").
- **Đã bỏ 4 thẻ thống kê** Tổng file · Dung lượng · Cảnh báo · Revision (chốt ngày 05/10/2026).
  Trang chi tiết không hiển thị hàng thẻ thống kê; đây là thay đổi yêu cầu, không phải hạng mục còn thiếu.
- **Tab** (cùng kiểu tab trang Kiến thức): *Trình soạn thảo* · *Thông tin*.

### 6.5 Tab Trình soạn thảo (kiểu VSCode)

```
┌──────────────┬───────────────────────────────────────────────────────┐
│ TỆP  ⊕ 📁 ⟳ ⇊│ SKILL.md ● │ extract.py × │ schema.json 🔒 ×      [Lưu] │
│ ▾ scripts    │ scripts › extract.py                                   │
│   extract.py⚠│                                                        │
│   merge.js   │              Monaco editor                             │
│ ▸ references │                                                        │
│ ▾ assets     │                                                        │
│   schema.json🔒├───────────────────────────────────────────────────────┤
│   logo.png 🔒│ VẤN ĐỀ  ⓧ 0  ⚠ 1                                      │
│ SKILL.md     │ ⚠ Gọi tiến trình con  subprocess   scripts/extract.py:2│
├──────────────┴───────────────────────────────────────────────────────┤
│ pdf-processing · revision 4 · Đã lưu        Ln 12, Col 4 · Python · UTF-8│
└──────────────────────────────────────────────────────────────────────┘
```

- **Cây file** (tự viết cho gọn kiểu VSCode, không dùng antd Tree): icon theo loại file, 🔒 cho file chỉ xem,
  số cảnh báo, hover hiện ⋮. Menu chuột phải / ⋮: *File mới*, *Thư mục mới*, *Đổi tên / Di chuyển*, *Xóa*.
  Tạo file nhập trực tiếp trên cây, chỉ nhận `.txt .md .js .py .ts`.
- **Tab file:** chấm ● khi chưa lưu, đóng tab chưa lưu thì hỏi *Lưu / Không lưu / Hủy*.
- **Editor:** Monaco, ngôn ngữ theo extension; file `readonly` mở `readOnly`; ảnh xem trước; pdf xem trong khung.
- **Lưu** (`Ctrl/Cmd+S` hoặc nút Lưu):

| Phản hồi | Giao diện |
|---|---|
| `200` | Toast "Đã lưu · revision 5"; cảnh báo MEDIUM thành gạch vàng trong editor + panel Vấn đề |
| `422 scan_blocked` | Không lưu; gạch đỏ đúng dòng + panel Vấn đề; toast lỗi |
| `422 scan_failed` | "Không quét được nội dung, hãy chia nhỏ file" |
| `422 invalid_frontmatter` | Lỗi trên `SKILL.md` |
| `409 file_changed` | Modal xung đột: *Tải lại* · *So sánh* (Monaco DiffEditor bản server ↔ bản của bạn) · *Ghi đè* |
| `409 name_taken` | Lỗi trên dòng `name:` của `SKILL.md` |
| `413` / `503` | Báo vượt giới hạn / scanner bận, thử lại |

- **Đổi tên / di chuyển:** modal nhập path mới, kiểm luật đổi extension, không cho với `SKILL.md`.
- **Xóa thư mục:** xác nhận "Xóa N file"; nhận `409 revision_changed` thì báo và tải lại cây.
- **Panel Vấn đề:** gom findings của mọi file, bấm vào nhảy tới đúng file và dòng.
- Rời trang khi còn file chưa lưu → hỏi xác nhận.
- **Toàn màn hình:** nút ⤢ góc phải thanh tab hoặc `Ctrl/⌘ + Shift + F` (cả khi đang gõ trong Monaco). Editor phủ
  kín cửa sổ, che sidebar và header, vẫn đủ cây file, tab, panel Vấn đề, thanh trạng thái; lưu, modal xung đột, menu
  chuột phải dùng bình thường. Thoát bằng ⤡, phím tắt lần nữa, hoặc `Esc` (chỉ khi con trỏ không ở trong editor,
  vì Esc trong Monaco dùng để đóng ô tìm kiếm / gợi ý).

### 6.6 Tab Thông tin

- Bảng frontmatter: name, description, license, compatibility, metadata, allowed-tools.
- Tổng hợp kết quả quét theo mức độ, danh sách cảnh báo theo file.
- Upload gần nhất (link sang Lịch sử upload).

### 6.7 Lịch sử upload (`/skills/uploads`)

- Lọc nhanh: Tất cả / Đang xử lý / Thành công / Bị từ chối / Chờ ghi đè / Lỗi.
- Bảng: tên file · skill · Tag trạng thái (đang quét có icon quay) · số vi phạm/cảnh báo · thời gian · hành động.
  - Dòng đang xử lý hiện "đã chờ N phút" dưới Tag (chuyển màu vàng khi quá 2 phút).
  - Dòng `failed` hiện luôn lý do lỗi dưới Tag.
- Bấm dòng → Drawer chi tiết (findings, số lần thử, lỗi).
- Nút *Ghi đè* cho dòng `duplicate`; nút *Hủy* cho mọi dòng `cancellable` (`pending` hoặc `duplicate`).

### 6.8 Quét lâu và hàng đợi bị kẹt (cập nhật 05/10/2026)

**Quét khi lưu file** (đồng bộ trong API):

| Tình huống | Xử lý |
|---|---|
| Quét quá 5 giây / quá 512 MB RAM / AST đệ quy quá sâu | Không lưu, `422 scan_failed` |
| Quá 4 lượt quét cùng lúc mỗi worker API, chờ quá 2 giây | `503`, FE báo "Scanner đang bận, hãy thử lại" |

**Quét khi upload** (Celery queue `skill_scan` + sandbox):

| Tình huống | Xử lý |
|---|---|
| Chờ trong hàng đợi | `pending`; FE hiện thời gian chờ, gợi ý sau 2 phút, cho hủy |
| **Chờ quá 30 phút kể từ lúc upload** (`PENDING_DEADLINE`) | Job khôi phục (5 phút/lần) chuyển `failed` "Hệ thống quét đang quá tải…", **trả slot quota**, xóa zip quarantine, gửi thông báo. Worker nhận một upload đã quá hạn cũng chuyển `failed` thay vì quét |
| Sandbox hết slot (`429`) | Về `pending`, thử lại sau 15–120 giây; **hết 10 lần thì chuyển `failed`** "Sandbox bận quá lâu…" thay vì để `pending` mãi |
| Một lần quét quá 120 giây | Thử lại tối đa 3 lần rồi `failed` |
| Worker chết giữa chừng | Lease 5 phút hết hạn → job khôi phục enqueue lại |
| Mất message enqueue | Job khôi phục enqueue lại upload `pending` quá 10 phút |
| **Không có worker nào nghe queue `skill_scan`** | Khi có upload chờ quá 2 phút, job khôi phục hỏi broker (`inspect().active_queues()`); không thấy thì **log lỗi** kèm lệnh chạy worker |
| Người dùng hủy | `POST /skills/uploads/{id}/cancel` nhận cả `pending` (trước chỉ `duplicate`). Đang `scanning` / `applying` thì `409 invalid_state` |

API `GET /skills/uploads/{id}` và danh sách upload trả thêm: `cancellable`, `elapsed_seconds` và `deadline_at`
(hai field sau chỉ có khi đang `pending` / `scanning` / `applying`).

**Vận hành:** deploy bắt buộc chạy worker
`celery -A worker_config.celery_config.celery_app worker -Q skill_scan --concurrency=2 --prefetch-multiplier=1`
(đã có trong `run_script.sh`, `run_celery.sh`). Thiếu worker này thì mọi upload sẽ `failed` sau 30 phút và log có
lỗi "KHÔNG có worker nào nghe queue 'skill_scan'".

---

## 7. Đăng nhập & API

| Việc | API backend |
|---|---|
| Đăng nhập | `POST /api/login {username, password}` → nếu `two_factor` thì hiện ô nhập mã |
| Mã 2FA | `POST /api/verify-code-2fa {otp, user_id}` |
| Làm mới phiên | `POST /api/refresh` (cookie `refresh_token`) |
| Thông tin user (sidebar) | `GET /api/users/me` |
| Đăng xuất | `POST /api/logout` |
| Skill | 18 endpoint `/api/skills…` |

- Giao diện login theo trang login của app (logo, ô nhập bo 12px, nút teal), chỉ có email/mật khẩu; không có
  Google/Microsoft SSO, captcha.
- Chưa có sandbox ở local (`.env` thiếu `SANDBOX_API_URL`, `SANDBOX_API_KEY`, `SANDBOX_SESSION_SECRET`):
  upload vẫn nhận file (`202`) nhưng quét sẽ thử lại rồi `failed` cho tới khi trỏ được sandbox. Các màn
  khác (tạo skill trống, editor, xóa, export…) chạy được ngay.

## 8. Không làm

SSO / captcha / quên mật khẩu, các trang ngoài Skill, tiếng Anh (cấu trúc i18n vẫn sẵn), dark mode (app không có),
giao diện mobile (chỉ thu gọn sidebar như app).

## 9. Chạy thử

```
# 1. Backend (owlla_backend): API + worker quét skill
python main.py            # uvicorn, HOST/PORT lấy từ .env
celery -A worker_config.celery_config.celery_app worker -Q skill_scan --concurrency=2

# 2. Frontend
cd design-web/skill-web
cp .env.example .env     # DEV_PROXY_TARGET=http://localhost:<PORT của backend>
npm install
npm run dev              # http://localhost:5180
```

## 10. Port sang `owlla_frontend` sau này

Copy `pages/Skill`, `services/Skills`; thêm `LINK.SKILL*`, `API.SKILL*`, route vào `ROUTERS`, mục menu,
khóa dịch. Bỏ `pages/Login` và `services/Auth` của prototype (repo đã có).
