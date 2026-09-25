# TRẠNG THÁI DỰ ÁN: TOEIC DICTATION (PART 3 & 4)
> **Tài liệu bàn giao & Hướng dẫn phát triển đa môi trường**  
> *Repository*: [hieuzk123/Dictation_TOEIC](https://github.com/hieuzk123/Dictation_TOEIC)  
> *Cập nhật lần cuối*: 2026-09-25

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
├── .gitignore                      # Cấu hình bỏ qua file tạm, cache, venv
├── PROJECT_STATE.md                # Báo cáo trạng thái dự án hiện tại & Quy trình kiểm toán
├── toeic_dictation_prompt.md       # Master Prompt nghiệp vụ & kiến trúc ban đầu
├── start_mysql.bat                 # Script chạy nhanh MySQL Server cục bộ (đa môi trường)
│
├── database/                       # Cấu trúc và dữ liệu Database
│   ├── schema.sql                  # DDL tạo 5 bảng cơ sở dữ liệu
│   └── seed_data.sql               # Dữ liệu mẫu (tests, items, segments, demo user)
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

## 5. Hướng dẫn thiết lập khi kéo code về máy khác

Khi bạn chuyển sang máy tính khác (laptop, máy cơ quan, v.v.):

### Bước 1: Clone Repository
```bash
git clone https://github.com/hieuzk123/Dictation_TOEIC.git
cd Dictation_TOEIC
```

### Bước 2: Chuẩn bị môi trường phần mềm
* **Git** & **Node.js** (>= 18)
* **JDK 17/21** (Java LTS)
* **MySQL 8.x** (chạy dịch vụ MySQL trên cổng 3306)
* **Python 3.10+** (nếu muốn chạy tiếp Data Pipeline cho các đề mới)

### Bước 3: Nạp Database vào MySQL
Mở terminal hoặc MySQL Workbench, kết nối vào MySQL cục bộ và chạy:
```bash
# 1. Tạo schema
mysql -u root -p < database/schema.sql

# 2. Nạp dữ liệu mẫu
mysql -u root -p toeic_dictation < database/seed_data.sql
```
*(Nếu dùng Windows và user `root` không có mật khẩu, bỏ tham số `-p`).*

### Bước 4: Chạy Data Pipeline (Nếu cần nạp thêm đề mới)
```bash
cd data_pipeline
pip install faster-whisper edge-tts
python align_pipeline.py
python export_seed_sql.py
```

---

## 6. Kế hoạch & Các nhiệm vụ tiếp theo (Next Tasks)

### 📌 Giai đoạn 2: Phát triển Backend (Spring Boot 3)
Thư mục dự kiến: `backend/`
- [x] Task 1: Khởi tạo dự án Spring Boot 3 bằng Maven Wrapper (`mvnw`), các dependencies Web, JPA, Security, JJWT 0.12.6, cấu hình `application.yml` kết nối MySQL `toeic_dictation`.
- [x] Task 2: Xây dựng Domain Models & Repositories (`User`, `ToeicTest`, `AudioItem`, `AudioSegment`, `StudyHistory`).
- [x] Task 3: Xây dựng Module Authentication & JWT (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, Security Config & Filter).
- [x] Task 4: Xây dựng RESTful API dữ liệu bài học (`GET /api/tests`, `GET /api/items/{id}`) và Static Audio Resource Handler (`/audio/**`).
- [x] Task 5: Xây dựng Thuật toán chấm điểm Dictation, API nộp bài (`POST /api/study/submit`) và Lịch sử học tập (`GET /api/study/history`).
- [ ] Task 6: Kiểm thử E2E Toàn diện Backend & Bàn giao Tài liệu API.

### 📌 Giai đoạn 3: Phát triển Frontend (React 18 + Vite + Tailwind)
Thư mục dự kiến: `frontend/`
- [ ] Khởi tạo ứng dụng React TypeScript với Vite & Tailwind CSS.
- [ ] Thiết kế Design System hiện đại (Modern EdTech UI): tông màu Slate/Indigo/Emerald cao cấp, thanh điều khiển audio bóng bẩy (glassmorphism), typography rõ nét.
- [ ] Phát triển Audio Controller:
  - Phát 1 file audio duy nhất của cả Item.
  - Xử lý mượt mà sự kiện seek đến `[start_time, end_time]` của câu hiện tại mà không phải tải nhiều file audio rời rạc.
- [ ] Phát triển Component cốt lõi `DictationPlayer.tsx`:
  - 3 chế độ đục lỗ:
    - **Trung bình**: Đục lỗ 30-40% số từ (ưu tiên từ có cờ `is_keyword == true`).
    - **Khó**: Đục lỗ 70-80% số từ hoặc chỉ hiển thị ký tự đầu tiên.
    - **Cả câu**: Ẩn hoàn toàn câu, người dùng tự nghe và gõ toàn bộ.
  - Hệ thống phím tắt (Hotkeys):
    - `Space`: Phát / Nghe lại câu hiện tại.
    - `Enter`: Nộp và kiểm tra câu trả lời.
    - `Ctrl + Right / Left`: Chuyển nhanh câu tiếp theo / câu trước đó.
  - Nút "Hiện đáp án" khi học viên cần trợ giúp.
  - Hiển thị trực quan kết quả so khớp: màu xanh lá (từ đúng) và đỏ (từ sai).
- [ ] Màn hình chọn đề thi, chọn Part 3 / Part 4 và bảng tổng kết điểm số / xem lại câu sai.

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






