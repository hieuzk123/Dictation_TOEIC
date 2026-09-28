# Practice Modes, Full Passage Dictation, Multiple-Choice Questions & Admin CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai cải tiến phương thức luyện tập TOEIC Dictation: Chế độ Trung bình (dừng ở từng câu), Chế độ Nâng cao (đọc toàn bài Full Passage kèm 3 câu hỏi trắc nghiệm A/B/C/D), Bộ chọn tỉ lệ đục lỗ 30%/50%/70%, Báo cáo kết quả 2 cột điểm, và nâng cấp Admin CMS Upload hỗ trợ nhập câu hỏi trực quan + Quick-Paste regex.

**Architecture:** Mở rộng database MySQL với bảng `toeic_questions` (1-N với `audio_items`), cập nhật Spring Boot 3 Backend với `ToeicQuestion` entity, DTOs, scoring logic trong `StudyService` và upload parser trong `AdminContentService`. Ở Frontend React 18, xây dựng component `ClozeDensitySelector`, `FullPassageDictation`, nâng cấp `ResultModal` hiển thị 2 cột điểm và `AdminCmsModal` với form 3 câu hỏi + tab dán nhanh.

**Tech Stack:** MySQL 8.x, Java 21, Spring Boot 3.3.4 (Spring Data JPA, Hibernate, Jackson), React 18, TypeScript, Tailwind CSS, Lucide Icons, Vitest, Playwright.

**Spec:** [docs/superpowers/specs/2026-09-28-practice-modes-and-questions-design.md](file:///d:/Dictation_TOEIC/docs/superpowers/specs/2026-09-28-practice-modes-and-questions-design.md)

## Global Constraints
- Java 21, Spring Boot 3.3.4, Hibernate 6 JPA.
- Tỉ lệ đục lỗ: 30%, 50%, 70% áp dụng cho cả 2 chế độ, ô input để trống `placeholder=""`.
- Chế độ Nâng cao bắt buộc trả lời đủ 3 câu trắc nghiệm mới được nộp bài.
- ResultModal hiển thị 2 điểm số độc lập: Dictation % và TOEIC Questions Y/3.
- Bảo đảm 100% tests backend và frontend đều PASS, JaCoCo Line Coverage > 90%.

---

### Task 1: Database Schema & Seed Data (MySQL `toeic_questions` Table)

**Files:**
- Modify: `database/schema.sql`
- Modify: `database/seed_data.sql`
- Execute: SQL migration vào database `toeic_dictation`

**Interfaces:**
- Produces: Bảng `toeic_questions` với khóa ngoại `item_id` tham chiếu `audio_items(id)` và 6 câu hỏi mẫu chuẩn ETS (3 câu cho Item 1, 3 câu cho Item 2).

- [ ] **Step 1: Cập nhật DDL trong `database/schema.sql`**
Thêm bảng `toeic_questions`:
```sql
-- 6. Table: toeic_questions
CREATE TABLE `toeic_questions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `item_id` BIGINT NOT NULL,
  `question_number` INT NOT NULL COMMENT 'e.g. 32, 33, 34 or 71, 72, 73',
  `question_text` TEXT NOT NULL,
  `option_a` TEXT NOT NULL,
  `option_b` TEXT NOT NULL,
  `option_c` TEXT NOT NULL,
  `option_d` TEXT NOT NULL,
  `correct_option` VARCHAR(5) NOT NULL COMMENT 'A, B, C, D',
  `explanation` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`item_id`) REFERENCES `audio_items` (`id`) ON DELETE CASCADE,
  INDEX `idx_questions_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Cập nhật Seed Data trong `database/seed_data.sql`**
Thêm lệnh insert 3 câu hỏi cho Item 1 (Q32-34) và 3 câu hỏi cho Item 2 (Q71-73).

- [ ] **Step 3: Thực thi migration vào local MySQL**
Chạy lệnh tạo bảng và nạp seed data vào MySQL database `toeic_dictation`.

- [ ] **Step 4: Kiểm tra dữ liệu trong MySQL**
Chạy lệnh SQL verify:
`& "D:\xampp\mysql\bin\mysql.exe" -u root toeic_dictation -e "SELECT id, item_id, question_number, correct_option FROM toeic_questions;"`
Xác nhận trả về 6 câu hỏi.

- [ ] **Step 5: Commit**
`git add database/schema.sql database/seed_data.sql && git commit -m "feat(db): add toeic_questions schema and seed data"`

---

### Task 2: Backend Entity, Repository & DTOs for Questions

**Files:**
- Create: `backend/src/main/java/com/toeic/dictation/model/ToeicQuestion.java`
- Create: `backend/src/main/java/com/toeic/dictation/repository/ToeicQuestionRepository.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/toeic/ToeicQuestionDto.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/toeic/CreateQuestionRequest.java`
- Modify: `backend/src/main/java/com/toeic/dictation/model/AudioItem.java`
- Modify: `backend/src/main/java/com/toeic/dictation/dto/toeic/AudioItemDetailDto.java`
- Modify: `backend/src/main/java/com/toeic/dictation/service/ToeicService.java`
- Test: `backend/src/test/java/com/toeic/dictation/controller/ToeicControllerTests.java`

**Interfaces:**
- Produces: `GET /api/items/{id}` trả về `AudioItemDetailDto` chứa `List<ToeicQuestionDto> questions`.

- [ ] **Step 1: Viết test kỳ vọng trong `ToeicControllerTests.java`**
Thêm test case `getItemDetailShouldReturnQuestions`:
```java
@Test
@DisplayName("GET /api/items/{id} should return questions array for the audio item")
void testGetItemDetailWithQuestions() throws Exception {
    mockMvc.perform(get("/api/items/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.questions", notNullValue()))
            .andExpect(jsonPath("$.questions", hasSize(greaterThanOrEqualTo(3))))
            .andExpect(jsonPath("$.questions[0].questionText", notNullValue()))
            .andExpect(jsonPath("$.questions[0].optionA", notNullValue()));
}
```

- [ ] **Step 2: Chạy test để xác nhận test fail**
Chạy `.\mvnw.cmd test -Dtest=ToeicControllerTests#testGetItemDetailWithQuestions`
Xác nhận FAIL (do trường questions chưa tồn tại).

