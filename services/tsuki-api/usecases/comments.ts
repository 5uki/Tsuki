/**
 * Comments 用例
 */

import type { CommentDTO, PaginatedResponse, UserDTO } from '@contracts/dto'
import type { CommentsPort, CommentWithAuthorRecord, CommentRecord } from '@contracts/ports'
import { AppError } from '@contracts/errors'
import { sha256 } from '@atoms/hash'
import { renderCommentMarkdown } from '@atoms/markdown'
import { createTimeDTO } from '@tsuki/shared/time'

/** 限速常量 */
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 分钟
const RATE_LIMIT_USER = 10 // 用户 10 条 / 10 分钟
const RATE_LIMIT_IP = 20 // IP 20 条 / 10 分钟

/** 编辑窗口 */
const EDIT_WINDOW_MS = 15 * 60 * 1000 // 15 分钟

/** 最大深度 */
const MAX_DEPTH = 3

// ─── Helper: CommentWithAuthorRecord -> CommentDTO ───

function recordToDTO(record: CommentWithAuthorRecord): CommentDTO {
  const isDeleted = record.status === 'deleted_by_user' || record.status === 'deleted_by_admin'

  return {
    id: record.id,
    target_type: record.target_type,
    target_id: record.target_id,
    parent_id: record.parent_id,
    depth: record.depth,
    author: {
      id: record.author_id,
      github_id: record.author_github_id,
      login: record.author_login,
      avatar_url: record.author_avatar_url,
      profile_url: record.author_profile_url,
      role: record.author_role,
      created_at: createTimeDTO(record.author_created_at),
    },
    body_markdown: isDeleted ? '' : record.body_markdown,
    body_html: isDeleted ? '' : record.body_html,
    status: record.status,
    created_at: createTimeDTO(record.created_at),
    updated_at: createTimeDTO(record.updated_at),
  }
}

function commentRecordToDTO(record: CommentRecord, author: UserDTO): CommentDTO {
  return {
    id: record.id,
    target_type: record.target_type,
    target_id: record.target_id,
    parent_id: record.parent_id,
    depth: record.depth,
    author,
    body_markdown: record.body_markdown,
    body_html: record.body_html,
    status: record.status,
    created_at: createTimeDTO(record.created_at),
    updated_at: createTimeDTO(record.updated_at),
  }
}

// ─── ListPublicComments ───

export interface ListPublicCommentsInput {
  targetType: 'post' | 'moment'
  targetId: string
  limit: number
  cursor: string | null
  commentsPort: CommentsPort
}

export async function listPublicComments(
  input: ListPublicCommentsInput
): Promise<PaginatedResponse<CommentDTO>> {
  const result = await input.commentsPort.listByTarget(
    input.targetType,
    input.targetId,
    input.limit,
    input.cursor,
    false // 不包含 hidden
  )

  return {
    items: result.items.map(recordToDTO),
    next_cursor: result.next_cursor,
  }
}

// ─── ListAdminComments ───

export interface ListAdminCommentsInput {
  limit: number
  cursor: string | null
  targetType?: 'post' | 'moment'
  targetId?: string
  status?: 'visible' | 'hidden' | 'deleted_by_user' | 'deleted_by_admin'
  commentsPort: CommentsPort
}

export async function listAdminComments(
  input: ListAdminCommentsInput
): Promise<PaginatedResponse<CommentDTO>> {
  const result = await input.commentsPort.listAdmin(input.limit, input.cursor, {
    target_type: input.targetType,
    target_id: input.targetId,
    status: input.status,
  })

  return {
    items: result.items.map(recordToDTO),
    next_cursor: result.next_cursor,
  }
}

// ─── CreateComment ───

export interface CreateCommentInput {
  targetType: 'post' | 'moment'
  targetId: string
  parentId: string | null
  bodyMarkdown: string
  currentUser: UserDTO
  ip: string
  ua: string
  hashSalt: string
  commentsPort: CommentsPort
}

