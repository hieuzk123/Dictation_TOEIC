# TOEIC Dictation Platform (Part 3 & 4)

Hệ thống website hỗ trợ học viên luyện nghe chép chính tả tiếng Anh chuyên sâu cho **TOEIC Listening Part 3 (Hội thoại ngắn)** và **Part 4 (Bài nói ngắn)**.

---

## 📌 Tổng quan công nghệ
* **Data Pipeline**: Python (`faster-whisper`, `edge-tts`, `stable-ts`) trích xuất mốc thời gian (timestamps) cấp câu & từ, phân loại từ khóa (keywords) tự động.
* **Database**: MySQL 8.x (Quản lý đề thi, bài nghe, câu hỏi, tokens và lịch sử làm bài).
* **Backend**: Java 17+, Spring Boot 3 (Spring Security, Spring Data JPA, JWT Authentication).
* **Frontend**: React 18+ (TypeScript, Vite, Tailwind CSS, Lucide Icons, HTML5 Audio API).

---

## 📖 Trạng thái dự án & Hướng dẫn phát triển
👉 Xem chi tiết báo cáo tiến độ, cấu trúc cơ sở dữ liệu, và hướng dẫn thiết lập khi chuyển máy tại:  
**[PROJECT_STATE.md](PROJECT_STATE.md)**

---

## 🚀 Khởi động nhanh (Quick Start)

### 1. Khởi động MySQL Server
```cmd
start_mysql.bat
```
Hoặc đảm bảo MySQL Server đang chạy trên cổng `3306` với cơ sở dữ liệu `toeic_dictation`.

### 2. Dữ liệu mẫu (Database)
* Schema DDL: `database/schema.sql`
* Seed Data: `database/seed_data.sql`

```bash
mysql -u root toeic_dictation < database/schema.sql
mysql -u root toeic_dictation < database/seed_data.sql
```

### 3. Data Pipeline
```bash
cd data_pipeline
pip install faster-whisper edge-tts
python align_pipeline.py
python export_seed_sql.py
```