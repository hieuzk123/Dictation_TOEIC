# Phase 7: Operations & Admin CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện hạ tầng vận hành, giám sát hiệu năng sản phẩm (Spring Boot Actuator + Prometheus metrics), xử lý bắt lỗi runtime tập trung (Sentry + React Error Boundary), tự động sao lưu định kỳ MySQL, và xây dựng hệ thống Quản trị Nội dung (Admin CMS UI & REST API) cho phép giáo viên tải lên file MP3 và transcript trực tiếp trên web.

**Architecture:**
- **Monitoring & Metrics:** Tích hợp `spring-boot-starter-actuator` và `micrometer-registry-prometheus` xuất các chỉ số JVM heap, CPU, HikariCP database pool và HTTP latency tại `/actuator/prometheus` và `/actuator/health`.
- **Runtime Error Resilience:** Thiết lập Global Error Boundary tại Frontend để bắt exception tránh màn hình trắng (White Screen of Death); cấu hình Sentry handler tại Backend với cơ chế fallback tự động nếu DSN chưa được cung cấp.
- **Automated Backup:** Xây dựng script sao lưu tự động `scripts/backup_mysql.bat` (Windows) & `scripts/backup_mysql.sh` (Linux/Docker) sử dụng `mysqldump` với timestamped archive và chính sách xoay vòng xóa bản ghi cũ sau 7 ngày.
- **Admin CMS & Content Ingestion:**
  - Backend: Module `AdminController` và `AdminContentService` bảo vệ bằng quyền `@PreAuthorize("hasRole('ADMIN')")`, xử lý multipart upload MP3, thuật toán thông minh bóc tách câu transcript, tính toán keyword và mốc thời gian tokens JSON, đồng thời cung cấp API thống kê hệ thống (`GET /api/admin/stats`) và xóa bài nghe (`DELETE /api/admin/items/{id}`).
  - Frontend: Giao diện `AdminCmsModal` glassmorphic hỗ trợ kéo thả file audio MP3, nhập transcript, theo dõi tiến trình upload, xem bảng thống kê số liệu và quản lý xóa đề thi; hỗ trợ nút 1-click đăng nhập tài khoản Admin mẫu trên `AuthModal`.

**Tech Stack:**
- Spring Boot 3.3.4, Spring Security 6, Spring Boot Actuator, Micrometer Prometheus.
- Sentry SDK (Java & React Error Boundary).
- MySQL 8.4, mysqldump, PowerShell, Bash.
- React 18, TypeScript, Tailwind CSS, Lucide Icons, Vitest, Playwright.

**Spec:** `PROJECT_STATE.md` (Mục 6 - Giai đoạn 7: Vận hành, Giám sát & Quản trị Nội dung).

## Global Constraints
- Tất cả các endpoint hiện tại và 33/33 tests backend hiện có phải tiếp tục PASS 100%.
- Actuator endpoints công khai chỉ gồm `/actuator/health` và `/actuator/info`; các endpoints giám sát chuyên sâu hoặc quản trị phải được phân quyền an toàn.
- Admin CMS upload phải xử lý an toàn đường dẫn file (path traversal protection), kiểm tra định dạng file âm thanh và transcript trước khi lưu trữ vào database.
- Giao diện Admin CMS phải kế thừa hệ thống Design System Glassmorphism đồng bộ (Tailwind slate-900 / emerald / indigo).

---

