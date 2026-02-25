-- 通知表
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment_reply', 'comment_pinned', 'comment_hidden', 'comment_deleted')),
  actor_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  comment_id TEXT NULL REFERENCES comments(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'moment')),
  target_id TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX notifications_user_unread_idx ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX notifications_user_created_idx ON notifications(user_id, created_at DESC);

-- 补充缺失的索引
CREATE INDEX comments_ip_hash_created_idx ON comments(ip_hash, created_at DESC);
