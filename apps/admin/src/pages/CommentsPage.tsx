import { useState, useEffect, useCallback } from 'react'
import {
  fetchAdminComments,
  hideComment,
  unhideComment,
  pinComment,
  unpinComment,
  deleteComment,
} from '@/api/comments'
import { useT } from '@/i18n/context'
import type { CommentDTO } from '@tsuki/shared'
import { extractErrorMessage } from '@tsuki/shared/errors'

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const t = useT()

  const loadComments = useCallback(
    async (reset = false) => {
      setLoading(true)
      try {
        const data = await fetchAdminComments({
          cursor: reset ? undefined : cursor || undefined,
          status: statusFilter || undefined,
        })
        if (reset) {
          setComments(data.items)
        } else {
          setComments((prev) => [...prev, ...data.items])
        }
        setCursor(data.next_cursor)
        setHasMore(!!data.next_cursor)
      } catch (err) {
        setError(extractErrorMessage(err))
      } finally {
        setLoading(false)
      }
    },
    [cursor, statusFilter]
  )

  useEffect(() => {
    loadComments(true)
  }, [statusFilter])

  const handleAction = async (action: () => Promise<unknown>) => {
    try {
      await action()
      loadComments(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('admin.comments.title')}</h1>
        <select
          className="input input-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCursor(null)
          }}
        >
          <option value="">{t('admin.comments.allStatus')}</option>
          <option value="visible">{t('admin.comments.visible')}</option>
          <option value="hidden">{t('admin.comments.hidden')}</option>
          <option value="deleted_by_user">{t('admin.comments.deletedByUser')}</option>
          <option value="deleted_by_admin">{t('admin.comments.deletedByAdmin')}</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className={`comment-card ${comment.pinned ? 'pinned' : ''}`}>
            <div className="comment-header">
              <img src={comment.author.avatar_url} alt="" className="comment-avatar" />
              <div className="comment-meta">
                <strong>{comment.author.login}</strong>
                <span className="text-muted">
                  {' '}
                  · {comment.target_type}/{comment.target_id}
                </span>
                {comment.pinned && (
                  <span className="badge badge-accent">{t('admin.comments.pinned')}</span>
                )}
                <span className={`badge badge-${comment.status}`}>{comment.status}</span>
              </div>
            </div>
            <div className="comment-body" dangerouslySetInnerHTML={{ __html: comment.body_html }} />
            <div className="comment-actions">
              {comment.status === 'visible' && (
                <button
                  className="btn btn-sm"
                  onClick={() => handleAction(() => hideComment(comment.id))}
                >
                  {t('admin.comments.hide')}
                </button>
              )}
              {comment.status === 'hidden' && (
                <button
                  className="btn btn-sm"
                  onClick={() => handleAction(() => unhideComment(comment.id))}
                >
                  {t('admin.comments.restore')}
                </button>
              )}
              {!comment.pinned && comment.status === 'visible' && (
                <button
                  className="btn btn-sm"
                  onClick={() => handleAction(() => pinComment(comment.id))}
                >
                  {t('admin.comments.pin')}
                </button>
              )}
              {comment.pinned && (
                <button
                  className="btn btn-sm"
                  onClick={() => handleAction(() => unpinComment(comment.id))}
                >
                  {t('admin.comments.unpin')}
                </button>
              )}
              {comment.status !== 'deleted_by_admin' && comment.status !== 'deleted_by_user' && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    if (confirm(t('admin.comments.confirmDelete'))) {
                      handleAction(() => deleteComment(comment.id))
                    }
                  }}
                >
                  {t('admin.comments.delete')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="spinner" />}
      {!loading && hasMore && (
        <button className="btn btn-ghost" onClick={() => loadComments()}>
          {t('admin.comments.loadMore')}
        </button>
      )}
      {!loading && comments.length === 0 && (
        <p className="text-center text-muted">{t('admin.comments.noComments')}</p>
      )}
    </div>
  )
}
