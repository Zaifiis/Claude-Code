-- Content OS — SQLite schema
-- A real persistent store for a single-user personal content system.
-- The relational shape mirrors a Postgres design (see README) so it can be
-- ported to Supabase/Postgres later with minimal changes.

PRAGMA foreign_keys = ON;

-- One local user. Auth is out of scope for the local build, but the column
-- exists so a real multi-user backend can be added without a data migration.
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT 'You',
  email       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The core record: one row per piece of content, across its whole lifecycle.
CREATE TABLE IF NOT EXISTS content_items (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  hook            TEXT NOT NULL DEFAULT '',
  script          TEXT NOT NULL DEFAULT '',
  cta             TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  angle           TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT '',
  content_pillar  TEXT NOT NULL DEFAULT '',
  platform        TEXT NOT NULL DEFAULT 'other',
  format          TEXT NOT NULL DEFAULT 'other',
  status          TEXT NOT NULL DEFAULT 'idea',
  priority        TEXT NOT NULL DEFAULT 'medium',
  thumbnail_url   TEXT,
  archived        INTEGER NOT NULL DEFAULT 0,
  repurposed_from TEXT REFERENCES content_items(id) ON DELETE SET NULL,
  scheduled_at    TEXT,
  published_at    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_content_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_archived ON content_items(archived);
CREATE INDEX IF NOT EXISTS idx_content_scheduled ON content_items(scheduled_at);

-- Reference material (videos / posts / articles) saved independently.
CREATE TABLE IF NOT EXISTS refs (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  platform      TEXT NOT NULL DEFAULT 'other',
  title         TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  embed_url     TEXT,
  notes         TEXT NOT NULL DEFAULT '',
  archived      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_refs_archived ON refs(archived);

-- Many-to-many: a reference can inspire many content items, and a content
-- item can cite many references.
CREATE TABLE IF NOT EXISTS content_references (
  content_id  TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  reference_id TEXT NOT NULL REFERENCES refs(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, reference_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_tags (
  content_id  TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  tag_id      TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);

CREATE TABLE IF NOT EXISTS reference_tags (
  reference_id TEXT NOT NULL REFERENCES refs(id) ON DELETE CASCADE,
  tag_id       TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (reference_id, tag_id)
);

-- URL-based attachments (links to briefs, assets, docs). Real & functional;
-- no binary upload pipeline is faked.
CREATE TABLE IF NOT EXISTS attachments (
  id          TEXT PRIMARY KEY,
  content_id  TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Manually-entered performance metrics per published item. Shape allows a
-- future platform-API sync to write the same rows.
CREATE TABLE IF NOT EXISTS performance_metrics (
  content_id  TEXT PRIMARY KEY REFERENCES content_items(id) ON DELETE CASCADE,
  views       INTEGER NOT NULL DEFAULT 0,
  likes       INTEGER NOT NULL DEFAULT 0,
  comments    INTEGER NOT NULL DEFAULT 0,
  shares      INTEGER NOT NULL DEFAULT 0,
  saves       INTEGER NOT NULL DEFAULT 0,
  leads       INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
