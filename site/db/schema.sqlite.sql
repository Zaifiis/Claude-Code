-- ============================================================================
--  SQLite mirror of schema.sql — for previewing the site locally without
--  installing MySQL. Production on Hostinger uses schema.sql.
--
--  Apply it with:  php tools/install-db.php
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ref          TEXT    NOT NULL UNIQUE,
  name         TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  company      TEXT,
  website      TEXT,
  phone        TEXT,
  team_size    TEXT,
  budget       TEXT,
  timeline     TEXT,
  services     TEXT,
  message      TEXT,
  answers      TEXT,
  score        INTEGER NOT NULL DEFAULT 0,
  kind         TEXT    NOT NULL DEFAULT 'contact',
  status       TEXT    NOT NULL DEFAULT 'new',
  source_page  TEXT,
  referrer     TEXT,
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  ip_hash      TEXT,
  user_agent   TEXT,
  notes        TEXT,
  notified_at  TEXT,
  created_at   TEXT    NOT NULL,
  updated_at   TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads (status);

CREATE TABLE IF NOT EXISTS subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'active',
  source_page TEXT,
  ip_hash     TEXT,
  unsub_token TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  last_login_at TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket       TEXT NOT NULL,
  ip_hash      TEXT NOT NULL,
  hits         INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL,
  UNIQUE (bucket, ip_hash)
);
