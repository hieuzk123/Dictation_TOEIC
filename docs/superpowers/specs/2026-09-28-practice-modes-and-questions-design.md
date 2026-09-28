# SPEC: Practice Modes Restructuring, Full Passage Dictation, Multiple-Choice Questions & Admin CMS

> **Feature Specification**: Đổi mới phương thức luyện tập TOEIC Dictation, hỗ trợ Đục lỗ Toàn bài (Full Passage), tích hợp 3 Câu hỏi Trắc nghiệm chuẩn ETS, Bộ điều chỉnh Tỉ lệ Đục lỗ (30%, 50%, 70%) và nâng cấp Admin CMS Upload.  
> **Date**: 2026-09-28  
> **Status**: Approved by User  

---

## 1. Overview & Business Objectives
Hệ thống TOEIC Dictation được nâng cấp từ hình thức luyện nghe chép câu đơn lẻ thành trải nghiệm luyện thi TOEIC Listening Part 3 & 4 toàn diện:
1. **Chế độ Trung bình (Medium)**: Luyện nghe chép từng câu (`sentence-by-sentence`), phát xong 1 câu thì audio tự động dừng (pause) chờ học viên điền xong và kiểm tra rồi mới chuyển sang câu tiếp theo.
2. **Chế độ Nâng cao (Hard)**:
   - Hiển thị toàn bộ script của bài nghe trên 1 trang duy nhất (`Full Passage`), đục lỗ trực tiếp các từ trong bài.
   - Trình phát audio toàn bài (0s đến tổng thời lượng), học viên có thể tua/replay linh hoạt.
   - Hiển thị 3 câu hỏi trắc nghiệm TOEIC (A, B, C, D) bên dưới bài đọc.
   - Bắt buộc học viên phải chọn đáp án cho cả 3 câu trắc nghiệm trước khi bấm nộp bài.
3. **Bộ điều chỉnh Tỉ lệ Đục lỗ (Cloze Density: 30%, 50%, 70%)**:
   - Cho phép học viên tùy chọn mức độ đục lỗ: `30%` (Dễ), `50%` (Tiêu chuẩn), `70%` (Thử thách) áp dụng cho cả 2 chế độ.
   - Ô nhập để trống hoàn toàn (`placeholder=""`), không lộ chữ cái đầu gợi ý.
4. **Chấm điểm & Báo cáo kết quả (Result Modal)**:
   - Xuất 2 điểm số độc lập: **Điểm Dictation %** và **Điểm Trắc nghiệm Y/3 câu**.
   - Lưu trữ cả 2 phần vào MySQL `study_histories`.
5. **Nâng cấp Admin CMS Upload**:
   - Thêm phần nhập 3 câu hỏi trắc nghiệm khi tạo/upload bài nghe mới: hỗ trợ cả Form trực quan 3 câu lẫn Hộp dán nhanh văn bản (Quick-Paste Text) với nút "⚡ Bóc tách câu hỏi tự động".

---

## 2. Architecture & Data Flow

### 2.1 Database Schema Additions
Tạo bảng mới `toeic_questions` trong MySQL:
```sql
CREATE TABLE `toeic_questions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `item_id` BIGINT NOT NULL,
  `question_number` INT NOT NULL COMMENT 'Số câu, ví dụ 71, 72, 73 hoặc 32, 33, 34',
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

### 2.2 Backend Domain & DTOs
1. **Entity `ToeicQuestion.java`**:
   - Quan hệ `@ManyToOne(fetch = FetchType.LAZY)` với `AudioItem`.
2. **Entity `AudioItem.java`**:
   - Quan hệ `@OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)` với `ToeicQuestion`.
3. **DTOs**:
   - `ToeicQuestionDto`: `id`, `questionNumber`, `questionText`, `optionA`, `optionB`, `optionC`, `optionD`, `correctOption` (chỉ trả về khi đã submit hoặc trong admin), `explanation`.
   - `CreateQuestionRequest`: DTO cho việc tạo câu hỏi trong Admin CMS.
   - `AudioItemDetailDto`: bổ sung `List<ToeicQuestionDto> questions`.
   - `SubmitStudyRequest`: bổ sung `Map<Long, String> questionAnswers` (questionId -> userOption "A"/"B"/"C"/"D").
   - `SubmitStudyResponse`: bổ sung `int totalQuestions`, `int correctQuestions`, `List<QuestionResultDto> questionResults`.

