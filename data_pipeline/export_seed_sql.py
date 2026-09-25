import json
import glob
import os

def escape_sql(text: str) -> str:
    if text is None:
        return "NULL"
    return "'" + text.replace("\\", "\\\\").replace("'", "''") + "'"

def main():
    base_dir = os.path.dirname(__file__)
    output_json_dir = os.path.join(base_dir, "output")
    sql_file_path = os.path.join(base_dir, "..", "database", "seed_data.sql")
    
    json_files = glob.glob(os.path.join(output_json_dir, "*.json"))
    if not json_files:
        print("No JSON files found in output directory.")
        return

    sql_statements = [
        "-- ========================================================",
        "-- SEED DATA: TOEIC DICTATION SYSTEM (PART 3 & 4)",
        "-- Auto-generated from Python Data Pipeline",
        "-- ========================================================",
        "USE `toeic_dictation`;",
        "",
        "-- Default Demo User (password: password123, BCrypt hashed)",
        "INSERT INTO `users` (`username`, `email`, `password`, `full_name`, `role`) VALUES",
        "('demo_user', 'demo@example.com', '$2a$10$7R9rWz8k3hGk5k0E5D7i4.k0m/1U5gXG7F8V2qN4Y7Q3W6Z8V2qN4', 'Demo Learner', 'ROLE_USER')",
        "ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`);",
        ""
    ]

    # Create tests map to avoid duplicate tests
    tests_map = {} # (year, test_number) -> test_id

    for file_path in json_files:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        year = data["year"]
        test_number = data["test_number"]
        test_key = (year, test_number)

        if test_key not in tests_map:
            test_title = f"{year} - Test {test_number}"
            sql_statements.append(f"-- Insert Test: {test_title}")
            sql_statements.append(
                f"INSERT INTO `toeic_tests` (`year`, `test_number`, `title`, `description`) "
                f"VALUES ({escape_sql(year)}, {test_number}, {escape_sql(test_title)}, {escape_sql('Official ETS Practice Test')}) "
                f"ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);"
            )
            tests_map[test_key] = True

    sql_statements.append("")
    sql_statements.append("-- Clear existing items and segments for idempotent re-runs")
    sql_statements.append("DELETE FROM `audio_segments`;")
    sql_statements.append("DELETE FROM `audio_items`;")

        part = data["part"]
        item_number = data["item_number"]
        title = data["title"]
        audio_filename = data["audio_filename"]
        audio_url = f"/audio/{audio_filename}"
        duration = data["audio_duration"]
        total_segments = data["total_segments"]

        sql_statements.append("")
        sql_statements.append(f"-- Insert Audio Item: {title} (Part {part} {item_number})")
        sql_statements.append(
            f"INSERT INTO `audio_items` (`test_id`, `part`, `item_number`, `title`, `audio_url`, `total_duration`, `total_segments`) "
            f"SELECT `id`, {part}, {escape_sql(item_number)}, {escape_sql(title)}, {escape_sql(audio_url)}, {duration}, {total_segments} "
            f"FROM `toeic_tests` WHERE `year`={escape_sql(year)} AND `test_number`={test_number};"
        )

        sql_statements.append("SET @item_id = LAST_INSERT_ID();")

        sql_statements.append(f"-- Insert Segments for Item: {title}")
        for seg in data["segments"]:
            seg_idx = seg["segment_index"]
            start_time = seg["start_time"]
            end_time = seg["end_time"]
            full_transcript = seg["full_transcript"]
            total_words = seg["total_words"]
            keyword_count = seg["keyword_count"]
            tokens_json_str = json.dumps(seg["tokens"], ensure_ascii=False)

            sql_statements.append(
                f"INSERT INTO `audio_segments` (`item_id`, `segment_index`, `start_time`, `end_time`, `full_transcript`, `total_words`, `keyword_count`, `tokens_json`) "
                f"VALUES (@item_id, {seg_idx}, {start_time}, {end_time}, {escape_sql(full_transcript)}, {total_words}, {keyword_count}, {escape_sql(tokens_json_str)});"
            )

    full_sql = "\n".join(sql_statements)
    with open(sql_file_path, "w", encoding="utf-8") as f:
        f.write(full_sql)

    print(f"Generated seed SQL file: {sql_file_path}")

if __name__ == "__main__":
    main()
