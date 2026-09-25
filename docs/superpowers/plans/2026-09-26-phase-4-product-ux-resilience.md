# Phase 4: Product & UX Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the TOEIC Dictation platform from a functional PoC into a resilient, production-ready product with local auto-save recovery, an interactive onboarding & shortcut cheatsheet, advanced JWT token rotation with silent background refresh, and responsive item search, filtering, and pagination.

**Architecture:** 
- Frontend state resilience: LocalStorage caching for session drafts (`DictationDraft`) and onboarding flags. 
- Authentication resilience: Dual-token system (Access Token 1h + Refresh Token 7d) with automatic silent refresh on 401 in `api.ts`.
- Content scalability: Search & Part filters with pagination support on both Spring Boot 3 backend and React 18 client.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, Spring Boot 3, Spring Security, JJWT 0.12.6, MySQL 8.x.

**Spec:** `PROJECT_STATE.md` (Section 6, Phase 4 & Multi-Agent Quality Protocol).

---

### Task 4.1: Auto-Save & Draft Recovery Mechanism (`LocalStorage`)

**Files:**
- Create: `frontend/src/services/storage.ts`
- Modify: `frontend/src/components/DictationPlayer.tsx`, `frontend/src/App.tsx`
- Test: Verify draft saving, recovery on reload, and clean removal on submit/reset.

- [ ] **Step 1: Tạo module `storage.ts` quản lý LocalStorage**
- [ ] **Step 2: Tích hợp Auto-save và Auto-restore vào `DictationPlayer.tsx`**
- [ ] **Step 3: Thêm chỉ báo trực quan "Đã lưu nháp" (Auto-saved badge) và nút "Xóa nháp làm lại"**
- [ ] **Step 4: Kiểm tra và kiểm toán chất lượng (Primary + Auditor)**

---

### Task 4.2: Onboarding Guide & Shortcut Cheatsheet Modal

**Files:**
- Create: `frontend/src/components/ShortcutModal.tsx`
- Modify: `frontend/src/components/Navbar.tsx`, `frontend/src/components/DictationPlayer.tsx`, `frontend/src/App.tsx`
- Test: Verify modal display, shortcut explanations, responsive layout, and first-visit prompt.

- [ ] **Step 1: Xây dựng Component `ShortcutModal.tsx`**
- [ ] **Step 2: Tích hợp nút mở modal trên `Navbar.tsx` và `DictationPlayer.tsx`**
- [ ] **Step 3: Logic tự động gợi ý cho học viên mới truy cập lần đầu**
- [ ] **Step 4: Kiểm tra và kiểm toán chất lượng (Primary + Auditor)**

---

### Task 4.3: JWT Refresh Token & Token Rotation

**Files:**
- Modify Backend:
  - `backend/src/main/java/com/toeic/dictation/security/JwtTokenProvider.java`
  - `backend/src/main/java/com/toeic/dictation/dto/auth/AuthResponse.java`
  - Create: `backend/src/main/java/com/toeic/dictation/dto/auth/RefreshTokenRequest.java`
  - `backend/src/main/java/com/toeic/dictation/service/AuthService.java`
  - `backend/src/main/java/com/toeic/dictation/controller/AuthController.java`
  - Test: `backend/src/test/java/com/toeic/dictation/controller/AuthControllerTests.java`
- Modify Frontend:
  - `frontend/src/types/index.ts`
  - `frontend/src/services/api.ts`
  - `frontend/src/context/AuthContext.tsx`
- Test: Verify token refresh endpoint, token rotation, silent re-fetch on 401, and graceful logout on expired refresh token.

- [ ] **Step 1: Nâng cấp `JwtTokenProvider` sinh Refresh Token**
- [ ] **Step 2: Xây dựng API `POST /api/auth/refresh` trong `AuthController` & `AuthService`**
- [ ] **Step 3: Viết Unit / Integration test cho Refresh Token flow trên Backend**
- [ ] **Step 4: Tích hợp Silent Refresh Interceptor trong `frontend/src/services/api.ts`**
- [ ] **Step 5: Kiểm tra và kiểm toán chất lượng (Primary + Auditor)**

---

### Task 4.4: Search, Part Filtering & Pagination for Practice Items

**Files:**
- Modify Backend:
  - `backend/src/main/java/com/toeic/dictation/repository/AudioItemRepository.java`
  - `backend/src/main/java/com/toeic/dictation/service/ToeicService.java`
  - `backend/src/main/java/com/toeic/dictation/controller/ToeicController.java`
  - Test: `backend/src/test/java/com/toeic/dictation/controller/ToeicControllerTests.java`
- Modify Frontend:
  - `frontend/src/services/api.ts`
  - `frontend/src/components/TestSelector.tsx`
- Test: Verify filtering by Part 3/4, search query matching, empty state display, and regression check for existing tests.

- [ ] **Step 1: Cập nhật Repository & Service hỗ trợ Search & Filter**
- [ ] **Step 2: Nâng cấp `ToeicController` hỗ trợ query parameters `part` và `search`**
- [ ] **Step 3: Viết Test cases kiểm tra Search & Filter trên Backend**
- [ ] **Step 4: Cập nhật UI `TestSelector.tsx` với thanh tìm kiếm và bộ lọc Part**
- [ ] **Step 5: Kiểm tra và kiểm toán chất lượng (Primary + Auditor)**
