-- Tsuki D1 初始迁移
-- 按照 REQUIREMENTS.md 11.2 规范创建

PRAGMA foreign_keys = ON;

-- 用户（来自 GitHub OAuth）
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  github_id INTEGER NOT NULL UNIQUE,
  login TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  is_banned INTEGER NOT NULL DEFAULT 0 CHECK (is_banned IN (0, 1)),
  theme_pref TEXT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL
);

-- 会话（服务端会话，Cookie 只存 session_id）
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER NULL,
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

-- 站点级配置（单站点；key-value）
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 媒体（图片）
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  storage TEXT NOT NULL CHECK (storage IN ('static', 'external', 'r2')),
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NULL,
  width INTEGER NULL,
  height INTEGER NULL,
  alt TEXT NOT NULL DEFAULT '',
  sha256 TEXT NULL,
  created_by_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX media_sha256_idx ON media(sha256);

-- 标签
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 分组（分类/系列）
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('category', 'series')),
  description TEXT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 文章
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  cover_media_id TEXT NULL REFERENCES media(id) ON DELETE SET NULL,
  cover_url TEXT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'unlisted')),
  published_at INTEGER NULL,
  updated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  content_markdown TEXT NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT NOT NULL,
  reading_time_minutes INTEGER NOT NULL
);
CREATE INDEX posts_status_published_at_idx ON posts(status, published_at DESC);
CREATE INDEX posts_updated_at_idx ON posts(updated_at DESC);

-- 文章-标签
CREATE TABLE post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX post_tags_tag_id_idx ON post_tags(tag_id, post_id);

-- 文章-分组（含系列 position）
CREATE TABLE post_groups (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  position INTEGER NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, group_id)
);
CREATE INDEX post_groups_group_id_pos_idx ON post_groups(group_id, position, post_id);

-- 动态
CREATE TABLE moments (
  id TEXT PRIMARY KEY,
  body_markdown TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('published', 'deleted')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX moments_status_created_at_idx ON moments(status, created_at DESC);

-- 动态-标签
CREATE TABLE moment_tags (
  moment_id TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (moment_id, tag_id)
);
CREATE INDEX moment_tags_tag_id_idx ON moment_tags(tag_id, moment_id);

-- 动态-媒体（最多 4 张）
CREATE TABLE moment_media (
  moment_id TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 4),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (moment_id, media_id)
);
CREATE INDEX moment_media_moment_pos_idx ON moment_media(moment_id, position);

-- 评论（目标为 post.slug 或 moment.id）
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'moment')),
  target_id TEXT NOT NULL,
  parent_id TEXT NULL REFERENCES comments(id) ON DELETE SET NULL,
  depth INTEGER NOT NULL CHECK (depth >= 1 AND depth <= 3),
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body_markdown TEXT NOT NULL,
  body_html TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('visible', 'hidden', 'deleted_by_user', 'deleted_by_admin')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER NULL,
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL
);
CREATE INDEX comments_target_idx ON comments(target_type, target_id, created_at);
CREATE INDEX comments_author_idx ON comments(author_user_id, created_at);
CREATE INDEX comments_parent_idx ON comments(parent_id, created_at);
CREATE INDEX comments_status_idx ON comments(status, created_at);

-- 幂等键（写接口可选）
CREATE TABLE idempotency_keys (
  id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  idem_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  UNIQUE (route, user_id, idem_key)
);
CREATE INDEX idempotency_expires_at_idx ON idempotency_keys(expires_at);

-- 插入默认配置
INSERT INTO settings (key, value_json, updated_at) VALUES
  ('site_title', '{"value": "Tsuki"}', 1737203696789),
  ('site_description', '{"value": "一个认真写字的地方"}', 1737203696789),
  ('default_theme', '{"value": "paper"}', 1737203696789),
  ('nav_links', '{"value": [{"label": "文章", "href": "/posts"}, {"label": "动态", "href": "/moments"}, {"label": "标签", "href": "/tags"}, {"label": "分组", "href": "/groups"}]}', 1737203696789);
