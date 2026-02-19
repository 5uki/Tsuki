/**
 * Comments 适配器 - D1 实现
 */

import type { CommentsPort, CommentRecord, CommentWithAuthorRecord } from '@contracts/ports'
import type { PaginatedResponse } from '@contracts/dto'

/**
 * D1 查询返回的联合行类型
 */
interface CommentJoinRow {
  id: string
  target_type: 'post' | 'moment'
  target_id: string
  parent_id: string | null
  depth: number
  author_user_id: string
  body_markdown: string
  body_html: string
  status: 'visible' | 'hidden' | 'deleted_by_user' | 'deleted_by_admin'
  created_at: number
  updated_at: number
  deleted_at: number | null
  ip_hash: string
  user_agent_hash: string
  author_id: string
  author_github_id: number
  author_login: string
  author_avatar_url: string
  author_profile_url: string
  author_role: 'user' | 'admin'
  author_created_at: number
}

const SELECT_WITH_AUTHOR = `
  c.id, c.target_type, c.target_id, c.parent_id, c.depth,
  c.author_user_id, c.body_markdown, c.body_html, c.status,
  c.created_at, c.updated_at, c.deleted_at, c.ip_hash, c.user_agent_hash,
  u.id AS author_id, u.github_id AS author_github_id, u.login AS author_login,
  u.avatar_url AS author_avatar_url, u.profile_url AS author_profile_url,
  u.role AS author_role, u.created_at AS author_created_at
`

