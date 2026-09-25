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

## 2. Những công việc đã hoàn thành (Phase 1)

### A. Thiết lập môi trường & Công cụ hệ thống
1. **Node.js LTS (v24.19.0)**: Đã cài đặt và nạp vào `%PATH%` (hỗ trợ npx/npm cho các công cụ Frontend và MCP).
2. **Java Development Kit (JDK 17)**: Đã cài đặt **Eclipse Adoptium Temurin JDK 17** (`JAVA_HOME` và `%PATH%` đã sẵn sàng).
3. **MySQL Server 8.4**:
   * Đã cài đặt và khởi tạo vùng dữ liệu tại thư mục `C:\Users\Hieu\mysql_data` (User: `root`, Password: rỗng).
   * Cổng mặc định: `3306`.
   * Tạo sẵn script tiện ích bật nhanh MySQL: `start_mysql.bat`.
   * Đã tạo cơ sở dữ liệu `toeic_dictation`.

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

## 3. Cấu trúc thư mục dự án hiện tại

```text
Dictation_TOEIC/
├── .gitignore                      # Cấu hình bỏ qua file tạm, cache, venv
├── PROJECT_STATE.md                # Báo cáo trạng thái dự án hiện tại
├── toeic_dictation_prompt.md       # Master Prompt nghiệp vụ & kiến trúc ban đầu
├── start_mysql.bat                 # Script chạy nhanh MySQL Server cục bộ
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

## 4. Hướng dẫn thiết lập khi kéo code về máy khác

Khi bạn chuyển sang máy tính khác (laptop, máy cơ quan, v.v.):

### Bước 1: Clone Repository
```bash
git clone https://github.com/hieuzk123/Dictation_TOEIC.git
cd Dictation_TOEIC
```

### Bước 2: Chuẩn bị môi trường phần mềm
* **Git** & **Node.js** (>= 18)
* **JDK 17** hoặc mới hơn
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

## 5. Kế hoạch & Các nhiệm vụ tiếp theo (Next Tasks)

### 📌 Giai đoạn 2: Phát triển Backend (Spring Boot 3)
Thư mục dự kiến: `backend/`
- [ ] Khởi tạo dự án Spring Boot 3 bằng Maven Wrapper (`mvnw`).
  - Dependencies: `Spring Web`, `Spring Data JPA`, `Spring Security`, `MySQL Driver`, `jjwt` (0.12.x), `Lombok`, `Validation`.
- [ ] Cấu hình `application.yml` kết nối MySQL `toeic_dictation` và JPA Hibernate.
- [ ] Tạo Domain Models & Repositories:
  - `User`, `ToeicTest`, `AudioItem`, `AudioSegment`, `StudyHistory`.
- [ ] Xây dựng Module Authentication & JWT:
  - API `POST /api/auth/register` (mã hóa mật khẩu BCrypt).
  - API `POST /api/auth/login` (trả về Bearer JWT Token).
  - Security Config & JWT Authentication Filter.
- [ ] Xây dựng RESTful API dữ liệu bài học:
  - `GET /api/tests`: Danh sách đề thi (ETS 2024, 2023...).
  - `GET /api/items/{id}`: Chi tiết bài nghe kèm danh sách các segments và token metadata.
  - Phục vụ tĩnh file audio qua Resource Handler `/audio/**`.
- [ ] Xây dựng API nộp bài & Lịch sử học tập:
  - `POST /api/study/submit`: Nhận kết quả người dùng nhập, kiểm tra thuật toán so khớp, lưu accuracy_rate, replays_count vào `study_histories`.
  - `GET /api/study/history`: Xem lịch sử và tiến độ học viên.

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