- [ ] **Step 3: Tạo Entity `ToeicQuestion.java`, Repository và DTOs**
Cập nhật `AudioItem.java` liên kết `@OneToMany List<ToeicQuestion> questions` và `ToeicService.java` map `questions` sang `ToeicQuestionDto`.

- [ ] **Step 4: Chạy test để xác nhận test pass**
Chạy `.\mvnw.cmd test -Dtest=ToeicControllerTests`
Xác nhận PASS 100%.

- [ ] **Step 5: Commit**
`git commit -am "feat(backend): implement ToeicQuestion model, repo, and DTOs in getItemDetail"`

---

### Task 3: Backend Scoring & History for Multiple-Choice Questions

**Files:**
- Create: `backend/src/main/java/com/toeic/dictation/dto/study/QuestionResultDto.java`
- Modify: `backend/src/main/java/com/toeic/dictation/dto/study/SubmitStudyRequest.java`
- Modify: `backend/src/main/java/com/toeic/dictation/dto/study/SubmitStudyResponse.java`
- Modify: `backend/src/main/java/com/toeic/dictation/service/StudyService.java`
- Test: `backend/src/test/java/com/toeic/dictation/controller/StudyControllerTests.java`

**Interfaces:**
- Consumes: `SubmitStudyRequest` có thêm `Map<Long, String> questionAnswers` (questionId -> userOption e.g. "A").
- Produces: `SubmitStudyResponse` có thêm `int totalQuestions`, `int correctQuestions`, `List<QuestionResultDto> questionResults`.

- [ ] **Step 1: Viết failing test trong `StudyControllerTests.java`**
Thêm test case nộp bài chế độ HARD có kèm đáp án trắc nghiệm:
```java
@Test
@DisplayName("Submit study in HARD mode with multiple choice question answers should score both dictation and questions")
void testSubmitStudyWithQuestionAnswers() throws Exception { ... }
```

- [ ] **Step 2: Chạy test để xác nhận fail**
Chạy `.\mvnw.cmd test -Dtest=StudyControllerTests#testSubmitStudyWithQuestionAnswers`
Xác nhận FAIL.

- [ ] **Step 3: Cập nhật DTOs và `StudyService.java`**
Trong `StudyService.submitStudy()`:
1. Duyệt qua `item.getQuestions()`.
2. So khớp `userOption` với `question.getCorrectOption()`.
3. Tính toán `correctQuestions` và sinh `List<QuestionResultDto>`.
4. Đóng gói vào `detailsJson` của `StudyHistory` và gán vào `SubmitStudyResponse`.

- [ ] **Step 4: Chạy test để xác nhận pass**
Chạy `.\mvnw.cmd test -Dtest=StudyControllerTests`
Xác nhận PASS.

- [ ] **Step 5: Commit**
`git commit -am "feat(backend): add multiple-choice question scoring in StudyService"`

---

