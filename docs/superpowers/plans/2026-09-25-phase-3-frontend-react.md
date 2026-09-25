# Phase 3: Frontend Web App (React 18 + Vite + TypeScript + Tailwind CSS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a state-of-the-art, high-engagement TOEIC Dictation Web Application in React 18, TypeScript, and Tailwind CSS that connects seamlessly to the Spring Boot 3 backend, featuring a glassmorphism single-audio controller, 3 interactive cloze/full-sentence dictation modes, hotkey navigation, and instant visual accuracy feedback.

**Architecture:** Single-Page Application (SPA) built with Vite and React 18 in TypeScript. State is managed via modular React Contexts and hooks (`AuthContext`, `useAudioSegmentPlayer`, `useDictationSession`). The UI adheres to a modern EdTech aesthetic (Slate/Indigo/Emerald glassmorphism) using Tailwind CSS and Lucide icons. Backend communication is routed through a typed Axios/Fetch API client with JWT interception and Vite proxy.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Lucide React, HTML5 Audio API.

**Spec:** `PROJECT_STATE.md` (Section 6 & Multi-Agent Quality Protocol) and `toeic_dictation_prompt.md`.

## Global Constraints

- **Multi-Agent Quality Protocol**: Every task must be implemented by Primary Agent and audited by Auditor Agent, with defects and fixes recorded in `PROJECT_STATE.md` Section 7.
- **Design Standard**: Premium, modern EdTech UI (dark/light contrast, indigo primary `#4F46E5`, emerald success `#10B981`, rose danger `#F43F5E`, slate slate backgrounds `#0F172A`, glassmorphic audio controls). No generic, bland, or unstyled elements.
- **Audio Integrity**: Single `<audio>` element per item. Playhead seeks to `start_time` and pauses or loops upon reaching `end_time` of the active segment without downloading separate audio slices.
- **Hotkeys Support**: `Space` (replay/play active segment), `Enter` (check segment), `Ctrl+Right`/`Ctrl+Left` (next/prev segment). Must not interfere when typing inside text inputs.
- **Cross-Platform Compatibility**: Relative API calls routed via Vite dev proxy `/api` and `/audio` to Spring Boot on `http://localhost:8080`.

---

### Task 1: Scaffolding Vite + React 18 + TypeScript + Tailwind CSS & Design System

**Files:**
- Create: `frontend/` (Vite template `react-ts`)
- Modify: `frontend/vite.config.ts`, `frontend/tailwind.config.js`, `frontend/src/index.css`
- Test: Verify build with `npm run build`

**Interfaces:**
- Produces: Working React + Vite frontend environment configured with Tailwind CSS, custom design tokens, and dev proxy to `http://localhost:8080`.

- [ ] **Step 1: Khởi tạo dự án Vite React-TS**

Run command in root workspace:
```powershell
npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: Cài đặt Tailwind CSS và dependencies**

```powershell
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react
```

- [ ] **Step 3: Cấu hình Tailwind Config & Vite Proxy**

Cấu hình `tailwind.config.js` với bảng màu EdTech hiện đại và font chữ sạch sẽ:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        slate: {
          850: '#151e2e',
          950: '#070d19'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
```

Cập nhật `vite.config.ts` để proxy `/api` và `/audio` sang backend:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/audio': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
```

Cập nhật `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-slate-950 text-slate-100 font-sans antialiased selection:bg-brand-500 selection:text-white;
    min-height: 100vh;
  }
}

