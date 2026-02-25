-- Add scheduled_at column for draft scheduling
ALTER TABLE posts ADD COLUMN scheduled_at INTEGER NULL;
CREATE INDEX posts_scheduled_at_idx ON posts(scheduled_at) WHERE scheduled_at IS NOT NULL AND status = 'draft';