### Task 4: Backend Admin CMS Upload with Questions Support

**Files:**
- Modify: `backend/src/main/java/com/toeic/dictation/service/AdminContentService.java`
- Modify: `backend/src/main/java/com/toeic/dictation/controller/AdminController.java`
- Test: `backend/src/test/java/com/toeic/dictation/controller/AdminControllerTests.java`

**Interfaces:**
- Produces: `POST /api/admin/items` hỗ trợ tham số multipart `questionsJson` lưu danh sách 3 câu hỏi trắc nghiệm vào `toeic_questions`.

- [ ] **Step 1: Viết test upload kèm `questionsJson` trong `AdminControllerTests.java`**
- [ ] **Step 2: Chạy test để xác nhận fail**
- [ ] **Step 3: Cập nhật `AdminContentService.uploadAndCreateItem`**
Parse `questionsJson` thành `List<CreateQuestionRequest>` và lưu `ToeicQuestion` liên kết với `savedItem`.
- [ ] **Step 4: Chạy test xác nhận pass**
Chạy `.\mvnw.cmd test -Dtest=AdminControllerTests`
- [ ] **Step 5: Commit**
`git commit -am "feat(backend): support uploading questions in AdminContentService"`

---

### Task 5: Frontend Cloze Density Selector & Algorithm (30%, 50%, 70%)