.glass-panel {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step 4: Chạy kiểm tra build**

```powershell
npm run build
```
Kỳ vọng: Build thành công tạo thư mục `dist/` mà không có lỗi TypeScript hay cú pháp.

- [ ] **Step 5: Auditor Agent Review & Git Commit**
Auditor kiểm tra config và styling. Commit `feat(frontend): scaffold react 18 typescript vite app with tailwind css`.

---

### Task 2: API Client, Type Definitions & Auth Module

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/components/AuthModal.tsx`

**Interfaces:**
- Produces: Typed API calls for tests, items, audio, and auth; `AuthContext` with login/register/logout states and modal.

- [ ] **Step 1: Định nghĩa TypeScript Interfaces**

Tạo `src/types/index.ts`:
- `User`, `LoginRequest`, `RegisterRequest`, `AuthResponse`
- `ToeicTest`, `AudioItemSummary`, `AudioItemDetail`, `AudioSegment`, `TokenItem`
- `SubmitStudyRequest`, `SubmitStudyResponse`, `StudyHistory`

- [ ] **Step 2: Xây dựng API Service**

Tạo `src/services/api.ts` quản lý token lưu ở `localStorage`, header `Authorization: Bearer <token>`, và các hàm gọi API chuẩn xác.

- [ ] **Step 3: Xây dựng AuthContext & AuthModal**

Tạo `src/context/AuthContext.tsx` và `src/components/AuthModal.tsx` hỗ trợ:
- Đăng nhập (với nút Quick Fill `demo_user` / `password123` tiện lợi).
- Đăng ký tài khoản mới.
- Lưu trữ phiên đăng nhập và tự động khôi phục khi reload trang.

- [ ] **Step 4: Kiểm tra build & Auditor Agent Review**
Chạy `npm run build` và thực hiện audit Task 2.

---

### Task 3: Test Browser & Item Selection View

**Files:**
- Create: `frontend/src/components/Navbar.tsx`
- Create: `frontend/src/components/TestSelector.tsx`
- Create: `frontend/src/components/ItemCard.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `api.getTests()`, `api.getTestItems(testId)`, `AuthContext`.
- Produces: Màn hình chọn đề thi (ETS 2024 Test 1), chọn Part 3 (Hội thoại) / Part 4 (Bài nói ngắn), danh sách các bài nghe kèm thông tin số câu, thời lượng và lịch sử học tập.

- [ ] **Step 1: Tạo Header / Navbar hiện đại**
Hiển thị logo TOEIC Dictation Pro, thông tin user, nút Đăng nhập / Đăng xuất, link chuyển nhanh bài tập.

- [ ] **Step 2: Tạo TestSelector & ItemCard**
Tabs chuyển đổi Part 3 & Part 4, badge câu hỏi (Q32-34, Q71-73), thời lượng audio chuẩn phút:giây, badge trạng thái đã học / chưa học.

- [ ] **Step 3: Tích hợp vào App.tsx**
Hiển thị danh sách đề thi lấy trực tiếp từ Spring Boot backend.

- [ ] **Step 4: Auditor Agent Review & Git Commit**

---

### Task 4: Precision Audio Controller Hook & Glassmorphic Player

**Files:**
- Create: `frontend/src/hooks/useAudioSegmentPlayer.ts`
- Create: `frontend/src/components/AudioPlayerBar.tsx`

**Interfaces:**
- Consumes: Audio URL (`/audio/...`), `currentSegment: { startTime, endTime }`.
- Produces: Hàm điều khiển playback, seek segment, lặp đoạn, chỉnh tốc độ (`0.75x`, `0.9x`, `1.0x`, `1.25x`), thanh sóng âm thanh / progress bar trực quan.

- [ ] **Step 1: Xây dựng Hook `useAudioSegmentPlayer`**
- Quản lý 1 đối tượng `HTMLAudioElement` duy nhất.
- Hàm `playSegment(startTime, endTime)`: seek đến `startTime` và tự động dừng khi đến `endTime`.
- Hỗ trợ cờ `autoLoop: boolean` để tự động lặp lại câu đang luyện nghe.
- Bộ đếm `replayCount` phục vụ thống kê số lần nghe lại của học viên.

- [ ] **Step 2: Xây dựng Component `AudioPlayerBar.tsx`**
Giao diện thanh điều khiển thanh lịch đặt ở dưới hoặc trên khu vực làm bài:
- Nút Play/Replay to, nổi bật.
- Nút Tua lùi 3s / Tua tới 3s.
- Chọn tốc độ đọc (0.75x -> 1.25x).
- Thanh timeline hiển thị cả mốc toàn bài lẫn mốc giới hạn của câu hiện tại.

- [ ] **Step 3: Auditor Agent Review & Git Commit**

---

### Task 5: Interactive Dictation Engine & Workspace (`DictationPlayer.tsx`)

**Files:**
- Create: `frontend/src/components/DictationPlayer.tsx`
- Create: `frontend/src/components/SegmentNav.tsx`
- Create: `frontend/src/components/ModeSelector.tsx`

**Interfaces:**
- Consumes: `AudioItemDetail`, `useAudioSegmentPlayer`.
- Produces: Không gian chép chính tả thông minh với 3 chế độ (Medium, Hard, Full Sentence), so khớp từ tức thì, phím tắt toàn năng, và nút hiện đáp án.

- [ ] **Step 1: Xây dựng ModeSelector & SegmentNav**
- Chuyển đổi linh hoạt giữa 3 chế độ:
  - **Medium**: Ẩn các từ khóa quan trọng (`is_keyword == true`).
  - **Hard**: Ẩn 70-80% số từ, chỉ hiển thị ký tự đầu làm gợi ý.
  - **Full Sentence**: Ẩn toàn bộ câu, người học tự nghe và gõ cả câu.
- Thanh điều hướng danh sách các câu trong bài (e.g. Câu 1/7, Câu 2/7...).

- [ ] **Step 2: Xây dựng DictationPlayer Component**
- Tự động sinh các ô input hoặc trường gõ tùy theo mode đã chọn.
- Xử lý phím tắt thông minh:
  - `Space`: Nghe lại câu hiện tại (khi không focus input văn bản).
  - `Enter`: Nộp và kiểm tra câu hiện tại.
  - `Ctrl + Left / Right`: Di chuyển câu trước / sau.
- So khớp tức thời:
  - Chuẩn hóa: bỏ dấu câu, case-insensitive.
  - Hiển thị màu xanh lá cho từ đúng, màu đỏ gạch chân cho từ sai.
  - Nút "Hiện đáp án" cho học viên đối chiếu transcript gốc khi gặp câu quá khó.

- [ ] **Step 3: Auditor Agent Review & Git Commit**

---

### Task 6: Submission, Study Results Modal & End-to-End Verification

**Files:**
- Create: `frontend/src/components/ResultModal.tsx`
- Create: `frontend/src/components/HistoryDrawer.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `PROJECT_STATE.md`

**Interfaces:**
- Consumes: Toàn bộ module Frontend kết nối Spring Boot Backend.
- Produces: Luồng hoàn chỉnh từ chọn bài -> nghe chép chính tả -> nộp bài -> lưu lịch sử trên MySQL -> xem bảng kết quả chi tiết.

- [ ] **Step 1: Xây dựng ResultModal & Lưu Lịch sử**
Khi hoàn thành toàn bộ các câu của một bài nghe:
- Gửi payload lên `POST /api/study/submit`.
- Hiển thị popup tổng kết: Tỷ lệ chính xác %, Tổng số câu đúng/sai, Số lần nghe lại, Đánh giá xếp loại.
- Nút "Làm lại bài" hoặc "Tiếp tục bài tiếp theo".

- [ ] **Step 2: Xây dựng HistoryDrawer**
Hiển thị lịch sử các lần luyện nghe đã lưu trong database `study_histories`.

- [ ] **Step 3: Kiểm thử toàn diện Build & E2E trên Trình duyệt**
- Chạy `npm run build` không lỗi.
- Khởi động dev server và kiểm thử tương tác trơn tru với backend Spring Boot.

- [ ] **Step 4: Cập nhật PROJECT_STATE.md & Báo cáo Auditor**
Đánh dấu hoàn thành toàn bộ Phase 3 và cập nhật bảng rà soát lỗi đa tác tử.
