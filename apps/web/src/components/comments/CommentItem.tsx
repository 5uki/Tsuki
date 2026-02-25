import { useState } from 'react'
import type { CommentDTO, UserDTO } from '@tsuki/shared/dto'
import { formatRelativeTime, formatDateTime } from '@tsuki/shared/time'
import { EDIT_WINDOW_MS, COMMENT_MAX_DEPTH } from '@tsuki/shared/constants'
import CommentForm from './CommentForm'
import type { CommentFormI18n } from './CommentForm'

export interface CommentItemI18n extends CommentFormI18n {
  deleted: string
  reply: string
  edit: string
  delete: string
  replyPlaceholder: string
  confirmDelete: string
  confirmBtn: string
}

interface CommentItemProps {
  comment: CommentDTO
  currentUser: UserDTO | null
  onReply: (parentId: string, body: string) => Promise<void>
  onEdit: (commentId: string, body: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  children?: React.ReactNode
  i18n?: CommentItemI18n
}

function isDeleted(status: string): boolean {
  return status === 'deleted_by_user' || status === 'deleted_by_admin'
}

export default function CommentItem({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  children,
  i18n,
}: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const labels = {
    deleted: i18n?.deleted ?? '该评论已删除',
    reply: i18n?.reply ?? '回复',
    edit: i18n?.edit ?? '编辑',
    delete: i18n?.delete ?? '删除',
    save: i18n?.save ?? '保存',
    replyPlaceholder: i18n?.replyPlaceholder ?? '回复 @{name}...',
    confirmDelete: i18n?.confirmDelete ?? '确定要删除这条评论吗？',
    confirmBtn: i18n?.confirmBtn ?? '删除',
    cancel: i18n?.cancel ?? '取消',
  }

  if (isDeleted(comment.status)) {
    return (
      <li className="comment-item">
        <div className="comment-deleted">{labels.deleted}</div>
        {children}
      </li>
    )
  }

  const isOwner = currentUser && currentUser.id === comment.author.id
  const isAdmin = currentUser?.role === 'admin'
  const canEdit = isOwner && Date.now() - comment.created_at.ts < EDIT_WINDOW_MS
  const canDelete = isOwner || isAdmin
  const canReply = currentUser && comment.depth < COMMENT_MAX_DEPTH

  const handleReply = async (body: string) => {
    await onReply(comment.id, body)
    setReplyOpen(false)
  }

  const handleEdit = async (body: string) => {
    await onEdit(comment.id, body)
    setEditing(false)
  }

  const handleDelete = async () => {
    await onDelete(comment.id)
    setConfirmDelete(false)
  }

  return (
    <li className="comment-item">
      <div className="comment-header">
        <a href={comment.author.profile_url} target="_blank" rel="noopener noreferrer">
          <img
            className="comment-avatar"
            src={comment.author.avatar_url}
            alt={comment.author.login}
            width={32}
            height={32}
          />
        </a>
        <div className="comment-author-info">
          <a
            className="comment-author"
            href={comment.author.profile_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {comment.author.login}
          </a>
          <time
            className="comment-time"
            dateTime={comment.created_at.iso}
            title={formatDateTime(comment.created_at)}
          >
            {formatRelativeTime(comment.created_at)}
          </time>
        </div>
      </div>

      {editing ? (
        <CommentForm
          initialValue={comment.body_markdown}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
          submitLabel={labels.save}
          autoFocus
          i18n={i18n}
        />
      ) : (
        <>
          <div className="comment-body" dangerouslySetInnerHTML={{ __html: comment.body_html }} />
          <div className="comment-actions">
            {canReply && (
              <button
                type="button"
                className="comment-action-btn"
                onClick={() => {
                  setReplyOpen(!replyOpen)
                  setEditing(false)
                }}
              >
                {labels.reply}
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                className="comment-action-btn"
                onClick={() => {
                  setEditing(true)
                  setReplyOpen(false)
                }}
              >
                {labels.edit}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="comment-action-btn comment-action-btn--danger"
                onClick={() => setConfirmDelete(true)}
              >
                {labels.delete}
              </button>
            )}
          </div>
        </>
      )}

      {replyOpen && (
        <CommentForm
          onSubmit={handleReply}
          onCancel={() => setReplyOpen(false)}
          placeholder={labels.replyPlaceholder.replace('{name}', comment.author.login)}
          replyTo={comment.author.login}
          autoFocus
          i18n={i18n}
        />
      )}

      {confirmDelete && (
        <div
          className="comment-confirm-overlay"
          onClick={() => setConfirmDelete(false)}
          role="presentation"
        >
          <div
            className="comment-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={labels.confirmDelete}
          >
            <p className="comment-confirm-text">{labels.confirmDelete}</p>
            <div className="comment-confirm-actions">
              <button
                type="button"
                className="comment-form-cancel"
                onClick={() => setConfirmDelete(false)}
              >
                {labels.cancel}
              </button>
              <button
                type="button"
                className="comment-form-submit comment-form-submit--danger"
                onClick={handleDelete}
              >
                {labels.confirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </li>
  )
}