**Files:**
- Create: `frontend/src/components/ClozeDensitySelector.tsx`
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/storage.ts`
- Modify: `frontend/src/components/DictationPlayer.tsx`
- Test: `frontend/src/components/__tests__/ClozeDensitySelector.test.tsx`
- Test: `frontend/src/components/__tests__/DictationPlayer.test.tsx`

**Interfaces:**
- Produces: Component `ClozeDensitySelector` với 3 lựa chọn 30%, 50%, 70%.
- Produces: Hàm `isTokenBlank` trong `DictationPlayer.tsx` đục lỗ tương ứng 30%, 50%, 70% số từ.

- [ ] **Step 1: Viết test cho `ClozeDensitySelector.test.tsx`**
Kiểm tra render 3 buttons `30%`, `50%`, `70%` và callback `onChangeDensity`.
- [ ] **Step 2: Tạo `ClozeDensitySelector.tsx`**
Pills component đẹp mắt với viền sáng indigo/emerald khi active.
- [ ] **Step 3: Cập nhật `types/index.ts` và `storage.ts`**
Thêm kiểu `export type ClozeDensity = 30 | 50 | 70;`, lưu và nạp từ LocalStorage.
- [ ] **Step 4: Cập nhật thuật toán đục lỗ trong `DictationPlayer.tsx`**
Hỗ trợ density 30, 50, 70 cho cả Medium và Hard.
- [ ] **Step 5: Chạy test Vitest**
`npm run test` -> Xác nhận PASS.
- [ ] **Step 6: Commit**
`git commit -am "feat(frontend): add ClozeDensitySelector and dynamic density algorithm"`

---

### Task 6: Frontend Medium Mode Stop-at-sentence Logic

**Files:**
- Modify: `frontend/src/hooks/useAudioSegmentPlayer.ts`
- Modify: `frontend/src/components/DictationPlayer.tsx`
- Test: `frontend/src/components/__tests__/AudioPlayerBar.test.tsx`

**Interfaces:**
- Produces: Khi ở chế độ Medium, audio phát hết câu sẽ gọi `pause()` (không lặp và không trôi sang câu khác), chờ người học điền xong câu và bấm chuyển câu.

- [ ] **Step 1: Cập nhật `useAudioSegmentPlayer.ts`**
Đảm bảo khi `currentTime >= endTime`, nếu không bật `autoLoop`, audio lập tức dừng và `setIsPlaying(false)`.
- [ ] **Step 2: Chạy test Vitest**
`npm run test` -> Xác nhận PASS.
- [ ] **Step 3: Commit**
`git commit -am "feat(frontend): ensure strict sentence pause in medium mode"`

---

### Task 7: Frontend Full Passage Dictation & Multiple-Choice Questions (Hard Mode)

**Files:**
- Create: `frontend/src/components/FullPassageDictation.tsx`
- Modify: `frontend/src/components/DictationPlayer.tsx`
- Test: `frontend/src/components/__tests__/FullPassageDictation.test.tsx`

**Interfaces:**
- Produces: Giao diện Hard Mode hiển thị trọn vẹn toàn bộ script bài nghe trên 1 trang duy nhất, đục lỗ từ vựng, phát audio toàn bài, và 3 thẻ câu hỏi trắc nghiệm TOEIC A/B/C/D với validation bắt buộc.

- [ ] **Step 1: Viết test cho `FullPassageDictation.test.tsx`**
Kiểm tra render toàn bộ câu, các ô input, render 3 câu hỏi trắc nghiệm, và chặn nộp bài khi chưa chọn đủ 3 câu.
- [ ] **Step 2: Xây dựng `FullPassageDictation.tsx`**
Bao gồm:
1. Audio Player toàn bài (0s - `totalDuration`).
2. Passage Container hiển thị tất cả các câu nối tiếp nhau với ô đục lỗ trống.
3. Card 3 câu hỏi trắc nghiệm: Radio cards A, B, C, D với hiệu ứng hover và active.
4. Nút nộp bài kèm badge trạng thái câu hỏi (ví dụ: "Đã trả lời 3/3 câu").
- [ ] **Step 3: Tích hợp vào `DictationPlayer.tsx`**
Khi `mode === 'HARD'`, render `FullPassageDictation`.
- [ ] **Step 4: Chạy test Vitest**
`npm run test` -> Xác nhận PASS.
- [ ] **Step 5: Commit**
`git commit -am "feat(frontend): create FullPassageDictation component for hard mode"`

---

### Task 8: Frontend ResultModal 2-Column Score Breakdown

**Files:**
- Modify: `frontend/src/components/ResultModal.tsx`
- Test: `frontend/src/components/__tests__/ResultModal.test.tsx`

**Interfaces:**
- Produces: Modal kết quả hiển thị 2 khối điểm:
  1. Dictation Accuracy (% và số từ đúng).
  2. TOEIC Questions (Số câu đúng Y/3, chi tiết đáp án chọn vs đáp án đúng).

- [ ] **Step 1: Cập nhật test case trong `ResultModal.test.tsx`**
Thêm test case render kết quả câu hỏi trắc nghiệm.
- [ ] **Step 2: Cập nhật `ResultModal.tsx`**
Render thêm phần TOEIC Questions Score card và chi tiết từng câu.
- [ ] **Step 3: Chạy test Vitest**
`npm run test` -> Xác nhận PASS.
- [ ] **Step 4: Commit**
`git commit -am "feat(frontend): display dual score breakdown in ResultModal"`

---

### Task 9: Frontend Admin CMS Upload UI with Questions & Quick-Paste Regex

**Files:**
- Modify: `frontend/src/components/AdminCmsModal.tsx`
- Test: `frontend/src/components/__tests__/AdminCmsModal.test.tsx`

**Interfaces:**
- Produces: Giao diện upload Admin CMS có tab Form 3 câu hỏi và tab Dán nhanh văn bản kèm nút "⚡ Bóc tách câu hỏi tự động".

- [ ] **Step 1: Viết test cho Admin CMS Questions Form & Quick-Paste parser**
- [ ] **Step 2: Cập nhật `AdminCmsModal.tsx`**
1. Thêm state `questions: CreateQuestionRequest[]` (mặc định 3 câu).
2. Thêm UI form 3 câu hỏi và tab textarea Quick-Paste.
3. Thêm hàm parser regex trích xuất số câu, câu hỏi, 4 đáp án A/B/C/D và Correct Option.
4. Gửi `questionsJson` trong `FormData` khi gọi `api.admin.uploadItem()`.
- [ ] **Step 3: Chạy test Vitest**
`npm run test` -> Xác nhận PASS.
- [ ] **Step 4: Commit**
`git commit -am "feat(frontend): enhance AdminCmsModal with question form and quick-paste regex"`

---

### Task 10: Full Regression Testing & System Documentation

**Files:**
- Modify: `PROJECT_STATE.md`

- [ ] **Step 1: Chạy toàn bộ Backend Tests & JaCoCo Coverage**
`cd backend && .\mvnw.cmd test`
Xác nhận: 41+ tests PASS, Line Coverage > 90%.
- [ ] **Step 2: Chạy toàn bộ Frontend Unit Tests**
`cd frontend && npm run test`
Xác nhận: 30+ tests PASS.
- [ ] **Step 3: Chạy Playwright E2E Tests**
`npm run test:e2e`
Xác nhận: 3/3 tests PASS.
- [ ] **Step 4: Biên dịch Production Build**
`npm run build`
Xác nhận: 0 lỗi build.
- [ ] **Step 5: Cập nhật `PROJECT_STATE.md`**
Ghi nhận toàn bộ tính năng mới vào tài liệu trạng thái dự án.
- [ ] **Step 6: Commit**
`git commit -am "docs: update PROJECT_STATE.md with new practice modes and questions architecture"`
