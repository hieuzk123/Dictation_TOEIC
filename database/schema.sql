-- ========================================================
-- DATABASE SCHEMA: TOEIC DICTATION SYSTEM (PART 3 & 4)
-- Engine: MySQL 8.x
-- ========================================================

CREATE DATABASE IF NOT EXISTS `toeic_dictation`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `toeic_dictation`;

-- Drop tables if exists (in reverse dependency order)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `study_histories`;
DROP TABLE IF EXISTS `audio_segments`;
DROP TABLE IF EXISTS `audio_items`;
DROP TABLE IF EXISTS `toeic_tests`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Table: users
CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL COMMENT 'BCrypt hashed password',
  `full_name` VARCHAR(100) DEFAULT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: toeic_tests
CREATE TABLE `toeic_tests` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `year` VARCHAR(20) NOT NULL COMMENT 'e.g. ETS 2024, ETS 2023',
  `test_number` INT NOT NULL COMMENT '1 to 10',
  `title` VARCHAR(100) NOT NULL COMMENT 'e.g. ETS 2024 - Test 1',
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_year_test` (`year`, `test_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: audio_items
CREATE TABLE `audio_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `test_id` BIGINT NOT NULL,
  `part` INT NOT NULL COMMENT '3 for Part 3, 4 for Part 4',
  `item_number` VARCHAR(50) NOT NULL COMMENT 'e.g. Questions 32-34 or Questions 71-73',
  `title` VARCHAR(150) NOT NULL,
  `audio_url` VARCHAR(255) NOT NULL COMMENT 'Relative path or CDN URL',
  `total_duration` DECIMAL(6, 2) NOT NULL COMMENT 'Duration in seconds',
  `total_segments` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`test_id`) REFERENCES `toeic_tests` (`id`) ON DELETE CASCADE,
  INDEX `idx_items_part` (`part`),
  INDEX `idx_items_test` (`test_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: audio_segments
CREATE TABLE `audio_segments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `item_id` BIGINT NOT NULL,
  `segment_index` INT NOT NULL COMMENT '1-based index of sentence in the dialogue/talk',
  `speaker` VARCHAR(50) DEFAULT NULL COMMENT 'Woman, Man, Announcer, etc.',
  `start_time` DECIMAL(6, 2) NOT NULL COMMENT 'Start timestamp in seconds',
  `end_time` DECIMAL(6, 2) NOT NULL COMMENT 'End timestamp in seconds',
  `full_transcript` TEXT NOT NULL,
  `total_words` INT NOT NULL DEFAULT 0,
  `keyword_count` INT NOT NULL DEFAULT 0,
  `tokens_json` JSON NOT NULL COMMENT 'Array of tokens: raw, word, start_time, end_time, is_keyword',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`item_id`) REFERENCES `audio_items` (`id`) ON DELETE CASCADE,
  INDEX `idx_segments_item` (`item_id`, `segment_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: study_histories
CREATE TABLE `study_histories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `item_id` BIGINT NOT NULL,
  `mode` VARCHAR(30) NOT NULL COMMENT 'MEDIUM, HARD, FULL_SENTENCE',
  `accuracy_rate` DECIMAL(5, 2) NOT NULL COMMENT 'Percentage e.g. 85.50',
  `replays_count` INT NOT NULL DEFAULT 0,
  `wrong_segments_count` INT NOT NULL DEFAULT 0,
  `details_json` JSON DEFAULT NULL COMMENT 'Detailed stats per segment/word',
  `completed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `audio_items` (`id`) ON DELETE CASCADE,
  INDEX `idx_history_user` (`user_id`),
  INDEX `idx_history_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
