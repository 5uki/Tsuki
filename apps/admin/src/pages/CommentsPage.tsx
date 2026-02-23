import { useState, useEffect, useCallback } from 'react'
import {
  fetchAdminComments,
  hideComment,
  unhideComment,
  pinComment,
  unpinComment,
  deleteComment,
} from '@/api/comments'
import type { CommentDTO } from '@tsuki/shared'

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const loadComments = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const data = await fetchAdminComments({
        cursor: reset ? undefined : cursor || undefined,
        status: statusFilter || undefined,
      })
      if (reset) {
        setComments(data.items)
      } else {
        setComments(prev => [...prev, ...data.items])
      }
      setCursor(data.next_cursor)
      setHasMore(!!data.next_cursor)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [cursor, statusFilter])

  useEffect(() => {
    loadComments(true)
  }, [statusFilter])

  const handleAction = async (action: () => Promise<unknown>) => {
    try {
      await action()
      loadComments(true)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>评论管理</h1>
        <select
          className="input input-sm"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCursor(null) }}
        >
          <option value="">全部状态</option>
          <option value="visible">可见</option>
          <option value="hidden">隐藏</option>
          <option value="deleted_by_user">用户删除</option>
          <option value="deleted_by_admin">管理员删除</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="comments-list">
        {comments.map(comment => (
          <div key={comment.id} className={`comment-card ${comment.pinned ? 'pinned' : ''}`}>
            <div className="comment-header">
              <img src={comment.author.avatar_url} alt="" className="comment-avatar" />
              <div className="comment-meta">
                <strong>{comment.author.login}</strong>
                <span className="text-muted"> · {comment.target_type}/{comment.target_id}</span>
                {comment.pinned && <span className="badge badge-accent">置顶</span>}
                <span className={`badge badge-${comment.status}`}>{comment.status}</span>
              </div>
            </div>
            <div className="comment-body" dangerouslySetInnerHTML={{ __html: comment.body_html }} />
            <div className="comment-actions">
              {comment.status === 'visible' && (
                <button className="btn btn-sm" onClick={() => handleAction(() => hideComment(comment.id))}>
                  隐藏
                </button>
              )}
              {comment.status === 'hidden' && (
                <button className="btn btn-sm" onClick={() => handleAction(() => unhideComment(comment.id))}>
                  恢复
                </button>
              )}
              {!comment.pinned && comment.status === 'visible' && (
                <button className="btn btn-sm" onClick={() => handleAction(() => pinComment(comment.id))}>
                  置顶
                </button>
              )}
              {comment.pinned && (
                <button className="btn btn-sm" onClick={() => handleAction(() => unpinComment(comment.id))}>
                  取消置顶
                </button>
              )}
              {comment.status !== 'deleted_by_admin' && comment.status !== 'deleted_by_user' && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    if (confirm('确定删除此评论？')) {
                      handleAction(() => deleteComment(comment.id))
                    }
                  }}
                >
                  删除
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="spinner" />}
      {!loading && hasMore && (
        <button className="btn btn-ghost" onClick={() => loadComments()}>
          加载更多
        </button>
      )}
      {!loading && comments.length === 0 && (
        <p className="text-center text-muted">暂无评论</p>
      )}
    </div>
  )
}
