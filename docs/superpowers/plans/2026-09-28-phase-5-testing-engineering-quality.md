# Phase 5: Testing & Engineering Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai toàn diện bộ giải pháp kiểm thử tự động, đo lường độ phủ mã nguồn và cổng kiểm soát chất lượng (Quality Gate) cho TOEIC Dictation bao gồm Frontend Unit Tests (Vitest + RTL), End-to-End Testing (Playwright), Backend Code Coverage (JaCoCo >= 80%), và Git Pre-commit Hooks (Husky).

**Architecture:**
- **Frontend Unit & Component Testing:** Vitest kết hợp jsdom, `@testing-library/react` và `@testing-library/jest-dom` kiểm thử độc lập các modules, hooks và components cốt lõi (`storage`, `AudioPlayerBar`, `DictationPlayer`).
- **End-to-End Testing:** Playwright test suite chạy headless browser giả lập các kịch bản thực tế của người dùng: duyệt đề, tìm kiếm, lọc part, tương tác phím tắt, gõ bài nghe dictation.
- **Backend Code Coverage:** JaCoCo Maven Plugin tích hợp vào chu trình build `mvnw test jacoco:report`, đo lường độ phủ câu lệnh và rẽ nhánh của các service, scoring logic và controllers.
- **Quality Gate Automation:** Husky + Pre-commit hook kiểm tra type-checking, linter và unit test trước khi cho phép commit mã nguồn.

**Tech Stack:**
- Frontend: Vitest, @testing-library/react, @testing-library/jest-dom, jsdom, Playwright.
- Backend: JaCoCo 0.8.12, Spring Boot Test, MockMvc, JUnit 5.
- Automation & Hooks: Husky, lint-staged, PowerShell / Bash cross-platform scripts.

**Spec:** `PROJECT_STATE.md` (Mục 6 - Giai đoạn 5: Testing & Engineering Quality).

## Global Constraints
- Hệ điều hành: Windows, PowerShell / CMD, hỗ trợ cross-platform.
- Không phá vỡ 30/30 tests hiện có của Spring Boot backend.
- Đảm bảo thời gian chạy của test suite nhanh chóng, ổn định (idempotent, không bị flaky).
- Mật khẩu và thông tin nhạy cảm tuân thủ chuẩn an toàn (`ToeicDictation@2026!`).

---

### Task 5.1: Frontend Unit & Component Testing (Vitest + React Testing Library)

**Files:**
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/services/__tests__/storage.test.ts`
- Create: `frontend/src/components/__tests__/AudioPlayerBar.test.tsx`
- Create: `frontend/src/components/__tests__/DictationPlayer.test.tsx`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: `storage.ts`, `AudioPlayerBar.tsx`, `DictationPlayer.tsx`, `types/index.ts`.
- Produces: `npm run test` script chạy toàn bộ unit và component tests sạch 100%.

- [ ] **Step 1: Cài đặt Vitest, JSDOM và React Testing Library**
  Cài đặt dependencies dev vào `frontend/`:
  `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- [ ] **Step 2: Cấu hình `vitest.config.ts` và `src/test/setup.ts`**
  Cấu hình môi trường `jsdom`, alias, globals, và mock cho HTMLMediaElement (`HTMLAudioElement.prototype.play`, `pause`).
- [ ] **Step 3: Viết Unit Test cho `storage.ts`**
  Kiểm thử `saveDraft`, `getDraft`, TTL quá hạn 7 ngày, `clearDraft`, `hasDraft`, `isOnboardingSeen`, `setOnboardingSeen`.
- [ ] **Step 4: Viết Component Test cho `AudioPlayerBar.tsx`**
  Kiểm thử render mốc thời gian, nút Play/Pause, nút tua 3s, thanh kéo playback speed và hiển thị tên câu.
- [ ] **Step 5: Viết Component Test cho `DictationPlayer.tsx`**
  Kiểm thử render 3 chế độ đục lỗ (Medium, Hard, Full), ô input gõ từ, nút gợi ý chữ cái đầu, badge lưu nháp, và hotkeys.
- [ ] **Step 6: Chạy kiểm thử Frontend và xác nhận 100% test cases pass**

---

### Task 5.2: End-to-End Testing Suite (Playwright Test Suite)

