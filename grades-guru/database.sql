-- ============================================================
-- Grades Guru Client Portal — Complete MySQL Schema
-- Version 1.0 | Encoding UTF8MB4
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `grades_guru`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `grades_guru`;

-- ──────────────────────────────────────────────────────────────
-- Table: users
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`                  INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `name`                VARCHAR(255)     NOT NULL,
  `email`               VARCHAR(255)     NOT NULL UNIQUE,
  `phone`               VARCHAR(30)      DEFAULT NULL,
  `password`            VARCHAR(255)     NOT NULL,
  `role`                ENUM('admin','tl','client') NOT NULL DEFAULT 'client',
  `referral_code`       VARCHAR(20)      NOT NULL UNIQUE,
  `referred_by`         VARCHAR(20)      DEFAULT NULL,
  `referral_count`      INT              NOT NULL DEFAULT 0,
  `discount_percentage` DECIMAL(5,2)     NOT NULL DEFAULT 0.00,
  `spin_used`           TINYINT(1)       NOT NULL DEFAULT 0,
  `last_spin_date`      DATE             DEFAULT NULL,
  `status`              ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `avatar`              VARCHAR(500)     DEFAULT NULL,
  `created_at`          TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email`         (`email`),
  KEY `idx_referral_code` (`referral_code`),
  KEY `idx_referred_by`   (`referred_by`),
  KEY `idx_role`          (`role`),
  KEY `idx_status`        (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- Table: tasks
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tasks` (
  `id`                INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `serial_number`     VARCHAR(50)      NOT NULL UNIQUE,
  `client_id`         INT UNSIGNED     NOT NULL,
  `client_name`       VARCHAR(255)     NOT NULL,
  `task_name`         VARCHAR(500)     NOT NULL,
  `task_type`         ENUM('technical','simple') NOT NULL DEFAULT 'simple',
  `subject`           VARCHAR(255)     DEFAULT NULL,
  `description`       TEXT             DEFAULT NULL,
  `deadline`          DATE             NOT NULL,
  `assigned_date`     DATE             DEFAULT NULL,
  `writer_name`       VARCHAR(255)     DEFAULT NULL,
  `tl_id`             INT UNSIGNED     DEFAULT NULL,
  `word_count`        INT              NOT NULL DEFAULT 0,
  `client_pay`        DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  `writer_pay`        DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  `tl_pay`            DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  `profit`            DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  `discount_applied`  DECIMAL(5,2)     NOT NULL DEFAULT 0.00,
  `final_client_pay`  DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  `payment_status`    ENUM('due','partial','paid') NOT NULL DEFAULT 'due',
  `amount_received`   DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  `status`            ENUM('pending','in_progress','completed','delivered') NOT NULL DEFAULT 'pending',
  `notes`             TEXT             DEFAULT NULL,
  `file_path`         VARCHAR(500)     DEFAULT NULL,
  `sheets_synced`     TINYINT(1)       NOT NULL DEFAULT 0,
  `created_at`        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_serial_number`  (`serial_number`),
  KEY `idx_client_id`            (`client_id`),
  KEY `idx_tl_id`                (`tl_id`),
  KEY `idx_status`               (`status`),
  KEY `idx_payment_status`       (`payment_status`),
  KEY `idx_deadline`             (`deadline`),
  KEY `idx_assigned_date`        (`assigned_date`),
  CONSTRAINT `fk_tasks_client` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_tasks_tl`     FOREIGN KEY (`tl_id`)     REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- Table: referrals
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `referrals` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `referrer_id`    INT UNSIGNED NOT NULL,
  `referred_id`    INT UNSIGNED NOT NULL,
  `referral_code`  VARCHAR(20)  NOT NULL,
  `status`         ENUM('pending','confirmed') NOT NULL DEFAULT 'pending',
  `discount_given` TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_referrer_id`   (`referrer_id`),
  KEY `idx_referred_id`   (`referred_id`),
  KEY `idx_referral_code` (`referral_code`),
  KEY `idx_status`        (`status`),
  CONSTRAINT `fk_referrals_referrer` FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_referrals_referred` FOREIGN KEY (`referred_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- Table: spin_results
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `spin_results` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`        INT UNSIGNED NOT NULL,
  `spin_type`      ENUM('signup','monthly') NOT NULL DEFAULT 'signup',
  `result`         VARCHAR(255) NOT NULL,
  `discount_value` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `used`           TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id`   (`user_id`),
  KEY `idx_spin_type` (`spin_type`),
  KEY `idx_used`      (`used`),
  CONSTRAINT `fk_spin_results_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- Table: payments
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `payments` (
  `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `task_id`        INT UNSIGNED  NOT NULL,
  `client_id`      INT UNSIGNED  NOT NULL,
  `amount`         DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(100)  NOT NULL DEFAULT 'cash',
  `payment_date`   DATE          NOT NULL,
  `notes`          TEXT          DEFAULT NULL,
  `recorded_by`    INT UNSIGNED  NOT NULL,
  `created_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_id`     (`task_id`),
  KEY `idx_client_id`   (`client_id`),
  KEY `idx_payment_date`(`payment_date`),
  CONSTRAINT `fk_payments_task`     FOREIGN KEY (`task_id`)     REFERENCES `tasks`(`id`)  ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_client`   FOREIGN KEY (`client_id`)   REFERENCES `users`(`id`)  ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_recorder` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`)  ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- Table: settings
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `settings` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key`   VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT         NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- Table: notifications
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `message`    TEXT         NOT NULL,
  `type`       ENUM('info','success','warning') NOT NULL DEFAULT 'info',
  `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════
-- DEFAULT DATA
-- ══════════════════════════════════════════════════════════════

-- ── Default Settings ─────────────────────────────────────────
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
  ('tl_monthly_salary',      '65000'),
  ('working_days_per_month', '26'),
  ('technical_rate',         '3.00'),
  ('simple_rate',            '1.50'),
  ('spin_enabled',           '1'),
  ('referral_bonus_1',       '10'),
  ('referral_bonus_2',       '25'),
  ('monthly_spin_enabled',   '1'),
  ('site_name',              'Grades Guru'),
  ('maintenance_mode',       '0')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- ── Default Admin User ───────────────────────────────────────
-- Password: Admin@123  (bcrypt cost 12)
-- Hash generated via: password_hash('Admin@123', PASSWORD_BCRYPT, ['cost' => 12])
INSERT INTO `users`
  (`name`, `email`, `phone`, `password`, `role`, `referral_code`, `status`)
VALUES (
  'Administrator',
  'admin@gradesguru.com',
  '+923001234567',
  '$2y$12$LT5HmMrkDbkFNVx5D2e9/O9fB9f3rRqIVfVoJRJ2bVGf1fz0e3MiW',
  'admin',
  'GG-ADMIN-0001',
  'active'
)
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;
