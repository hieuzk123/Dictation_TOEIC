# Phase 6: DevOps & CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đóng gói toàn bộ hệ thống TOEIC Dictation thành các Docker containers độc lập (Multi-stage build), khởi chạy 1 lệnh duy nhất với Docker Compose, thiết lập tự động hóa kiểm thử liên tục (GitHub Actions CI) và chuẩn hóa cấu hình biến môi trường production.

**Architecture:**
- **Containerization:** 
  - Backend: Multi-stage Dockerfile với Maven builder và Eclipse Temurin 21 JRE Alpine runtime, cấu hình non-root user và tối ưu RAM container.
  - Frontend: Multi-stage Dockerfile với Node.js builder và Nginx Alpine reverse proxy phục vụ SPA, điều hướng `/api` và `/audio` về backend service.
- **Orchestration:** `docker-compose.yml` gom cụm 3 container `mysql:8.4` (kèm auto-seed init), `backend` (chờ MySQL healthy), và `frontend` (Nginx), cấu hình internal bridge network và persistent volume.
- **CI/CD Automation:** GitHub Actions workflow `.github/workflows/ci.yml` tự động chạy 2 jobs song song (Frontend lint/build/test & Backend MySQL service container + mvnw test + JaCoCo report).
- **Environment Management:** `.env.example` và `application.yml` hỗ trợ cấu hình động qua environment variables (`SPRING_DATASOURCE_*`, `JWT_SECRET`, `APP_AUDIO_DIR`) với fallback mặc định tương thích 100% môi trường local.

**Tech Stack:**
- Docker, Docker Compose v2.
- Nginx Alpine, Eclipse Temurin 21 JRE Alpine, Node 22 Alpine, MySQL 8.4.
- GitHub Actions CI (Ubuntu Latest, Service Containers).
- Spring Boot 3 Externalized Configuration, Vite SPA Routing.

**Spec:** `PROJECT_STATE.md` (Mục 6 - Giai đoạn 6: DevOps & CI/CD).

## Global Constraints
- Cấu hình biến môi trường phải có fallback mặc định để không phá vỡ 33/33 backend tests và các scripts chạy local hiện tại.
- Nginx phải xử lý chuẩn xác SPA routing (`try_files $uri $uri/ /index.html;`) và reverse proxy pass headers (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`).
- Docker Compose phải đảm bảo thứ tự khởi chạy (healthcheck MySQL trước khi backend boot).

---

### Task 6.1: Container hóa Đa tầng (Multi-Stage Dockerfiles)

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`
- Create: `frontend/.dockerignore`

- [x] **Step 1: Viết `backend/Dockerfile` & `.dockerignore`**
  Multi-stage build: Maven build stage $\rightarrow$ Temurin JRE runtime stage, tạo non-root user `spring`, expose 8080.
- [x] **Step 2: Viết `frontend/nginx.conf`**
  Cấu hình Nginx reverse proxy phục vụ static assets, SPA client-side routing fallback `/index.html`, và proxy `/api/` và `/audio/` sang upstream `backend:8080`.
- [x] **Step 3: Viết `frontend/Dockerfile` & `.dockerignore`**
  Multi-stage build: Node build stage (`npm run build`) $\rightarrow$ Nginx Alpine production image, expose 80.
- [x] **Step 4: Kiểm tra cú pháp và cấu hình Dockerfiles**

---

### Task 6.2: Khởi chạy 1 lệnh duy nhất (Docker Compose Orchestration)

**Files:**
- Create: `docker-compose.yml`

- [x] **Step 1: Viết `docker-compose.yml` tích hợp 3 services**
  - `mysql`: Image `mysql:8.4`, mount `database/schema.sql` (01) và `database/seed_data.sql` (02) vào `/docker-entrypoint-initdb.d/`, healthcheck `mysqladmin ping`.
  - `backend`: Build context `backend/`, depends_on `mysql` (`condition: service_healthy`), mount sample audio directory, network bridge.
  - `frontend`: Build context `frontend/`, depends_on `backend`, mapping port 80.
- [x] **Step 2: Cấu hình volumes và network an toàn**
- [x] **Step 3: Kiểm tra cấu trúc `docker-compose config`**

---

### Task 6.3: Quy trình Tích hợp Liên tục (GitHub Actions CI)

**Files:**
- Create: `.github/workflows/ci.yml`

- [x] **Step 1: Viết workflow `.github/workflows/ci.yml`**
  Thiết lập trigger `push` và `pull_request` vào branch `main`.
- [x] **Step 2: Cấu hình Job `frontend-ci`**
  Checkout, setup Node.js 22, cache npm dependencies, `npm ci`, `npm run lint`, `npm run build`, `npm run test`.
- [x] **Step 3: Cấu hình Job `backend-ci`**
  Checkout, setup Java 21 Temurin, cấu hình service container MySQL 8.4, nạp seed data, chạy `./mvnw clean test jacoco:report`, lưu artifact JaCoCo HTML.

---

### Task 6.4: Quản lý Biến Môi trường Sản phẩm (.env.example & Dynamic Config)

**Files:**
- Create: `.env.example`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `.gitignore`

- [x] **Step 1: Cập nhật `backend/src/main/resources/application.yml` hỗ trợ Env Vars**
  Inject `${SPRING_DATASOURCE_URL:...}`, `${SPRING_DATASOURCE_USERNAME:...}`, `${SPRING_DATASOURCE_PASSWORD:...}`, `${JWT_SECRET:...}`, `${APP_AUDIO_DIR:...}`.
- [x] **Step 2: Tạo `.env.example` chuẩn hóa biến môi trường cho sản phẩm**
- [x] **Step 3: Đảm bảo `.gitignore` chặn rò rỉ `.env` cục bộ**
- [x] **Step 4: Xác nhận 33/33 tests backend vẫn pass 100% với cấu hình động**

---

### Task 6.5: Bàn giao, Kiểm toán Lỗi & Git Push

**Files:**
- Modify: `PROJECT_STATE.md` (Đánh dấu hoàn thành Giai đoạn 6, ghi nhận AUD-19, AUD-20).
- Git Commit & Push qua Pre-commit Quality Gate.

- [x] **Step 1: Kiểm toán chất lượng Đa tác tử (Primary + Auditor Agent)**
- [x] **Step 2: Cập nhật `PROJECT_STATE.md`**
- [x] **Step 3: Commit và Push toàn bộ thay đổi lên GitHub**