### Task 7.1: Giám sát Hiệu năng Thời gian thực (Spring Boot Actuator & Prometheus Metrics)

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/main/java/com/toeic/dictation/security/SecurityConfig.java`
- Test: `backend/src/test/java/com/toeic/dictation/ActuatorPrometheusTests.java`

- [x] **Step 1: Bổ sung dependencies `spring-boot-starter-actuator` và `micrometer-registry-prometheus` vào `backend/pom.xml`**
- [x] **Step 2: Cấu hình `management` endpoints trong `backend/src/main/resources/application.yml`**
  Kích hoạt `health`, `info`, `prometheus`, `metrics`. Cấu hình `show-details: always`.
- [x] **Step 3: Cấu hình Security permit cho Actuator health/info/prometheus trong `SecurityConfig.java`**
- [x] **Step 4: Viết Integration Test `ActuatorPrometheusTests.java`**
  Xác thực `GET /actuator/health` trả về HTTP 200 `{ "status": "UP" }` và `GET /actuator/prometheus` chứa metric `jvm_memory_used_bytes`.
- [x] **Step 5: Chạy test xác nhận thành công**

---

### Task 7.2: Bắt lỗi Runtime tức thì (Sentry & React Error Boundary)

**Files:**
- Create: `frontend/src/components/ErrorBoundary.tsx`
- Create: `frontend/src/components/__tests__/ErrorBoundary.test.tsx`
- Modify: `frontend/src/main.tsx`
- Modify: `backend/src/main/java/com/toeic/dictation/exception/GlobalExceptionHandler.java`
- Modify: `backend/src/main/resources/application.yml`

- [x] **Step 1: Nâng cấp `GlobalExceptionHandler.java` ở Backend**
  Bổ sung log chi tiết stack trace và fallback Sentry capture cho các uncaught exceptions.
- [x] **Step 2: Viết component `ErrorBoundary.tsx` cho React Frontend**
  Hiển thị fallback card glassmorphic thân thiện khi xảy ra lỗi render runtime, nút "Tải lại trang" và nút "Về trang chủ".
- [x] **Step 3: Viết Unit Test cho `ErrorBoundary.test.tsx`**
  Giả lập component con ném ngoại lệ và kiểm tra giao diện phục hồi hiển thị đầy đủ.
- [x] **Step 4: Bọc `<ErrorBoundary>` quanh ứng dụng tại `frontend/src/main.tsx`**

---

### Task 7.3: Tự động Sao lưu Dữ liệu MySQL (Backup Scripts)

**Files:**
- Create: `scripts/backup_mysql.bat` (Windows script)
- Create: `scripts/backup_mysql.sh` (Linux/Docker shell script)
- Modify: `.gitignore` (chặn thư mục `backups/`)

- [x] **Step 1: Viết script `scripts/backup_mysql.bat`**
  Tự động gọi `mysqldump`, tạo file sao lưu `backups/backup_toeic_dictation_YYYYMMDD_HHMMSS.sql`, kiểm tra mã thoát và xóa file cũ hơn 7 ngày.
- [x] **Step 2: Viết script `scripts/backup_mysql.sh`**
  Shell script tương thích môi trường Linux và Docker container, tích hợp chính sách retention 7 ngày.
- [x] **Step 3: Bổ sung thư mục `backups/` và `*.sql` trong `backups/` vào `.gitignore`**
- [x] **Step 4: Chạy thử nghiệm script sao lưu trên môi trường cục bộ**

---

### Task 7.4: Màn hình Quản trị Đề thi (Admin CMS UI & REST API)

**Files:**
- Modify: `database/seed_data.sql` (thêm user `admin` với role `ROLE_ADMIN`)
- Create: `backend/src/main/java/com/toeic/dictation/dto/AdminStatsResponse.java`
- Create: `backend/src/main/java/com/toeic/dictation/service/AdminContentService.java`
- Create: `backend/src/main/java/com/toeic/dictation/controller/AdminController.java`
- Test: `backend/src/test/java/com/toeic/dictation/controller/AdminControllerTests.java`
- Create: `frontend/src/components/AdminCmsModal.tsx`
- Create: `frontend/src/components/__tests__/AdminCmsModal.test.tsx`
- Modify: `frontend/src/services/api.ts` (thêm Admin API calls)
- Modify: `frontend/src/components/Navbar.tsx` (thêm nút Admin CMS khi user có role ROLE_ADMIN)
- Modify: `frontend/src/components/AuthModal.tsx` (thêm nút đăng nhập nhanh tài khoản Admin Teacher)
- Modify: `frontend/src/App.tsx` (tích hợp state mở modal Admin CMS)

- [x] **Step 1: Nạp tài khoản mẫu `admin` vào `database/seed_data.sql` và MySQL**
- [x] **Step 2: Viết DTO `AdminStatsResponse.java` và Service `AdminContentService.java`**
  Xử lý lưu file MP3, thuật toán parse câu, bóc tách tokens JSON và tính toán tổng số liệu thống kê.
- [x] **Step 3: Xây dựng REST API `AdminController.java`**
  Endpoints: `POST /api/admin/items/upload`, `DELETE /api/admin/items/{id}`, `GET /api/admin/stats`.
- [x] **Step 4: Viết Integration Tests `AdminControllerTests.java`**
  Kiểm tra xác thực quyền Admin (403 với ROLE_USER, 200 với ROLE_ADMIN), kiểm tra upload, stats và delete.
- [x] **Step 5: Xây dựng giao diện `AdminCmsModal.tsx` và Unit Tests tại Frontend**
- [x] **Step 6: Tích hợp vào Navbar, AuthModal và App.tsx**

---

### Task 7.5: Bàn giao, Kiểm toán Lỗi & Git Push

**Files:**
- Modify: `PROJECT_STATE.md` (Đánh dấu hoàn thành Giai đoạn 7, bổ sung AUD-22+).
- Git Commit & Push qua Pre-commit Quality Gate.

- [x] **Step 1: Kiểm toán chất lượng Đa tác tử (Primary + Auditor Agent)**
- [x] **Step 2: Cập nhật `PROJECT_STATE.md`**
- [x] **Step 3: Commit và Push toàn bộ mã nguồn lên GitHub repository**

