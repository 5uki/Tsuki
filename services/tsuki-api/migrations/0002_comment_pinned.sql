-- Migration: Add pinned column to comments
-- Allows admins to pin important comments to the top

ALTER TABLE comments ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_comments_pinned ON comments (target_type, target_id, pinned);