export async function createComment(input: CreateCommentInput): Promise<CommentDTO> {
  // 1. 校验 body 长度（先 trim）
  const body = input.bodyMarkdown.trim()
  if (!body || body.length < 1 || body.length > 2000) {
    throw new AppError('VALIDATION_FAILED', 'Comment body must be 1-2000 characters', {
      field: 'body_markdown',
      reason: 'LENGTH',
    })
  }

  // 2. 验证目标存在（D1-COMMENT-001）
  // 当前阶段文章/动态由 Astro Content Collections (SSG) 管理，不在 D1 中，
  // 所以跳过 targetExists 校验。待内容管理迁入 D1 后再启用。
  // const exists = await input.commentsPort.targetExists(input.targetType, input.targetId)
  // if (!exists) {
  //   throw new AppError('NOT_FOUND', 'Comment target not found')
  // }

  // 3. 计算 IP/UA 哈希
  const [ipHash, uaHash] = await Promise.all([
    sha256(input.ip, input.hashSalt),
    sha256(input.ua, input.hashSalt),
  ])

  // 4. 限速检查
  const [userCount, ipCount] = await Promise.all([
    input.commentsPort.countRecentByUser(input.currentUser.id, RATE_LIMIT_WINDOW_MS),
    input.commentsPort.countRecentByIpHash(ipHash, RATE_LIMIT_WINDOW_MS),
  ])

  if (userCount >= RATE_LIMIT_USER) {
    throw new AppError('RATE_LIMITED', 'Too many comments, please try again later', {
      limit: RATE_LIMIT_USER,
      window_minutes: 10,
    })
  }

  if (ipCount >= RATE_LIMIT_IP) {
    throw new AppError('RATE_LIMITED', 'Too many comments from this IP, please try again later', {
      limit: RATE_LIMIT_IP,
      window_minutes: 10,
    })
  }

  // 5. 深度检查
  let depth = 1
  if (input.parentId) {
    const parent = await input.commentsPort.getById(input.parentId)
    if (!parent) {
      throw new AppError('NOT_FOUND', 'Parent comment not found')
    }
    // 验证 parent 和当前评论指向同一目标
    if (parent.target_type !== input.targetType || parent.target_id !== input.targetId) {
      throw new AppError('VALIDATION_FAILED', 'Parent comment target mismatch', {
        field: 'parent_id',
        reason: 'TARGET_MISMATCH',
      })
    }
    depth = parent.depth + 1
    if (depth > MAX_DEPTH) {
      throw new AppError('COMMENT_DEPTH_EXCEEDED', 'Comment depth limit exceeded', {
        max_depth: MAX_DEPTH,
      })
    }
  }

  // 6. 渲染 Markdown
  const bodyHtml = renderCommentMarkdown(body)

  // 7. 创建评论
  const id = crypto.randomUUID()
  const record = await input.commentsPort.create({
    id,
    target_type: input.targetType,
    target_id: input.targetId,
    parent_id: input.parentId,
    depth,
    author_user_id: input.currentUser.id,
    body_markdown: body,
    body_html: bodyHtml,
    ip_hash: ipHash,
    user_agent_hash: uaHash,
  })

  return commentRecordToDTO(record, input.currentUser)
}

// ─── EditComment ───

export interface EditCommentInput {
  commentId: string
  bodyMarkdown: string
  currentUser: UserDTO
  commentsPort: CommentsPort
}

export async function editComment(input: EditCommentInput): Promise<CommentDTO> {
  // 1. 校验 body 长度（先 trim）
  const body = input.bodyMarkdown.trim()
  if (!body || body.length < 1 || body.length > 2000) {
    throw new AppError('VALIDATION_FAILED', 'Comment body must be 1-2000 characters', {
      field: 'body_markdown',
      reason: 'LENGTH',
    })
  }

  // 2. 获取评论
  const comment = await input.commentsPort.getById(input.commentId)
  if (!comment) {
    throw new AppError('NOT_FOUND', 'Comment not found')
  }

  // 3. 权限检查
  const isAuthor = comment.author_user_id === input.currentUser.id
  const isAdmin = input.currentUser.role === 'admin'

  if (!isAuthor && !isAdmin) {
    throw new AppError('FORBIDDEN', 'You can only edit your own comments')
  }

  // 4. 已删除/隐藏的评论不可编辑
  if (comment.status !== 'visible') {
    throw new AppError('FORBIDDEN', 'Cannot edit a non-visible comment')
  }

  // 5. 时间窗口检查（仅对非 admin 作者）
  if (isAuthor && !isAdmin) {
    const elapsed = Date.now() - comment.created_at
    if (elapsed > EDIT_WINDOW_MS) {
      throw new AppError('FORBIDDEN', 'Edit window has expired (15 minutes)', {
        window_minutes: 15,
      })
    }
  }

  // 6. 渲染 Markdown
  const bodyHtml = renderCommentMarkdown(body)

  // 7. 更新
  await input.commentsPort.update(input.commentId, body, bodyHtml)

  // 8. 返回更新后的 DTO
  return commentRecordToDTO(
    {
      ...comment,
      body_markdown: body,
      body_html: bodyHtml,
      updated_at: Date.now(),
    },
    input.currentUser
  )
}

// ─── DeleteComment ───

export interface DeleteCommentInput {
  commentId: string
  currentUser: UserDTO
  commentsPort: CommentsPort
}

export async function deleteComment(input: DeleteCommentInput): Promise<void> {
  // 1. 获取评论
  const comment = await input.commentsPort.getById(input.commentId)
  if (!comment) {
    throw new AppError('NOT_FOUND', 'Comment not found')
  }

  // 2. 权限检查
  const isAuthor = comment.author_user_id === input.currentUser.id
  const isAdmin = input.currentUser.role === 'admin'

  if (!isAuthor && !isAdmin) {
    throw new AppError('FORBIDDEN', 'You can only delete your own comments')
  }

  // 3. 已删除的评论不能重复删除
  if (comment.status === 'deleted_by_user' || comment.status === 'deleted_by_admin') {
    throw new AppError('NOT_FOUND', 'Comment already deleted')
  }

  // 4. 软删除
  const deletedBy = isAdmin ? 'admin' : 'user'
  await input.commentsPort.softDelete(input.commentId, deletedBy)
}

// ─── HideComment ───

export interface HideCommentInput {
  commentId: string
  commentsPort: CommentsPort
}

export async function hideComment(input: HideCommentInput): Promise<void> {
  const comment = await input.commentsPort.getById(input.commentId)
  if (!comment) {
    throw new AppError('NOT_FOUND', 'Comment not found')
  }
  await input.commentsPort.hide(input.commentId)
}

// ─── UnhideComment ───

export interface UnhideCommentInput {
  commentId: string
  commentsPort: CommentsPort
}

export async function unhideComment(input: UnhideCommentInput): Promise<void> {
  const comment = await input.commentsPort.getById(input.commentId)
  if (!comment) {
    throw new AppError('NOT_FOUND', 'Comment not found')
  }
  await input.commentsPort.unhide(input.commentId)
}