---

## 3. Frontend Component Design

### 3.1 `ClozeDensitySelector.tsx`
- Bộ nút bấm 3 mức: `[ 30% ]`, `[ 50% ]`, `[ 70% ]` phong cách glassmorphic, đặt cạnh `ModeSelector`.
- State `clozeDensity: 30 | 50 | 70` (mặc định 50%), lưu vào LocalStorage qua `storage.ts`.

### 3.2 Thuật toán đục lỗ (`isTokenBlank`)
Hàm nhận `(token: TokenItem, wordIndex: number, totalWords: number, density: 30 | 50 | 70)`:
- `density === 30`: Đục lỗ khoảng 30% số từ (ưu tiên từ khóa có độ dài lớn nhất hoặc từ khóa ở vị trí chẵn).
- `density === 50`: Đục lỗ toàn bộ từ khóa chính (`is_keyword === true`).
- `density === 70`: Đục lỗ toàn bộ từ khóa + các từ stopwords xen kẽ để đạt ~70%.

### 3.3 Chế độ Trung bình (`DictationPlayer.tsx`)
- Từng câu một: Khi audio phát đến `endTime` của câu hiện tại, hook `useAudioSegmentPlayer` kích hoạt tạm dừng `pause()`.
- Người học hoàn thành câu, kiểm tra rồi ấn Chuyển câu / Enter để sang câu kế tiếp.

### 3.4 Chế độ Nâng cao (`FullPassageDictation.tsx` / Hard Workspace)
- Hiển thị trọn vẹn transcript của tất cả các segments liên tục trên một vùng đọc bài (Passage Container).
- Các từ đục lỗ hiển thị dạng ô input trống (`placeholder=""`), tự co giãn theo độ dài từ.
- Trình phát Audio: Thanh điều khiển audio toàn bài (0s đến `item.totalDuration`), không kẹp trong từng câu.
- Khối Câu hỏi Trắc nghiệm (Multiple Choice Questions Card):
  - Hiển thị 3 câu hỏi TOEIC.
  - 4 lựa chọn A, B, C, D dạng thẻ chọn (Radio Card) có hiệu ứng hover và active viền sáng.
  - Validation: Phải trả lời đủ 3 câu mới kích hoạt nút Nộp bài. Nếu chưa chọn đủ, hiển thị tooltip hướng dẫn *"Vui lòng trả lời đủ 3 câu trắc nghiệm"*.

### 3.5 Bảng Kết quả (`ResultModal.tsx`)
- Hiển thị 2 khối điểm:
  1. **Điểm Nghe Chép (Dictation)**: % độ chính xác, số từ đúng / tổng số từ.
  2. **Điểm Trắc Nghiệm (TOEIC Questions)**: Điểm số X/3 câu, chi tiết từng câu: câu hỏi, đáp án đã chọn (xanh nếu đúng, đỏ nếu sai), đáp án đúng của đề.
- Nút "Xem lịch sử bài làm" (kết nối trực tiếp với `HistoryDrawer`).

### 3.6 Admin CMS Upload (`AdminCmsModal.tsx`)
- Thêm trường nhập 3 câu hỏi trắc nghiệm:
  - Form 3 Card câu hỏi trực quan: Câu hỏi, 4 đáp án A/B/C/D, radio chọn đáp án đúng.
  - Nút chuyển sang tab *"Dán văn bản thô (Quick-Paste)"*: Hộp textarea cho phép dán đề thi ETS, kèm parser regex tự động bóc tách và điền ngược lại vào form.

---

## 4. Testing & Verification Plan
1. **Database & Seed**:
   - Cập nhật `database/schema.sql` với bảng `toeic_questions`.
   - Cập nhật `database/seed_data.sql` nạp 3 câu hỏi chuẩn ETS cho bài 1 (Q32-34) và bài 2 (Q71-73).
2. **Backend**:
   - Viết unit & integration tests trong `StudyControllerTests` và `AdminControllerTests` xác thực nộp bài có chấm điểm trắc nghiệm và upload có kèm câu hỏi.
   - Đảm bảo 41+ backend tests PASS, JaCoCo > 90%.
3. **Frontend**:
   - Viết unit tests cho `ClozeDensitySelector`, `FullPassageDictation`, `ResultModal` (2 cột điểm) trong Vitest suite.
   - Đảm bảo 28+ unit tests PASS và E2E tests Playwright PASS.
