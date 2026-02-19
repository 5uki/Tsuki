/**
 * Users 适配器 - D1 实现
 */

import type { UsersPort, UserRecord } from '@contracts/ports'

export function createUsersAdapter(
  db: D1Database,
  adminGithubIds: number[]
): UsersPort {
  return {
    async getUserById(id: string): Promise<UserRecord | null> {
      const row = await db
        .prepare('SELECT * FROM users WHERE id = ?')
        .bind(id)
        .first<UserRecord>()
      return row ?? null
    },

    async getUserByGithubId(githubId: number): Promise<UserRecord | null> {
      const row = await db
        .prepare('SELECT * FROM users WHERE github_id = ?')
        .bind(githubId)
        .first<UserRecord>()
      return row ?? null
    },

    async upsertByGithubId(input): Promise<UserRecord> {
      const now = Date.now()
      const role = adminGithubIds.includes(input.github_id) ? 'admin' : input.role

      const existing = await db
        .prepare('SELECT * FROM users WHERE github_id = ?')
        .bind(input.github_id)
        .first<UserRecord>()

      if (existing) {
        await db
          .prepare(
            `UPDATE users
             SET login = ?, avatar_url = ?, profile_url = ?, role = ?,
                 updated_at = ?, last_login_at = ?
             WHERE id = ?`
          )
          .bind(
            input.login,
            input.avatar_url,
            input.profile_url,
            role,
            now,
            now,
            existing.id
          )
          .run()

        return {
          ...existing,
          login: input.login,
          avatar_url: input.avatar_url,
          profile_url: input.profile_url,
          role,
          updated_at: now,
          last_login_at: now,
        }
      }

      const id = crypto.randomUUID()
      await db
        .prepare(
          `INSERT INTO users (id, github_id, login, avatar_url, profile_url, role, is_banned, created_at, updated_at, last_login_at)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
        )
        .bind(
          id,
          input.github_id,
          input.login,
          input.avatar_url,
          input.profile_url,
          role,
          now,
          now,
          now
        )
        .run()

      return {
        id,
        github_id: input.github_id,
        login: input.login,
        avatar_url: input.avatar_url,
        profile_url: input.profile_url,
        role,
        is_banned: 0,
        theme_pref: null,
        created_at: now,
        updated_at: now,
        last_login_at: now,
      }
    },
  }
}
