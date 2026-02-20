import { useState } from 'react'
import type { CommentDTO, UserDTO } from '@tsuki/shared/dto'
import { formatRelativeTime, formatDateTime } from '@tsuki/shared/time'
import CommentForm from './CommentForm'

const EDIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

interface CommentItemProps {
  comment: CommentDTO
  currentUser: UserDTO | null
  onReply: (parentId: string, body: string) => Promise<void>
  onEdit: (commentId: string, body: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  children?: React.ReactNode
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
}: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isDeleted(comment.status)) {
    return (
      <li className="comment-item">
        <div className="comment-deleted">该评论已删除</div>
        {children}
      </li>
    )
  }

  const isOwner = currentUser && currentUser.id === comment.author.id
  const isAdmin = currentUser?.role === 'admin'
  const canEdit = isOwner && (Date.now() - comment.created_at.ts) < EDIT_WINDOW_MS
  const canDelete = isOwner || isAdmin
  const canReply = currentUser && comment.depth < 3

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
          submitLabel="保存"
          autoFocus
        />
      ) : (
        <>
          <div
            className="comment-body"
            dangerouslySetInnerHTML={{ __html: comment.body_html }}
          />
          <div className="comment-actions">
            {canReply && (
              <button
                type="button"
                className="comment-action-btn"
                onClick={() => { setReplyOpen(!replyOpen); setEditing(false) }}
              >
                回复
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                className="comment-action-btn"
                onClick={() => { setEditing(true); setReplyOpen(false) }}
              >
                编辑
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="comment-action-btn comment-action-btn--danger"
                onClick={() => setConfirmDelete(true)}
              >
                删除
              </button>
            )}
          </div>
        </>
      )}

      {replyOpen && (
        <CommentForm
          onSubmit={handleReply}
          onCancel={() => setReplyOpen(false)}
          placeholder={`回复 @${comment.author.login}...`}
          replyTo={comment.author.login}
          autoFocus
        />
      )}

      {confirmDelete && (
        <div className="comment-confirm-overlay" onClick={() => setConfirmDelete(false)} role="presentation">
          <div className="comment-confirm-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="确认删除评论">
            <p className="comment-confirm-text">确定要删除这条评论吗？</p>
            <div className="comment-confirm-actions">
              <button
                type="button"
                className="comment-form-cancel"
                onClick={() => setConfirmDelete(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="comment-form-submit comment-form-submit--danger"
                onClick={handleDelete}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </li>
  )
}
