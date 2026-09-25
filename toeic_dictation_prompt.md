# Master Prompt: Xây dựng Website Luyện Nghe Chép Chính Tả TOEIC Part 3 & 4

---

## Prompt nạp cho AI Agent (Cursor / Devin / Claude / ChatGPT / Antigravity)

```text
Bạn là một Senior Fullstack Engineer và Solutions Architect. Hãy hỗ trợ tôi thiết kế, khởi tạo cấu trúc dự án và lập trình hệ thống website "Luyện nghe chép chính tả TOEIC Part 3 & 4".

---

### 1. Công nghệ sử dụng
- Backend: Java 17+, Spring Boot 3 (Spring Security, Spring Data JPA, JWT Authentication, RESTful API).
- Frontend: React 18+ (TypeScript, Vite, Tailwind CSS, Lucide Icons, HTML5 Audio API / Howler.js).
- Database: MySQL 8.x.
- Data Pipeline / Tool phụ trợ: Script Python sử dụng `faster-whisper` để tự động chia đoạn (segmentation) và gắn nhãn mốc thời gian (timestamps) cấp câu/từ từ file audio và text transcript đề ETS.

---

### 2. Kiến trúc & Logic cốt lõi

#### A. Quản lý phân cấp bài nghe
- Cấu trúc: Year (ETS 2024, ETS 2023, ...) -> Test (Test 1 đến Test 10) -> Part (Part 3 / Part 4) -> Item (Bài đối thoại / Bài nói).
- Mỗi Item gồm:
  - File audio MP3 gốc.
  - Danh sách các Sentence/Segment kèm `start_time`, `end_time` (giây), `full_transcript`, và danh sách từ/token.

#### B. Cơ chế làm bài (Cloze Test & Full Dictation)
Hệ thống phát âm thanh của cả câu, giao diện hiển thị các ô nhập liệu tùy theo chế độ người dùng chọn:
- Chế độ "Trung bình": Hệ thống chỉ đục lỗ (blank) các từ khóa/từ quan trọng (khoảng 30-40% số từ), các từ còn lại hiển thị sẵn làm gợi ý.
- Chế độ "Khó": Hệ thống đục lỗ 70-80% số từ hoặc chỉ hiển thị chữ cái đầu của từ.
- Chế độ "Cả câu": Người dùng phải tự nghe và gõ toàn bộ câu từ đầu đến cuối mà không có bất kỳ từ gợi ý nào.
- Thao tác hỗ trợ:
  - Nút/phím tắt: Nghe lại câu hiện tại, lùi về câu trước, tiến tới câu sau.
  - Nút "Hiện đáp án" khi người dùng bỏ cuộc hoặc không nghe ra.
  - Phím tắt (Hotkeys): Space (Play/Replay câu hiện tại), Enter (Kiểm tra câu), Ctrl+Right/Left (Next/Prev câu).

#### C. Chấm điểm & Lịch sử học tập
- Thuật toán so sánh: Chuỗi người dùng nhập so với đáp án (không phân biệt hoa-thường, bỏ qua dấu câu `.,?!`).
- Công thức tính điểm:
  Accuracy (%) = (Số từ gõ đúng / Tổng số từ cần điền) * 100
- Lưu lịch sử làm bài vào database: `user_id`, `item_id`, `mode`, `accuracy_rate`, `replays_count`, `completed_at`.

#### D. Xác thực người dùng
- Đăng ký tài khoản mở (Username, Email, Password mã hóa BCrypt). Đăng ký xong dùng được ngay, không cần duyệt thủ công.
- Đăng nhập trả về JWT Bearer Token để xác thực các request kế tiếp.

---

### 3. Yêu cầu đầu ra chi tiết
1. Database Schema: Script SQL DDL hoàn chỉnh tạo các bảng (`users`, `toeic_tests`, `audio_items`, `audio_segments`, `study_histories`).
2. Backend (Spring Boot 3):
   - Cấu trúc thư mục chuẩn Domain/Layered Architecture (Controller, Service, Repository, DTO).
   - API Authentication (Register, Login).
   - API lấy danh mục đề và chi tiết câu hỏi kèm segments.
   - API nộp bài và lưu lịch sử làm bài (`accuracy_rate`).
3. Frontend (React + TypeScript + Tailwind):
   - Component cốt lõi `DictationPlayer.tsx`:
     + Điều khiển audio theo khoảng `[start_time, end_time]`.
     + Logic sinh chỗ trống (Cloze test) theo 3 cấp độ (Trung bình, Khó, Cả câu).
     + Hỗ trợ phím tắt và highlight kết quả đúng (xanh)/sai (đỏ).
4. Python Data Script:
   - Script mẫu dùng `faster-whisper` nhận file `audio.mp3` và transcript để xuất ra JSON chứa các segments chuẩn format cho database.
```