-- ============================================================================
--  Kairo — database schema (MySQL 8 / MariaDB 10.4+, as shipped by Hostinger)
--
--  Import this once via hPanel → Databases → phpMyAdmin → Import.
--  Safe to re-run: every statement is IF NOT EXISTS.
-- ============================================================================

SET NAMES utf8mb4;

-- ── Leads ───────────────────────────────────────────────────────────────────
-- Every contact form and automation-audit submission lands here. This table is
-- the source of truth; the email notification is only a convenience copy.
CREATE TABLE IF NOT EXISTS leads (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ref           VARCHAR(24)     NOT NULL,
  name          VARCHAR(120)    NOT NULL,
  email         VARCHAR(190)    NOT NULL,
  company       VARCHAR(160)         NULL,
  website       VARCHAR(190)         NULL,
  phone         VARCHAR(40)          NULL,
  team_size     VARCHAR(40)          NULL,
  budget        VARCHAR(40)          NULL,
  timeline      VARCHAR(40)          NULL,
  services      TEXT                 NULL,  -- JSON array of service slugs
  message       TEXT                 NULL,
  answers       TEXT                 NULL,  -- JSON: automation-audit answers
  score         SMALLINT        NOT NULL DEFAULT 0,
  kind          VARCHAR(20)     NOT NULL DEFAULT 'contact', -- contact | audit
  status        VARCHAR(20)     NOT NULL DEFAULT 'new',
                -- new | contacted | qualified | won | lost | spam
  source_page   VARCHAR(190)         NULL,
  referrer      VARCHAR(255)         NULL,
  utm_source    VARCHAR(120)         NULL,
  utm_medium    VARCHAR(120)         NULL,
  utm_campaign  VARCHAR(120)         NULL,
  ip_hash       CHAR(64)             NULL,  -- HMAC of IP, never the raw address
  user_agent    VARCHAR(255)         NULL,
  notes         TEXT                 NULL,
  notified_at   DATETIME             NULL,
  created_at    DATETIME        NOT NULL,
  updated_at    DATETIME        NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_leads_ref (ref),
  KEY idx_leads_created (created_at),
  KEY idx_leads_status (status),
  KEY idx_leads_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Newsletter subscribers ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email        VARCHAR(190)    NOT NULL,
  status       VARCHAR(20)     NOT NULL DEFAULT 'active', -- active | unsubscribed
  source_page  VARCHAR(190)         NULL,
  ip_hash      CHAR(64)             NULL,
  unsub_token  CHAR(32)        NOT NULL,
  created_at   DATETIME        NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscribers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Admin users ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(120)    NOT NULL,
  email          VARCHAR(190)    NOT NULL,
  password_hash  VARCHAR(255)    NOT NULL,
  last_login_at  DATETIME             NULL,
  created_at     DATETIME        NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Rate limiting ───────────────────────────────────────────────────────────
-- One row per (hashed IP, bucket). Cheap, no cron needed — stale rows are
-- reset lazily when their window expires.
CREATE TABLE IF NOT EXISTS rate_limits (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bucket        VARCHAR(40)     NOT NULL,
  ip_hash       CHAR(64)        NOT NULL,
  hits          INT UNSIGNED    NOT NULL DEFAULT 0,
  window_start  DATETIME        NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rate (bucket, ip_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
--  Create your admin login
--
--  1. Generate a hash for the password you want (run this on your machine, or
--     in Hostinger's Terminal):
--
--       php -r "echo password_hash('your-password-here', PASSWORD_DEFAULT), PHP_EOL;"
--
--  2. Paste the result between the quotes below, set your name and email,
--     uncomment the statement, and run it.
--
--  Do not store the plaintext password anywhere in this file.
-- ============================================================================

-- INSERT INTO admin_users (name, email, password_hash, created_at)
-- VALUES ('Your Name', 'you@example.com', 'PASTE_THE_HASH_HERE', NOW());
