/**
 * Notifications 用例
 */

import type { NotificationDTO, PaginatedResponse } from '@contracts/dto'
import type { NotificationsPort, NotificationRecord, UsersPort } from '@contracts/ports'
import { createTimeDTO } from '../shared/time'

// ─── Helper: NotificationRecord -> NotificationDTO ───

async function recordToDTO(
  record: NotificationRecord,
  usersPort: UsersPort
): Promise<NotificationDTO> {
  let actor: { login: string; avatar_url: string } | null = null
  if (record.actor_id) {
    const user = await usersPort.getUserById(record.actor_id)
    if (user) {
      actor = { login: user.login, avatar_url: user.avatar_url }
    }
  }

  return {
    id: record.id,
    type: record.type,
    actor,
    comment_id: record.comment_id,
    target_type: record.target_type,
    target_id: record.target_id,
    is_read: record.is_read === 1,
    created_at: createTimeDTO(record.created_at),
  }
}

// ─── List Notifications ───

export interface ListNotificationsInput {
  userId: string
  limit: number
  cursor: string | null
  notificationsPort: NotificationsPort
  usersPort: UsersPort
}

export async function listNotifications(
  input: ListNotificationsInput
): Promise<PaginatedResponse<NotificationDTO>> {
  const result = await input.notificationsPort.listByUser(input.userId, input.limit, input.cursor)

  const items = await Promise.all(result.items.map((r) => recordToDTO(r, input.usersPort)))

  return {
    items,
    next_cursor: result.next_cursor,
  }
}

// ─── Get Unread Count ───

export interface GetUnreadCountInput {
  userId: string
  notificationsPort: NotificationsPort
}

export async function getUnreadCount(input: GetUnreadCountInput): Promise<number> {
  return input.notificationsPort.countUnread(input.userId)
}

// ─── Mark As Read ───

export interface MarkAsReadInput {
  userId: string
  ids?: string[]
  notificationsPort: NotificationsPort
}

export async function markAsRead(input: MarkAsReadInput): Promise<void> {
  await input.notificationsPort.markRead(input.userId, input.ids)
}

// ─── Create Notification ───

export interface CreateNotificationInput {
  userId: string
  type: 'comment_reply' | 'comment_pinned' | 'comment_hidden' | 'comment_deleted'
  actorId: string | null
  commentId: string | null
  targetType: 'post' | 'moment'
  targetId: string
  notificationsPort: NotificationsPort
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  // Don't notify yourself
  if (input.actorId && input.actorId === input.userId) return

  await input.notificationsPort.create({
    id: crypto.randomUUID(),
    user_id: input.userId,
    type: input.type,
    actor_id: input.actorId,
    comment_id: input.commentId,
    target_type: input.targetType,
    target_id: input.targetId,
  })
}