export function createCommentsAdapter(db: D1Database): CommentsPort {
  return {
    async listByTarget(
      targetType,
      targetId,
      limit,
      cursor,
      includeHidden
    ): Promise<PaginatedResponse<CommentWithAuthorRecord>> {
      const params: unknown[] = [targetType, targetId]
      let statusFilter: string

      if (includeHidden) {
        // 管理员视角：显示所有状态
        statusFilter = ''
      } else {
        // 公开视角：排除 hidden
        statusFilter = "AND c.status != 'hidden'"
      }

      let cursorFilter = ''
      if (cursor) {
        const cursorTs = parseInt(cursor, 10)
        if (!isNaN(cursorTs)) {
          cursorFilter = 'AND c.created_at > ?'
          params.push(cursorTs)
        }
      }

      params.push(limit + 1)

      const sql = `
        SELECT ${SELECT_WITH_AUTHOR}
        FROM comments c
        JOIN users u ON u.id = c.author_user_id
        WHERE c.target_type = ? AND c.target_id = ?
        ${statusFilter}
        ${cursorFilter}
        ORDER BY c.created_at ASC
        LIMIT ?
      `

      const { results } = await db.prepare(sql).bind(...params).all<CommentJoinRow>()
      const rows = results ?? []

      let nextCursor: string | null = null
      if (rows.length > limit) {
        rows.pop()
        const lastRow = rows[rows.length - 1]
        if (lastRow) {
          nextCursor = String(lastRow.created_at)
        }
      }

      return { items: rows as CommentWithAuthorRecord[], next_cursor: nextCursor }
    },

    async getById(id): Promise<CommentRecord | null> {
      const row = await db
        .prepare('SELECT * FROM comments WHERE id = ?')
        .bind(id)
        .first<CommentRecord>()
      return row ?? null
    },

    async create(input): Promise<CommentRecord> {
      const now = Date.now()
      await db
        .prepare(
          `INSERT INTO comments (id, target_type, target_id, parent_id, depth,
             author_user_id, body_markdown, body_html, status,
             created_at, updated_at, deleted_at, ip_hash, user_agent_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'visible', ?, ?, NULL, ?, ?)`
        )
        .bind(
          input.id,
          input.target_type,
          input.target_id,
          input.parent_id,
          input.depth,
          input.author_user_id,
          input.body_markdown,
          input.body_html,
          now,
          now,
          input.ip_hash,
          input.user_agent_hash
        )
        .run()

      return {
        id: input.id,
        target_type: input.target_type,
        target_id: input.target_id,
        parent_id: input.parent_id,
        depth: input.depth,
        author_user_id: input.author_user_id,
        body_markdown: input.body_markdown,
        body_html: input.body_html,
        status: 'visible',
        created_at: now,
        updated_at: now,
        deleted_at: null,
        ip_hash: input.ip_hash,
        user_agent_hash: input.user_agent_hash,
      }
    },

    async update(id, bodyMarkdown, bodyHtml): Promise<void> {
      const now = Date.now()
      await db
        .prepare('UPDATE comments SET body_markdown = ?, body_html = ?, updated_at = ? WHERE id = ?')
        .bind(bodyMarkdown, bodyHtml, now, id)
        .run()
    },

    async softDelete(id, deletedBy): Promise<void> {
      const now = Date.now()
      const status = deletedBy === 'admin' ? 'deleted_by_admin' : 'deleted_by_user'
      await db
        .prepare(
          'UPDATE comments SET status = ?, deleted_at = ?, updated_at = ? WHERE id = ?'
        )
        .bind(status, now, now, id)
        .run()
    },

    async hide(id): Promise<void> {
      const now = Date.now()
      await db
        .prepare("UPDATE comments SET status = 'hidden', updated_at = ? WHERE id = ?")
        .bind(now, id)
        .run()
    },

    async unhide(id): Promise<void> {
      const now = Date.now()
      await db
        .prepare("UPDATE comments SET status = 'visible', updated_at = ? WHERE id = ?")
        .bind(now, id)
        .run()
    },

    async countRecentByUser(userId, windowMs): Promise<number> {
      const since = Date.now() - windowMs
      const row = await db
        .prepare(
          'SELECT COUNT(*) AS cnt FROM comments WHERE author_user_id = ? AND created_at > ?'
        )
        .bind(userId, since)
        .first<{ cnt: number }>()
      return row?.cnt ?? 0
    },

    async countRecentByIpHash(ipHash, windowMs): Promise<number> {
      const since = Date.now() - windowMs
      const row = await db
        .prepare(
          'SELECT COUNT(*) AS cnt FROM comments WHERE ip_hash = ? AND created_at > ?'
        )
        .bind(ipHash, since)
        .first<{ cnt: number }>()
      return row?.cnt ?? 0
    },

    async targetExists(targetType, targetId): Promise<boolean> {
      if (targetType === 'post') {
        // target_id = post.slug
        const row = await db
          .prepare("SELECT 1 AS ok FROM posts WHERE slug = ? AND status IN ('published', 'unlisted') LIMIT 1")
          .bind(targetId)
          .first<{ ok: number }>()
        return row !== null
      }
      // target_type === 'moment'
      // target_id = moment.id
      const row = await db
        .prepare("SELECT 1 AS ok FROM moments WHERE id = ? AND status = 'published' LIMIT 1")
        .bind(targetId)
        .first<{ ok: number }>()
      return row !== null
    },

    async listAdmin(limit, cursor, filters): Promise<PaginatedResponse<CommentWithAuthorRecord>> {
      const params: unknown[] = []
      const conditions: string[] = []

      if (filters.target_type) {
        conditions.push('c.target_type = ?')
        params.push(filters.target_type)
      }
      if (filters.target_id) {
        conditions.push('c.target_id = ?')
        params.push(filters.target_id)
      }
      if (filters.status) {
        conditions.push('c.status = ?')
        params.push(filters.status)
      }

      if (cursor) {
        const cursorTs = parseInt(cursor, 10)
        if (!isNaN(cursorTs)) {
          conditions.push('c.created_at < ?')
          params.push(cursorTs)
        }
      }

      params.push(limit + 1)

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

      const sql = `
        SELECT ${SELECT_WITH_AUTHOR}
        FROM comments c
        JOIN users u ON u.id = c.author_user_id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ?
      `

      const { results } = await db.prepare(sql).bind(...params).all<CommentJoinRow>()
      const rows = results ?? []

      let nextCursor: string | null = null
      if (rows.length > limit) {
        rows.pop()
        const lastRow = rows[rows.length - 1]
        if (lastRow) {
          nextCursor = String(lastRow.created_at)
        }
      }

      return { items: rows as CommentWithAuthorRecord[], next_cursor: nextCursor }
    },
  }
}