**Files:**
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/home-navigation.spec.ts`
- Create: `frontend/e2e/dictation-flow.spec.ts`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: Production preview hoặc dev server Vite port 5173.
- Produces: `npm run test:e2e` headless browser test runner.

- [ ] **Step 1: Cài đặt `@playwright/test` và Chromium browser binaries**
- [ ] **Step 2: Tạo cấu hình `playwright.config.ts`**
  Cấu hình `baseURL: http://localhost:5173`, webServer dev command tự động khởi động nếu chưa chạy.
- [ ] **Step 3: Viết E2E Test `home-navigation.spec.ts`**
  Kiểm thử luồng: mở trang chủ, kiểm tra Onboarding Shortcut modal, đóng modal, tìm kiếm bài nghe bằng từ khóa, lọc theo Part 3 và Part 4.
- [ ] **Step 4: Viết E2E Test `dictation-flow.spec.ts`**
  Kiểm thử luồng: chọn bài nghe "Office Supply Toner Order", chọn chế độ nghe MEDIUM, kiểm tra các ô input đục lỗ, gõ từ khóa, kích hoạt phím tắt hint, kiểm tra hiển thị bản nháp.
- [ ] **Step 5: Thực thi Playwright headless test và xác nhận pass**

---

### Task 5.3: Đo lường Độ phủ Mã nguồn Backend (JaCoCo Code Coverage >= 80%)

**Files:**
- Modify: `backend/pom.xml`
- Create / Update tests if needed: `backend/src/test/java/com/toeic/dictation/...`

**Interfaces:**
- Consumes: Maven test lifecycle.
- Produces: `backend/target/site/jacoco/index.html` báo cáo độ phủ chi tiết.

- [ ] **Step 1: Cấu hình `jacoco-maven-plugin` (0.8.12) trong `backend/pom.xml`**
  Gắn goal `prepare-agent` vào `initialize` và `report` vào `test` / `verify` phase; cấu hình loại trừ model DTO đơn giản và config.
- [ ] **Step 2: Chạy `.\mvnw.cmd test jacoco:report` và phân tích tỷ lệ độ phủ**
  Đánh giá độ phủ dòng lệnh (Line Coverage) và rẽ nhánh (Branch Coverage) của các service cốt lõi: `DictationScoringService`, `ToeicService`, `AuthService`.
- [ ] **Step 3: Viết thêm Unit/Integration Tests bổ sung các nhánh edge-cases**
  Kiểm thử các trường hợp ngoại lệ: token không hợp lệ, chấm điểm chuỗi rỗng, test không tồn tại, lỗi dữ liệu segment, v.v.
- [ ] **Step 4: Xác nhận báo cáo JaCoCo đạt mục tiêu >= 80% coverage cho core business packages**

---

### Task 5.4: Tiêu chuẩn hóa Git Hooks (Husky & Pre-commit Quality Gate)

**Files:**
- Create: `.husky/pre-commit`
- Create: `package.json` (ở root repo) hoặc script kiểm soát pre-commit
- Modify: `PROJECT_STATE.md`

**Interfaces:**
- Consumes: Git pre-commit trigger.
- Produces: Tự động chặn commit nếu code có lỗi type-check, linter hoặc unit test bị hỏng.

- [ ] **Step 1: Khởi tạo cấu hình Git Hook `.husky/pre-commit`**
- [ ] **Step 2: Cấu hình các bước kiểm tra tự động trước khi commit**
  1. Kiểm tra TypeScript build trong `frontend/` (`npm run build`).
  2. Chạy nhanh bộ kiểm thử frontend `npm run test -- --run`.
  3. Kiểm tra định dạng và linter `oxlint`.
- [ ] **Step 3: Thử nghiệm thực tế cơ chế chặn lỗi của Pre-commit Hook**

---

### Task 5.5: Bàn giao, Cập nhật PROJECT_STATE.md & Git Remote Push

**Files:**
- Modify: `PROJECT_STATE.md` (Cập nhật tiến độ Giai đoạn 5, ghi nhận mục AUD mới trong Section 7).
- Git Commit & Push: Nhánh `main` trên `https://github.com/hieuzk123/Dictation_TOEIC`.

- [ ] **Step 1: Rà soát chéo giữa Primary Agent và Auditor Agent (Multi-Agent Quality Protocol)**
- [ ] **Step 2: Cập nhật tài liệu `PROJECT_STATE.md`**
- [ ] **Step 3: Commit và Push mã nguồn hoàn chỉnh lên GitHub**
