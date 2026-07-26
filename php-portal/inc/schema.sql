-- Content OS — MySQL schema (ported from the SQLite/Postgres design).
-- Safe to run repeatedly: every statement uses IF NOT EXISTS.
-- Engine InnoDB + utf8mb4 so foreign keys and emoji both work on Hostinger.

CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(36) NOT NULL,
  name        VARCHAR(120) NOT NULL DEFAULT 'You',
  email       VARCHAR(190) NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT '',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS content_items (
  id              VARCHAR(36) NOT NULL,
  user_id         VARCHAR(36) NOT NULL,
  title           VARCHAR(300) NOT NULL DEFAULT '',
  description     TEXT NULL,
  hook            TEXT NULL,
  script          MEDIUMTEXT NULL,
  cta             TEXT NULL,
  notes           TEXT NULL,
  angle           VARCHAR(300) NOT NULL DEFAULT '',
  category        VARCHAR(190) NOT NULL DEFAULT '',
  content_pillar  VARCHAR(190) NOT NULL DEFAULT '',
  platform        VARCHAR(40) NOT NULL DEFAULT 'other',
  format          VARCHAR(40) NOT NULL DEFAULT 'other',
  status          VARCHAR(40) NOT NULL DEFAULT 'idea',
  priority        VARCHAR(20) NOT NULL DEFAULT 'medium',
  thumbnail_url   VARCHAR(600) NULL,
  archived        TINYINT NOT NULL DEFAULT 0,
  repurposed_from VARCHAR(36) NULL,
  scheduled_at    DATETIME NULL,
  published_at    DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_content_user (user_id),
  KEY idx_content_status (status),
  KEY idx_content_archived (archived),
  KEY idx_content_scheduled (scheduled_at),
  CONSTRAINT fk_content_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_content_repurposed FOREIGN KEY (repurposed_from) REFERENCES content_items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS refs (
  id            VARCHAR(36) NOT NULL,
  user_id       VARCHAR(36) NOT NULL,
  url           VARCHAR(600) NOT NULL,
  platform      VARCHAR(40) NOT NULL DEFAULT 'other',
  title         VARCHAR(300) NOT NULL DEFAULT '',
  thumbnail_url VARCHAR(600) NULL,
  embed_url     VARCHAR(600) NULL,
  notes         TEXT NULL,
  archived      TINYINT NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_refs_user (user_id),
  KEY idx_refs_archived (archived),
  CONSTRAINT fk_refs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS content_references (
  content_id   VARCHAR(36) NOT NULL,
  reference_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (content_id, reference_id),
  KEY idx_cr_ref (reference_id),
  CONSTRAINT fk_cr_content FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_cr_ref FOREIGN KEY (reference_id) REFERENCES refs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tags (
  id          VARCHAR(36) NOT NULL,
  name        VARCHAR(120) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS content_tags (
  content_id  VARCHAR(36) NOT NULL,
  tag_id      VARCHAR(36) NOT NULL,
  PRIMARY KEY (content_id, tag_id),
  KEY idx_ct_tag (tag_id),
  CONSTRAINT fk_ct_content FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reference_tags (
  reference_id VARCHAR(36) NOT NULL,
  tag_id       VARCHAR(36) NOT NULL,
  PRIMARY KEY (reference_id, tag_id),
  KEY idx_rt_tag (tag_id),
  CONSTRAINT fk_rt_ref FOREIGN KEY (reference_id) REFERENCES refs(id) ON DELETE CASCADE,
  CONSTRAINT fk_rt_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attachments (
  id          VARCHAR(36) NOT NULL,
  content_id  VARCHAR(36) NOT NULL,
  name        VARCHAR(300) NOT NULL,
  url         VARCHAR(600) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_att_content (content_id),
  CONSTRAINT fk_att_content FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS performance_metrics (
  content_id  VARCHAR(36) NOT NULL,
  views       INT NOT NULL DEFAULT 0,
  likes       INT NOT NULL DEFAULT 0,
  comments    INT NOT NULL DEFAULT 0,
  shares      INT NOT NULL DEFAULT 0,
  saves       INT NOT NULL DEFAULT 0,
  leads       INT NOT NULL DEFAULT 0,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (content_id),
  CONSTRAINT fk_metrics_content FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
