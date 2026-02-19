/**
 * Sessions 适配器 - D1 实现
 */

import type { SessionPort } from '@contracts/ports'

export function createSessionsAdapter(db: D1Database): SessionPort {
  return {
    async createSession(input) {
      const sessionId = crypto.randomUUID()
      const csrfToken = crypto.randomUUID()
      const now = Date.now()
      const expiresAt = now + input.ttlMs

      await db
        .prepare(
          `INSERT INTO sessions (id, user_id, created_at, expires_at, revoked_at, ip_hash, user_agent_hash)
           VALUES (?, ?, ?, ?, NULL, ?, ?)`
        )
        .bind(sessionId, input.userId, now, expiresAt, input.ipHash, input.uaHash)
        .run()

      return { sessionId, csrfToken, expiresAt }
    },

    async getValidSession(sessionId: string) {
      const now = Date.now()
      const row = await db
        .prepare(
          `SELECT user_id, expires_at FROM sessions
           WHERE id = ? AND expires_at > ? AND revoked_at IS NULL`
        )
        .bind(sessionId, now)
        .first<{ user_id: string; expires_at: number }>()

      if (!row) return null
      return { userId: row.user_id, expiresAt: row.expires_at }
    },

    async revokeSession(sessionId: string) {
      const now = Date.now()
      await db
        .prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?')
        .bind(now, sessionId)
        .run()
    },
  }
}
