/**
 * Notifications 适配器 - D1 实现
 */

import type { NotificationsPort, NotificationRecord } from '@contracts/ports'
import type { PaginatedResponse } from '@contracts/dto'

export function createNotificationsAdapter(db: D1Database): NotificationsPort {
  return {
    async create(input) {
      const now = Date.now()
      await db
        .prepare(
          `INSERT INTO notifications (id, user_id, type, actor_id, comment_id, target_type, target_id, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
        )
        .bind(
          input.id,
          input.user_id,
          input.type,
          input.actor_id,
          input.comment_id,
          input.target_type,
          input.target_id,
          now
        )
        .run()
    },

    async listByUser(userId, limit, cursor) {
      let sql = `SELECT * FROM notifications WHERE user_id = ?`
      const params: (string | number)[] = [userId]

      if (cursor) {
        sql += ` AND created_at < ?`
        params.push(parseInt(cursor, 10))
      }

      sql += ` ORDER BY created_at DESC LIMIT ?`
      params.push(limit + 1)

      const stmt = db.prepare(sql)
      const result = await stmt.bind(...params).all<NotificationRecord>()
      const rows = result.results ?? []

      let nextCursor: string | null = null
      if (rows.length > limit) {
        rows.pop()
        const last = rows[rows.length - 1]
        if (last) {
          nextCursor = String(last.created_at)
        }
      }

      return {
        items: rows,
        next_cursor: nextCursor,
      } satisfies PaginatedResponse<NotificationRecord>
    },

    async countUnread(userId) {
      const row = await db
        .prepare(`SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0`)
        .bind(userId)
        .first<{ cnt: number }>()
      return row?.cnt ?? 0
    },

    async markRead(userId, ids) {
      if (ids && ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',')
        await db
          .prepare(
            `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN (${placeholders})`
          )
          .bind(userId, ...ids)
          .run()
      } else {
        await db
          .prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`)
          .bind(userId)
          .run()
      }
    },
  }
}
