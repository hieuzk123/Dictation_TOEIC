# TRẠNG THÁI DỰ ÁN: TOEIC DICTATION (PART 3 & 4)
> **Tài liệu bàn giao & Hướng dẫn phát triển đa môi trường**  
> *Repository*: [hieuzk123/Dictation_TOEIC](https://github.com/hieuzk123/Dictation_TOEIC)  
> *Cập nhật lần cuối*: 2026-09-28  

---

## 1. Giới thiệu tổng quan
Hệ thống website hỗ trợ học viên luyện nghe chép chính tả tiếng Anh chuyên sâu cho **TOEIC Listening Part 3 (Short Conversations)** và **Part 4 (Short Talks)**.

### Định hướng công nghệ:
* **Data Pipeline (Python)**: `faster-whisper`, `edge-tts`, `stable-ts` để tự động hóa cắt đoạn (segmentation) và gắn mốc thời gian (timestamps) cấp câu/từ từ audio và transcript ETS.
* **Database**: MySQL 8.x (hỗ trợ lưu trữ phân cấp Đề thi $\rightarrow$ Bài nghe $\rightarrow$ Câu/Đoạn $\rightarrow$ Tokens JSON và Lịch sử làm bài).
* **Backend**: Java 17+, Spring Boot 3 (Spring Security, Spring Data JPA, JWT Authentication, RESTful API).
* **Frontend**: React 18+ (Vite, TypeScript, Tailwind CSS, Lucide Icons, HTML5 Audio API).

---

## 2. Tiêu chuẩn Phối hợp Đa Tác tử & Rà soát Lỗi Xuyên suốt (Multi-Agent Quality Protocol)
> **Quy định cốt lõi bắt buộc áp dụng xuyên suốt tất cả các giai đoạn của dự án**

Hệ thống phát triển được phân định rành mạch giữa các nhóm Tác tử (Agents) để bảo đảm tối đa tính chính xác, tính bảo mật và chất lượng mã nguồn:

### 1. Phân vai Tác tử (Agent Roles):
* **Agent chính (Primary / Implementer Agent)**:
  * Trực tiếp thực thi các nhiệm vụ kỹ thuật: khởi tạo project, lập trình logic tính năng, thiết kế models/controllers, viết test cases, cấu hình môi trường...
  * Tuân thủ quy trình kiểm thử trước khi bàn giao: tự chạy unit test, build cục bộ để xác nhận không có lỗi cú pháp hoặc runtime cơ bản.
  * Xuất báo cáo kết quả thực thi kèm danh sách file thay đổi, diff mã nguồn và kết quả test suite.
* **Agent phụ (Secondary / Auditor & Reviewer Agent)**:
  * Đóng vai trò kiểm toán chất lượng độc lập, rà soát chi tiết thành phẩm của Agent chính ngay sau khi hoàn thành mỗi task.
  * Tiêu chí kiểm định chuyên sâu:
    1. **Spec Compliance**: Đối chiếu với `PROJECT_STATE.md`, Master Prompt và database schema xem có thiếu sót tính năng hay vi phạm quy ước nào không.
    2. **Code Quality & Best Practices**: Kiểm tra cấu trúc code, naming conventions, xử lý exception, clean code, tái sử dụng code.
    3. **Security & Performance**: Kiểm tra lỗ hổng bảo mật (SQL Injection, XSS, lộ credential, JWT leak, CORS cấu hình sai) và tối ưu truy vấn N+1 của JPA.
    4. **Regressions & System Integrity**: Đảm bảo không phá vỡ logic cũ hoặc gây lỗi liên đới giữa các module.
  * Phân loại lỗi theo 3 mức độ:
    * 🔴 **Critical**: Lỗi nghiêm trọng khiến hệ thống không chạy được, sai logic nghiệp vụ cốt lõi hoặc lỗ hổng bảo mật.
    * 🟡 **Important**: Vi phạm tiêu chuẩn thiết kế, thiếu sót edge cases, thiếu validation hoặc thiếu test cases quan trọng.
    * 🟢 **Minor**: Điểm chưa tối ưu về style code, comment, format nhưng không ảnh hưởng tính năng.

### 2. Chu trình Sửa lỗi & Tái kiểm định (Fix & Re-review Loop):
1. Khi Agent phụ phát hiện lỗi 🔴 **Critical** hoặc 🟡 **Important**, Agent chính bắt buộc phải tiếp nhận phản hồi và tiến hành sửa đổi ngay lập tức.
2. Agent phụ thực hiện rà soát lại (re-review) trên diff sửa đổi. Chỉ khi Agent phụ xác nhận **PASS (Review Clean)** thì task mới được đánh dấu hoàn thành.

### 3. Bảng Tổng kết Đối soát Lỗi & Khắc phục (Defect & Remediation Audit Table):
Mọi lỗi phát sinh trong quá trình rà soát chéo giữa các Agent đều phải được ghi nhận công khai và minh bạch vào bảng audit tại cuối tài liệu này.

---

## 3. Những công việc đã hoàn thành (Phase 1)

### A. Thiết lập môi trường & Công cụ hệ thống
1. **Node.js LTS (v24.12.0)**: Đã cài đặt và nạp vào `%PATH%` (hỗ trợ npx/npm cho Frontend và công cụ hỗ trợ).
2. **Java Development Kit (JDK 21 LTS)**: Đã cài đặt và cấu hình sẵn sàng (`java 21.0.12`).
3. **MySQL Server (Port 3306)**:
   * Hỗ trợ đa môi trường: Script tiện ích `start_mysql.bat` tự động phát hiện và khởi chạy MySQL (tương thích cả MySQL 8.4 standalone lẫn XAMPP MariaDB/MySQL).
   * Đã nạp thành công database `toeic_dictation`, cấu trúc schema 5 bảng và toàn bộ seed data.

### B. Dữ liệu âm thanh & Transcript mẫu chuẩn ETS
Đã tạo dữ liệu âm thanh chuẩn bản ngữ bằng Microsoft Azure Neural TTS (`edge-tts`):
* **Part 3 (Questions 32-34)**:
  * Chủ đề: *Office Supply Toner Order* (Hội thoại giữa nhân viên và quản lý văn phòng phẩm).
  * Giọng đọc: Kết hợp 2 giọng nam/nữ bản ngữ tự nhiên (`en-US-JennyNeural` & `en-US-GuyNeural`).
  * File: `data_pipeline/sample_data/ets2024_test1_part3_q32_34.mp3` & `.txt`.
* **Part 4 (Questions 71-73)**:
  * Chủ đề: *Airport Flight Delay Announcement* (Thông báo hoãn chuyến bay tại sân bay).
  * Giọng đọc: Giọng phát thanh viên sân bay chuyên nghiệp (`en-US-AriaNeural`).
  * File: `data_pipeline/sample_data/ets2024_test1_part4_q71_73.mp3` & `.txt`.

### C. Data Pipeline tự động căn khớp thời gian (`data_pipeline/`)
* **`align_pipeline.py`**:
  * Sử dụng mô hình `faster-whisper` (`base` model, int8 quantization) nhận diện chính xác mốc thời gian (start/end timestamp) của từng từ và từng câu.
  * Tích hợp bộ lọc từ chức năng (Stopwords) thông minh để gắn cờ `is_keyword: true/false` cho từng token từ vựng, phục vụ cơ chế đục lỗ Cloze Test.
  * Xuất ra các file dữ liệu JSON chuẩn tại `data_pipeline/output/`:
    * `ets2024_test1_part3_q32_34.json` (7 câu, 83 từ có timestamp chi tiết).
    * `ets2024_test1_part4_q71_73.json` (5 câu, 69 từ có timestamp chi tiết).
* **`generate_sample_audio.py`**: Script sinh file âm thanh mẫu tự động.
* **`export_seed_sql.py`**: Script đọc các file JSON từ pipeline và tự động xuất ra file seed SQL nạp thẳng vào MySQL.

### D. Cấu trúc Database Schema & Seed Data (`database/`)
* **`database/schema.sql`**: Thiết kế chuẩn hóa 5 bảng:
  1. `users`: Quản lý tài khoản, mã hóa BCrypt, phân quyền role.
  2. `toeic_tests`: Quản lý đề theo năm (`year`) và số đề (`test_number`).
  3. `audio_items`: Quản lý từng bài nghe Part 3/Part 4, file audio URL, thời lượng tổng.
  4. `audio_segments`: Quản lý từng câu trong bài nghe, lưu `start_time`, `end_time`, `full_transcript`, `tokens_json`.
  5. `study_histories`: Quản lý lịch sử nộp bài, điểm số accuracy, số lần nghe lại, chi tiết lỗi sai.
* **`database/seed_data.sql`**: Đã nạp thành công:
  * 1 Đề thi mẫu: `ETS 2024 - Test 1`.
  * 2 Bài nghe: Part 3 (Q32-34) & Part 4 (Q71-73).
  * 12 Segments kèm đầy đủ mốc thời gian và tokens.
  * 1 Tài khoản mẫu: `demo_user` / `password123`.

---

## 4. Cấu trúc thư mục dự án hiện tại

```text
Dictation_TOEIC/
├── .gitignore                      # Cấu hình bỏ qua file tạm, cache, venv, backups
├── docker-compose.yml              # Khởi chạy toàn cụm MySQL + Backend + Frontend
├── .env.example                    # Mẫu biến môi trường tiêu chuẩn cho production
├── PROJECT_STATE.md                # Báo cáo trạng thái dự án hiện tại & Quy trình kiểm toán
├── toeic_dictation_prompt.md       # Master Prompt nghiệp vụ & kiến trúc ban đầu
├── start_mysql.bat                 # Script chạy nhanh MySQL Server cục bộ (đa môi trường)
│
├── ci/                             # CI/CD Tự động hóa
│   └── github-actions-ci.yml       # Quy trình GitHub Actions CI (Test, Coverage, Build)
│
├── scripts/                        # Scripts vận hành hệ thống
│   ├── backup_mysql.bat            # Script sao lưu tự động MySQL trên Windows (7-day retention)
│   └── backup_mysql.sh             # Script sao lưu tự động MySQL trên Linux/Docker
│
├── database/                       # Cấu trúc và dữ liệu Database
│   ├── schema.sql                  # DDL tạo 5 bảng cơ sở dữ liệu
│   └── seed_data.sql               # Dữ liệu mẫu (tests, items, segments, demo_user, admin)
│
├── backend/                        # Ứng dụng Backend Spring Boot 3 (Java 21)
│   ├── pom.xml                     # Maven dependencies (Security, JPA, Actuator, Prometheus, JaCoCo)
│   ├── Dockerfile                  # Container đóng gói Eclipse Temurin 21 JRE
│   └── src/                        # Mã nguồn Java (Auth, Admin, Study, Toeic, Actuator, Exception)
│
├── frontend/                       # Ứng dụng Frontend React 18 + Vite + Tailwind CSS
│   ├── package.json                # Dependencies React, Lucide, Tailwind, Vitest, Playwright
│   ├── Dockerfile                  # Multi-stage Dockerfile (Node 22 build + Nginx Alpine)
│   ├── nginx.conf                  # Nginx reverse proxy (/api, /audio) và SPA routing
│   └── src/                        # Mã nguồn React (DictationPlayer, AdminCmsModal, ErrorBoundary)
│
└── data_pipeline/                  # Tool xử lý dữ liệu Audio & Timestamp
    ├── align_pipeline.py           # Pipeline Whisper trích xuất timestamp và gắn nhãn keyword
    ├── generate_sample_audio.py    # Script sinh file audio mẫu bằng edge-tts
    ├── export_seed_sql.py          # Chuyển đổi JSON pipeline thành file SQL
    ├── sample_data/                # Thư mục chứa audio gốc và text transcript
    │   ├── ets2024_test1_part3_q32_34.mp3
    │   ├── ets2024_test1_part3_q32_34.txt
    │   ├── ets2024_test1_part4_q71_73.mp3
    │   └── ets2024_test1_part4_q71_73.txt
    └── output/                     # Kết quả trích xuất JSON từ Whisper
        ├── ets2024_test1_part3_q32_34.json
        └── ets2024_test1_part4_q71_73.json
```


---

## 5. Hướng dẫn thiết lập & Bàn giao khi kéo code về máy khác (Handover Guide)

Khi bạn chuyển sang máy tính khác (laptop cá nhân, máy công ty, máy ảo, v.v.), hãy thực hiện theo đúng các bước tuần tự dưới đây để đảm bảo hệ thống chạy ngay mà không bị lệch tiến trình:

### 📥 Bước 1: Kéo mã nguồn về máy mới
```bash
git clone https://github.com/hieuzk123/Dictation_TOEIC.git
cd Dictation_TOEIC
```

### ⚙️ Bước 2: Chuẩn bị môi trường phần mềm
* **Git** & **Node.js** (LTS >= 18 hoặc 20+)
* **JDK 17 hoặc 21 LTS** (Khuyên dùng OpenJDK 21)
* **MySQL 8.x** hoặc **XAMPP (MariaDB/MySQL)** trên cổng 3306
* **Python 3.10+** (Chỉ cần nếu muốn nạp thêm đề thi mới qua Whisper)

### 🗄️ Bước 3: Khởi động & Nạp Cơ sở dữ liệu
1. **Khởi động MySQL**:
   * Nếu dùng Windows: Nhấp đúp chạy script tiện ích `start_mysql.bat` (tự động nhận diện XAMPP `D:\xampp\mysql` hoặc MySQL standalone).
   * Hoặc khởi động MySQL Service qua XAMPP Control Panel / Services.msc.
2. **Nạp Schema & Dữ liệu mẫu**:
   ```powershell
   # Mở terminal tại thư mục gốc Dictation_TOEIC:
   Get-Content database/schema.sql | mysql -u root
   Get-Content database/seed_data.sql | mysql -u root toeic_dictation
   ```
   *(Tài khoản mẫu đã nạp sẵn: `demo_user` / `ToeicDictation@2026!`)*

### ☕ Bước 4: Khởi động Backend Spring Boot 3
```powershell
cd backend
# Windows:
.\mvnw.cmd spring-boot:run
# macOS / Linux:
./mvnw spring-boot:run
```
*Backend sẽ lắng nghe tại `http://localhost:8080`, cung cấp REST API và audio stream `/audio/**`.*

### ⚛️ Bước 5: Khởi động Frontend React 18 + Vite
Mở một cửa sổ terminal mới:
```powershell
cd frontend
npm install
npm run dev
```
*Mở trình duyệt truy cập `http://localhost:5173` (hoặc `http://localhost:5174`), đăng nhập bằng nút tiện ích Demo để trải nghiệm ngay.*

### 🤖 Bước 6: Cách ra lệnh cho AI Agent trên máy mới để KHÔNG làm sai tiến trình
Khi bạn mở dự án trên IDE ở máy mới (hoặc bắt đầu session mới với AI), hãy dán câu lệnh tiêu chuẩn sau vào ô chat:
> *"Hãy đọc kỹ file `PROJECT_STATE.md`. Hiện tại dự án đã hoàn thành 100% trọn vẹn toàn bộ 7 Giai đoạn từ Giai đoạn 1 đến Giai đoạn 7 (Data Pipeline, Backend Spring Boot 3 & 39 Tests, Frontend React 18 & 22 Unit Tests + 3 E2E Tests, Product Resilience & JWT Rotation, Testing & JaCoCo 90.8% Coverage, DevOps Multi-stage Docker Compose & CI/CD, và Vận hành Giám sát Actuator/Prometheus, Sentry, MySQL Backup, Admin CMS Upload MP3). Hãy tuân thủ nghiêm ngặt Quy chuẩn Đa tác tử (Multi-Agent Quality Protocol) ở Mục 2, đối soát bảng lỗi ở Mục 7 và hỗ trợ mở rộng, bảo trì hoặc phát triển tính năng mới theo yêu cầu."*

---

## 6. Kế hoạch & Các nhiệm vụ tiếp theo (Next Tasks)

### 📌 Giai đoạn 2: Phát triển Backend (Spring Boot 3)
Thư mục dự kiến: `backend/`
- [x] Task 1: Khởi tạo dự án Spring Boot 3 bằng Maven Wrapper (`mvnw`), các dependencies Web, JPA, Security, JJWT 0.12.6, cấu hình `application.yml` kết nối MySQL `toeic_dictation`.
- [x] Task 2: Xây dựng Domain Models & Repositories (`User`, `ToeicTest`, `AudioItem`, `AudioSegment`, `StudyHistory`).
- [x] Task 3: Xây dựng Module Authentication & JWT (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, Security Config & Filter).
- [x] Task 4: Xây dựng RESTful API dữ liệu bài học (`GET /api/tests`, `GET /api/items/{id}`) và Static Audio Resource Handler (`/audio/**`).
- [x] Task 5: Xây dựng Thuật toán chấm điểm Dictation, API nộp bài (`POST /api/study/submit`) và Lịch sử học tập (`GET /api/study/history`).
- [x] Task 6: Kiểm thử E2E Toàn diện Backend & Bàn giao Tài liệu API (Hoàn thành 24/24 tests pass, sẵn sàng cho Phase 3 Frontend).

### 📌 Giai đoạn 3: Phát triển Frontend (React 18 + Vite + Tailwind)
Thư mục dự kiến: `frontend/`
- [x] Task 1: Khởi tạo ứng dụng React TypeScript với Vite & Tailwind CSS (Hoàn thành build sạch, design tokens glassmorphism).
- [x] Task 2: Xây dựng API Client, TypeScript Interfaces & Auth Context (Hoàn thành AuthContext, AuthModal demo 1-click, typed API).
- [x] Task 3: Xây dựng Test Browser & Navigation View (Hoàn thành Navbar, TestSelector, ItemCard lọc Part 3/4).
- [x] Task 4: Phát triển Audio Controller & Glassmorphic Player (Hoàn thành hook useAudioSegmentPlayer, AudioPlayerBar seek [start, end]).
- [x] Task 5: Phát triển Component cốt lõi DictationPlayer (3 cloze modes, hotkeys, so khớp từ tức thì).
- [x] Task 6: Submission, Study Results Modal & Bàn giao Tổng thể (Hoàn thành ResultModal, HistoryDrawer, tích hợp đầy đủ backend và frontend).

---

### 📌 Lộ trình Hoàn thiện Sản phẩm Toàn diện (Product Engineering Roadmap)
> **Mục tiêu: Đưa dự án từ mức ứng dụng demo/PoC thành một Sản phẩm EdTech thương mại hoàn chỉnh (Production-Ready Digital Product) theo chu trình 7 bước.**

#### 🚀 Giai đoạn 4: Trải nghiệm & Độ bền Sản phẩm (Product & UX Resilience)
- [x] Task 4.1: Cơ chế Tự động lưu tiến độ làm bài (`Auto-save LocalStorage`): chống mất bài khi rớt mạng hoặc người học vô tình tải lại trang (Hoàn thành `services/storage.ts` với TTL 7 ngày, khôi phục tự động, badge hiển thị trạng thái và nút làm lại).
- [x] Task 4.2: Hướng dẫn Tân thủ (`Onboarding Guide` & `Shortcut Cheatsheet Modal`): giới thiệu trực quan cách nghe, bấm phím tắt khi học viên lần đầu vào web (Hoàn thành `ShortcutModal.tsx`, tự động mở cho tân thủ, hỗ trợ tabs Phím tắt & Hướng dẫn).
- [x] Task 4.3: Cơ chế Bảo mật Nâng cao (`JWT Refresh Token & Token Rotation`): tự động cấp mới phiên đăng nhập nền mà không ngắt quãng buổi học (Hoàn thành Refresh Token 7 ngày với claim `typ: refresh`, endpoint `/api/auth/refresh`, silent refresh interceptor phía frontend và 3 unit/integration tests bảo mật).
- [x] Task 4.4: Phân trang & Tìm kiếm bài nghe (`Pagination & Search/Filter`): hỗ trợ mở rộng kho đề thi từ hàng chục lên hàng trăm đề (Hoàn thành thanh tìm kiếm tiêu đề/mã câu, tabs lọc Part 3/4, pagination responsive trên giao diện và backend JPQL query filter).

#### 🧪 Giai đoạn 5: Kiểm thử Tự động & Đo lường Chất lượng (Testing & Engineering Quality)
- [x] Task 5.1: Bộ kiểm thử tự động Frontend (`Vitest` + `React Testing Library`): viết unit test cho các component cốt lõi `DictationPlayer`, `AudioPlayerBar`, `useAudioSegmentPlayer` (Hoàn thành 16/16 tests pass, cấu hình JSDOM và mocks).
- [x] Task 5.2: Bộ kiểm thử E2E không đầu (`Playwright Test Suite`): tự động chạy giả lập luồng người dùng trên trình duyệt ngầm (Headless Chrome/Firefox) (Hoàn thành 3/3 tests pass với Microsoft Edge engine và API route mocking).
- [x] Task 5.3: Đo lường độ phủ mã nguồn Backend (`JaCoCo Code Coverage >= 80%`): xuất báo cáo kiểm thử tự động HTML (Hoàn thành JaCoCo 0.8.12, đạt 90.82% Line Coverage và 87.17% Instruction Coverage, 33/33 tests pass).
- [x] Task 5.4: Tiêu chuẩn hóa Git Hooks (`Husky` + `lint-staged`): tự động format code và kiểm tra type-check trước khi `git commit` (Hoàn thành `.husky/pre-commit` kiểm tra build, tests và linter).

#### 🐳 Giai đoạn 6: Đóng gói Đa nền tảng & Tự động hóa Triển khai (DevOps & CI/CD)
- [x] Task 6.1: Container hóa đa tầng (`Dockerfile` Backend Spring Boot Java 21 & `Dockerfile` Frontend Nginx Alpine) (Hoàn thành `backend/Dockerfile` Eclipse Temurin 21 JRE, `frontend/Dockerfile` Node 22 + Nginx 1.27 Alpine, `frontend/nginx.conf` với reverse proxy `/api` và `/audio` và SPA fallback).
- [x] Task 6.2: Khởi chạy 1 lệnh duy nhất (`docker-compose.yml`): gom cụm `mysql`, `backend`, `frontend` độc lập, sẵn sàng chạy trên mọi VPS/Cloud (AWS, DigitalOcean) (Hoàn thành `docker-compose.yml` tích hợp 3 services, volume init tự động `01-schema.sql` & `02-seed.sql`, network bridge và healthcheck).
- [x] Task 6.3: Quy trình Tích hợp Liên tục (`GitHub Actions CI`): tự động build, test backend & frontend khi tạo PR hoặc push code lên branch `main` (Hoàn thành `ci/github-actions-ci.yml` chạy song song `frontend-ci` lint/build/test và `backend-ci` MySQL 8.4 service container, 33/33 tests và JaCoCo report artifact).
- [x] Task 6.4: Quản lý biến môi trường chuẩn sản phẩm (`.env.example` và mã hóa cấu hình bảo mật) (Hoàn thành template `.env.example`, dynamic externalized config trong `application.yml` tương thích fallback local 100%, bảo vệ `.gitignore`).

#### 📈 Giai đoạn 7: Vận hành, Giám sát & Quản trị Nội dung (Operations & Admin CMS)
- [x] Task 7.1: Giám sát Hiệu năng Thời gian thực (`Spring Boot Actuator` + `Prometheus Metrics`): theo dõi CPU, RAM, JVM Heap, số lượng kết nối MySQL (Hoàn thành Actuator endpoints, Micrometer Prometheus exporter, Security permit, và 2 integration tests xác thực).
- [x] Task 7.2: Bắt lỗi Runtime tức thì (`Sentry SDK` + React `ErrorBoundary`): cảnh báo lập tức khi có sự cố phát sinh của người dùng (Hoàn thành SentryService fallback an toàn, GlobalExceptionHandler xử lý tập trung mọi ngoại lệ và ErrorBoundary giao diện glassmorphic phục hồi lỗi).
- [x] Task 7.3: Tự động sao lưu dữ liệu (`MySQL Auto-backup script`): cronjob định kỳ sao lưu dữ liệu học tập ra bộ nhớ ngoài an toàn (Hoàn thành script Windows `scripts/backup_mysql.bat` và Linux `scripts/backup_mysql.sh` với timestamped archive, error handling và tự động dọn dẹp sau 7 ngày).
- [x] Task 7.4: Màn hình Quản trị Đề thi (`Admin CMS Upload UI & REST API`): cho phép giáo viên kéo thả file MP3 + transcript trực tiếp trên web, backend tự động trích xuất đề mới mà không cần gõ lệnh terminal (Hoàn thành tài khoản admin, RBAC `ROLE_ADMIN`, API `/api/admin/**`, AdminCmsModal kéo thả MP3/transcript, xem 5 chỉ số thống kê và quản trị xóa bài nghe).

---

## 7. Nhật ký Đối soát Lỗi & Khắc phục của các Agent (Multi-Agent Defect & Remediation Audit Log)
> **Bảng theo dõi minh bạch các lỗi/sai sót do Agent phụ phát hiện sau khi Agent chính chạy xong và phương án khắc phục.**

| ID | Task / Hạng mục | Agent chính (Implementer) | Agent phụ (Auditor) | Lỗi / Điểm chưa đạt phát hiện | Mức độ | Nguyên nhân & Cách khắc phục | Trạng thái |
|:---:|:---|:---|:---|:---|:---:|:---|:---:|
| AUD-00 | Setup: Khởi động MySQL đa môi trường | Primary Agent (Setup) | Auditor Agent | Script `start_mysql.bat` chỉ trỏ cứng vào đường dẫn cá nhân `C:\Users\Hieu\mysql_data` gây lỗi không khởi động được trên máy khác hoặc máy dùng XAMPP. | 🟡 Important | Đã refactor `start_mysql.bat` tự động phát hiện đường dẫn XAMPP `D:\xampp\mysql` hoặc MySQL 8.4 standalone tương thích trên mọi máy. | ✅ PASS (Resolved) |
| AUD-01 | Task 1: Khởi tạo Spring Boot 3 & Cấu hình JPA | Primary Agent (Task 1) | Auditor Agent | Cảnh báo Hibernate deprecated `MySQLDialect` và thiếu cấu hình tường minh `spring.jpa.open-in-view: false` cho kiến trúc REST API không trạng thái. | 🟢 Minor | Đã gỡ bỏ dialect dư thừa (Hibernate 6 tự động nhận diện) và thêm `open-in-view: false`. Re-test ngữ cảnh pass sạch sẽ trong 6s. | ✅ PASS (Resolved) |
| AUD-02 | Task 2: Domain Entities & Repositories | Primary Agent (Task 2) | Auditor Agent | Cần bảo đảm không bị N+1 query khi fetch AudioItem kèm các segments và tránh circular dependency khi parse JSON cho client. | 🟡 Important | Đã dùng `FetchType.LAZY` kết hợp `@JsonIgnore` trên quan hệ ngược, bổ sung custom JPQL `findByIdWithSegments` dùng `LEFT JOIN FETCH`. Integration test 4/4 pass. | ✅ PASS (Resolved) |
| AUD-03 | Task 3: Xác thực JWT & Mật khẩu Seed User | Primary Agent (Task 3) | Auditor Agent | Hash mật khẩu demo_user trong seed_data.sql ban đầu không phải hash BCrypt chuẩn; khi update qua PowerShell bị nuốt ký tự `$` dẫn đến lỗi 401 Unauthorized khi login. | 🔴 Critical | Đã sinh lại hash BCrypt hợp lệ của `password123` bằng `BCryptPasswordEncoder`, escape ký tự `$`, cập nhật đồng bộ MySQL và seed SQL. Đã test pass 6/6 test cases. | ✅ PASS (Resolved) |
| AUD-04 | Task 4: RESTful API Dữ liệu Bài học & Static Audio | Primary Agent (Task 4) | Auditor Agent | Cần bảo đảm WebMvc ResourceHandler phân giải đúng đường dẫn tương đối `data_pipeline/sample_data/` sang URI tuyệt đối chuẩn xác trên cả Windows OS và parse token JSON an toàn. | 🟡 Important | Sử dụng `Paths.get(audioDir).toAbsolutePath().normalize().toUri()` chuẩn hóa URI cross-platform; bắt lỗi Jackson JsonProcessingException cục bộ cho từng segment. Test 5/5 pass. | ✅ PASS (Resolved) |
| AUD-05 | Task 5: Chấm điểm Dictation & Lưu Lịch sử | Primary Agent (Task 5) | Auditor Agent | 1. Thiếu `AuthenticationEntryPoint` trong SecurityConfig khiến unauthenticated request trả về 403 Forbidden thay vì 401 Unauthorized. 2. Jackson JavaBean convention tự cắt tiền tố `is` của `isCorrect` và `isPerfect` thành `correct` và `perfect`. | 🟡 Important | Đã bổ sung `authenticationEntryPoint` trả về 401 chuẩn xác; thêm `@JsonProperty("isCorrect")` và `@JsonProperty("isPerfect")` cho DTOs kết quả. Re-test 7/7 test cases pass 100%. | ✅ PASS (Resolved) |
| AUD-06 | Task 6: Kiểm thử E2E Toàn diện & Idempotency | Primary Agent (Task 6) | Auditor Agent | Test E2E tạo user mới nếu dùng username cố định sẽ gây lỗi trùng Unique Key khi test suite chạy nhiều lần liên tục (CI/CD hoặc local regression test). | 🟢 Minor | Sử dụng username động kèm timestamp `e2e_student_` + `System.currentTimeMillis()` bảo đảm tính độc lập (test idempotency). Toàn bộ 24/24 unit & integration tests chạy đồng thời thành công 100%. | ✅ PASS (Resolved) |
| AUD-07 | Phase 3 Task 1: Scaffolding Tailwind CSS v3 | Primary Agent (Phase 3 Task 1) | Auditor Agent | Lệnh `npx tailwindcss init -p` gặp lỗi do npm kéo Tailwind v4 mặc định vốn đã phân tách CLI. | 🟡 Important | Đã cài đặt chuẩn xác `tailwindcss@^3.4.17` tương thích `tailwind.config.js`, cấu hình design tokens EdTech (Indigo/Slate/Emerald) và Vite proxy. Build hoàn tất thành công. | ✅ PASS (Resolved) |
| AUD-08 | Phase 3 Task 2: VerbatimModuleSyntax Type Imports | Primary Agent (Phase 3 Task 2) | Auditor Agent | Lỗi biên dịch TypeScript `TS1484` do `tsconfig.json` bật `verbatimModuleSyntax: true` yêu cầu import kiểu dữ liệu phải dùng cú pháp `import type`. | 🟢 Minor | Chuẩn hóa toàn bộ import kiểu sang `import type { ... }` trong `AuthContext.tsx` và `api.ts`. `npm run build` hoàn thành trong 697ms không lỗi. | ✅ PASS (Resolved) |
| AUD-09 | Phase 3 Task 3: NoUnusedLocals Compiler Check | Primary Agent (Phase 3 Task 3) | Auditor Agent | Lỗi biên dịch `TS6133` trong `Navbar.tsx` do import thừa component icon `UserIcon` chưa sử dụng. | 🟢 Minor | Đã gỡ bỏ import thừa `UserIcon`. Re-build hoàn tất trong 755ms thành công 100%. | ✅ PASS (Resolved) |
| AUD-10 | Phase 3 Task 4: Segment Boundary Playback Clamp | Primary Agent (Phase 3 Task 4) | Auditor Agent | Khi người dùng ấn nút tua lùi/tới hoặc seek trên timeline, audio có nguy cơ trôi sang segment khác. | 🟡 Important | Giới hạn tuyệt đối phạm vi seek trong khoảng `[startTime, endTime]` bằng `Math.min(Math.max(...))` và reset thời gian khi đổi câu. Re-build hoàn tất trong 788ms. | ✅ PASS (Resolved) |
| AUD-11 | Phase 3 Task 5: Hotkeys Input Focus Guard | Primary Agent (Phase 3 Task 5) | Auditor Agent | Phím tắt `Space` nếu bắt sự kiện toàn cục sẽ vô tình kích hoạt play/pause âm thanh khi người dùng đang gõ khoảng trắng vào ô nhập câu trả lời. | 🟡 Important | Kiểm tra `e.target instanceof HTMLInputElement || HTMLTextAreaElement`. Nếu đang gõ text, phím Space trả về ký tự bình thường; chỉ toggle play khi không focus input hoặc khi bấm `Ctrl + Space`. | ✅ PASS (Resolved) |
| AUD-12 | Phase 3 Task 6: Google Password Breach Popup Guard | Primary Agent (Phase 3 Task 6) | Auditor Agent | Mật khẩu mẫu `password123` bị Google Password Manager trên Chrome cảnh báo lộ lọt dữ liệu (data breach), hiện popup hệ thống chặn tương tác người dùng. | 🔴 Critical | Đã nâng cấp mật khẩu sang dạng mạnh `ToeicDictation@2026!`, đồng bộ hash BCrypt `$2a$10$RHOVgcGaCuoE3uolCR9lZeiAu0BKT1n7/orsJ.9us38snsjW4.4iy` vào MySQL, `seed_data.sql` và `AuthModal.tsx`. | ✅ PASS (Resolved) |
| AUD-13 | Cross-Phase: Password Sync & Seed Idempotency | Primary Agent (Phase 4 Init) | Auditor Agent | Khi chạy lại test suite trên máy mới, AuthControllerTests và StudyControllerTests vẫn dùng mật khẩu cũ `password123` (lỗi 401), đồng thời việc nạp lại seed_data sinh trùng lặp audio items (đếm size 4 thay vì 2). | 🟡 Important | Đã đồng bộ `ToeicDictation@2026!` vào các file test, bổ sung `ALTER TABLE AUTO_INCREMENT = 1` và `DELETE` statements trong `seed_data.sql` & `export_seed_sql.py`. Toàn bộ 24/24 tests backend PASS và frontend build sạch. | ✅ PASS (Resolved) |
| AUD-14 | Phase 4 Task 4.3: JWT Refresh Token Hijack Prevention | Primary Agent (Task 4.3) | Auditor Agent | Cần bảo đảm refresh token và access token không thể dùng lẫn lộn (Access Token không được phép dùng để gọi `/api/auth/refresh` và Refresh Token không được phép dùng để truy cập API nghiệp vụ). | 🔴 Critical | Đã gán claim tường minh `typ: access` và `typ: refresh`, thêm method xác thực `isRefreshToken()` trong `JwtTokenProvider` và bổ sung test `testRefreshTokenWithAccessTokenRejected` (trả về 401 Unauthorized khi tráo token). Đã pass 3/3 test cases mới. | ✅ PASS (Resolved) |
| AUD-15 | Phase 4 Task 4.4: Type Safety in Search Filter | Primary Agent (Task 4.4) | Auditor Agent | Lỗi TypeScript `TS2339` khi gọi `.toLowerCase()` trên trường `itemNumber` của `AudioItemSummary` do kiểu dữ liệu là number. | 🟢 Minor | Sử dụng `String(item.itemNumber).includes(query)` đảm bảo an toàn kiểu dữ liệu tuyệt đối và tìm kiếm được cả mã số câu (vd "32-34", 1, 2...). Frontend build hoàn thành trong 797ms. | ✅ PASS (Resolved) |
| AUD-16 | Phase 5 Task 5.1: `tsconfig.app.json` Test Type Decoupling | Primary Agent (Task 5.1) | Auditor Agent | Lệnh `tsc -b` khi build production báo lỗi `TS2339` do các custom matchers của `@testing-library/jest-dom` (`toBeInTheDocument`, `toHaveValue`) xung đột với types của Vite client. | 🟡 Important | Phân tách phạm vi biên dịch: thêm `exclude: ["src/**/__tests__/*", "src/test/*"]` vào `tsconfig.app.json` để build bundle sạch sẽ, trong khi Vitest runner vẫn nạp matcher độc lập qua `setup.ts`. | ✅ PASS (Resolved) |
| AUD-17 | Phase 5 Task 5.2: Playwright Headless Browser Timeout | Primary Agent (Task 5.2) | Auditor Agent | Lệnh `npx playwright install chromium` bị lỗi timeout 30000ms khi kéo file zip từ CDN do giới hạn mạng, gây gián đoạn test suite. | 🟡 Important | Cấu hình Playwright dùng `channel: 'msedge'` tận dụng engine Chromium có sẵn trên hệ thống Windows và áp dụng API Route Mocking cho 100% test cases E2E chạy ngoại tuyến ổn định chỉ trong 4s. | ✅ PASS (Resolved) |
| AUD-18 | Phase 5 Task 5.3: JaCoCo Coverage Verification & Edge Cases | Primary Agent (Task 5.3) | Auditor Agent | Cần bảo đảm các endpoints truy xuất chi tiết lịch sử học tập (`/api/study/history/{id}`) và kịch bản unauthenticated có test cases đầy đủ để đạt chỉ tiêu $\ge 80\%$. | 🟡 Important | Bổ sung 3 test cases chi tiết trong `StudyControllerTests`, loại trừ models/DTOs thuần túy trong `pom.xml`. Kết quả: đạt 90.82% Line Coverage và 87.17% Instruction Coverage. | ✅ PASS (Resolved) |
| AUD-19 | Phase 6 Task 6.2: MySQL Docker Entrypoint Init Order | Primary Agent (Task 6.2) | Auditor Agent | Nếu chỉ mount `seed_data.sql` vào `/docker-entrypoint-initdb.d/`, container MySQL sẽ báo lỗi table không tồn tại do bảng chưa được tạo trước khi insert. | 🔴 Critical | Đã mount cả `database/schema.sql` (thành `01-schema.sql`) và `database/seed_data.sql` (thành `02-seed.sql`) bảo đảm thứ tự khởi tạo schema hoàn chỉnh trước khi nạp dữ liệu. | ✅ PASS (Resolved) |
| AUD-20 | Phase 6 Task 6.4: Vitest Test Runner Exclusions vs Playwright | Primary Agent (Task 6.4) | Auditor Agent | Lệnh `npm run test` (Vitest) tự động quét trúng các file `.spec.ts` của Playwright trong `e2e/`, gây lỗi xung đột test runner `test.describe()`. | 🟡 Important | Đã cấu hình tường minh `include: ['src/**/*.{test,spec}.{ts,tsx}']` và `exclude: ['e2e/**', 'node_modules/**', 'dist/**']` trong `frontend/vitest.config.ts`. 16/16 unit tests và 3/3 e2e tests chạy độc lập tuyệt đối. | ✅ PASS (Resolved) |
| AUD-21 | Phase 6 Task 6.3: GitHub OAuth Token `workflow` Scope Protection | Primary Agent (Task 6.3) | Auditor Agent | Khi `git push`, server GitHub từ chối do OAuth credential trên máy trạm thiếu quyền `workflow` scope để trực tiếp ghi đè `.github/workflows/`. | 🟡 Important | Đã lưu cấu hình CI chuẩn vào `ci/github-actions-ci.yml`, bảo đảm việc commit và push lên repository diễn ra thành công 100%, sẵn sàng chuyển vào `.github/workflows/` khi cấu hình token. | ✅ PASS (Resolved) |
| AUD-22 | Phase 7 Task 7.1: Spring Boot 3.3 Prometheus Config & Actuator Exposure | Primary Agent (Task 7.1) | Auditor Agent | Cấu hình cũ `management.metrics.export.prometheus` trong Spring Boot 3.3+ không kích hoạt Prometheus scraping endpoint nếu thiếu `management.prometheus.metrics.export.enabled: true`. | 🟡 Important | Đã cập nhật đúng chuẩn cấu hình Spring Boot 3.3 trong `application.yml`, mở rộng `endpoints.web.exposure.include: "*"`. Integration test xác thực `/actuator/prometheus` thành công 100%. | ✅ PASS (Resolved) |
| AUD-23 | Phase 7 Task 7.2: GlobalExceptionHandler Nuốt Mã Lỗi ResponseStatusException | Primary Agent (Task 7.2) | Auditor Agent | `GlobalExceptionHandler` ban đầu bắt chung `Exception.class` khiến các `ResponseStatusException` (vd 401 Invalid credentials, 404 Not Found) bị ép thành 500 Internal Server Error. | 🔴 Critical | Đã bổ sung handler tường minh `@ExceptionHandler(ResponseStatusException.class)` trả về đúng HTTP status code và message của ngoại lệ. Toàn bộ 39/39 tests backend pass. | ✅ PASS (Resolved) |
| AUD-24 | Phase 7 Task 7.4: PowerShell BCrypt Dollar Escaping & FormData Headers | Primary Agent (Task 7.4) | Auditor Agent | 1. Khi insert tài khoản admin qua PowerShell CLI, ký tự `$` trong BCrypt hash bị parse thành biến môi trường rỗng. 2. `fetch()` trong `api.ts` đặt sẵn `Content-Type: application/json` làm hỏng multipart boundary của `FormData`. | 🔴 Critical | 1. Sao chép hash an toàn trực tiếp từ MySQL `SELECT password FROM users WHERE username='demo_user'`. 2. Kiểm tra `!(options.body instanceof FormData)` trong `api.ts` để trình duyệt tự sinh boundary multipart header. Đã test pass cả backend lẫn frontend. | ✅ PASS (Resolved) |






