/**
 * Idempotency 适配器 - D1 实现
 */

import type { IdempotencyPort } from '@contracts/ports'

export function createIdempotencyAdapter(db: D1Database): IdempotencyPort {
  return {
    async find(route, userId, idemKey) {
      const row = await db
        .prepare(
          `SELECT response_status, response_json FROM idempotency_keys
           WHERE route = ? AND user_id IS ? AND idem_key = ? AND expires_at > ?`
        )
        .bind(route, userId, idemKey, Date.now())
        .first<{ response_status: number; response_json: string }>()

      return row ?? null
    },

    async store(input) {
      const now = Date.now()
      await db
        .prepare(
          `INSERT OR REPLACE INTO idempotency_keys
           (id, route, user_id, idem_key, request_hash, response_status, response_json, created_at, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          crypto.randomUUID(),
          input.route,
          input.userId,
          input.idemKey,
          input.requestHash,
          input.responseStatus,
          input.responseJson,
          now,
          now + input.ttlMs
        )
        .run()
    },

    async cleanup() {
      await db
        .prepare('DELETE FROM idempotency_keys WHERE expires_at < ?')
        .bind(Date.now())
        .run()
    },
  }
}
