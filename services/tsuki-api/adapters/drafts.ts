/**
 * Drafts 适配器 - D1 实现
 * 操作 posts 表中 status = 'draft' 的记录
 */

import type { DraftsPort, DraftRecord } from '@contracts/ports'

export function createDraftsAdapter(db: D1Database): DraftsPort {
  return {
    async create(input) {
      const now = Date.now()
      await db
        .prepare(
          `INSERT INTO posts (id, slug, title, summary, cover_url, status, scheduled_at, updated_at, created_at, content_markdown, content_html, content_text, reading_time_minutes)
           VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          input.id,
          input.slug,
          input.title,
          input.summary,
          input.cover_url,
          input.scheduled_at,
          now,
          now,
          input.content_markdown,
          input.content_html,
          input.content_text,
          input.reading_time_minutes
        )
        .run()

      return (await this.getById(input.id))!
    },

    async update(id, input) {
      const sets: string[] = []
      const values: unknown[] = []

      if (input.slug !== undefined) { sets.push('slug = ?'); values.push(input.slug) }
      if (input.title !== undefined) { sets.push('title = ?'); values.push(input.title) }
      if (input.summary !== undefined) { sets.push('summary = ?'); values.push(input.summary) }
      if (input.cover_url !== undefined) { sets.push('cover_url = ?'); values.push(input.cover_url) }
      if (input.content_markdown !== undefined) { sets.push('content_markdown = ?'); values.push(input.content_markdown) }
      if (input.content_html !== undefined) { sets.push('content_html = ?'); values.push(input.content_html) }
      if (input.content_text !== undefined) { sets.push('content_text = ?'); values.push(input.content_text) }
      if (input.reading_time_minutes !== undefined) { sets.push('reading_time_minutes = ?'); values.push(input.reading_time_minutes) }
      if (input.scheduled_at !== undefined) { sets.push('scheduled_at = ?'); values.push(input.scheduled_at) }

      sets.push('updated_at = ?')
      values.push(Date.now())
      values.push(id)

      await db
        .prepare(`UPDATE posts SET ${sets.join(', ')} WHERE id = ? AND status = 'draft'`)
        .bind(...values)
        .run()

      return (await this.getById(id))!
    },

    async getById(id) {
      return db
        .prepare(
          `SELECT id, slug, title, summary, cover_url, status, scheduled_at, updated_at, created_at, content_markdown, content_html, content_text, reading_time_minutes
           FROM posts WHERE id = ? AND status = 'draft'`
        )
        .bind(id)
        .first<DraftRecord>()
    },

    async getBySlug(slug) {
      return db
        .prepare(
          `SELECT id, slug, title, summary, cover_url, status, scheduled_at, updated_at, created_at, content_markdown, content_html, content_text, reading_time_minutes
           FROM posts WHERE slug = ? AND status = 'draft'`
        )
        .bind(slug)
        .first<DraftRecord>()
    },

    async list() {
      const { results } = await db
        .prepare(
          `SELECT id, slug, title, summary, cover_url, status, scheduled_at, updated_at, created_at, content_markdown, content_html, content_text, reading_time_minutes
           FROM posts WHERE status = 'draft' ORDER BY updated_at DESC`
        )
        .all<DraftRecord>()
      return results
    },

    async delete(id) {
      await db
        .prepare(`DELETE FROM posts WHERE id = ? AND status = 'draft'`)
        .bind(id)
        .run()
    },

    async listScheduledDue(nowMs) {
      const { results } = await db
        .prepare(
          `SELECT id, slug, title, summary, cover_url, status, scheduled_at, updated_at, created_at, content_markdown, content_html, content_text, reading_time_minutes
           FROM posts WHERE status = 'draft' AND scheduled_at IS NOT NULL AND scheduled_at <= ?
           ORDER BY scheduled_at ASC`
        )
        .bind(nowMs)
        .all<DraftRecord>()
      return results
    },
  }
}
