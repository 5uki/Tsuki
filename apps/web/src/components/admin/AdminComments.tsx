import { useState, useEffect, useCallback } from 'react'
import type { CommentDTO, UserDTO } from '@tsuki/shared/dto'
import { getCurrentUser, getAdminComments, hideComment, unhideComment } from '@/lib/api'
import './admin.css'

type StatusFilter = 'all' | 'visible' | 'hidden' | 'deleted'

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'visible', label: 'visible' },
  { key: 'hidden', label: 'hidden' },
  { key: 'deleted', label: 'deleted' },
]

/** Map UI filter to API status param */
function getApiStatus(filter: StatusFilter): string | undefined {
  if (filter === 'all') return undefined
  if (filter === 'deleted') return 'deleted_by_user'
  return filter
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

function getStatusPillClass(status: string): string {
  if (status === 'visible') return 'admin-status-pill admin-status-pill--visible'
  if (status === 'hidden') return 'admin-status-pill admin-status-pill--hidden'
  return 'admin-status-pill admin-status-pill--deleted'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    visible: 'visible',
    hidden: 'hidden',
    deleted_by_user: 'deleted',
    deleted_by_admin: 'deleted',
  }
  return map[status] || status
}

export default function AdminComments() {
  const [user, setUser] = useState<UserDTO | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [comments, setComments] = useState<CommentDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Auth check
  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setUser(u)
        setAuthChecked(true)
      })
      .catch(() => {
        setUser(null)
        setAuthChecked(true)
      })
  }, [])

  const loadComments = useCallback(
    async (cursor?: string) => {
      setLoading(true)
      setError(null)
      try {
        const status = getApiStatus(statusFilter)
        const result = await getAdminComments({ status, cursor, limit: 20 })
        if (cursor) {
          setComments((prev) => [...prev, ...result.items])
        } else {
          setComments(result.items)
        }
        setNextCursor(result.next_cursor)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载评论失败')
      } finally {
        setLoading(false)
      }
    },
    [statusFilter]
  )

  // Reload on filter change
  useEffect(() => {
    if (authChecked && user?.role === 'admin') {
      loadComments()
    }
  }, [statusFilter, authChecked, user, loadComments])

  const handleHide = async (commentId: string) => {
    setActionLoading(commentId)
    try {
      await hideComment(commentId)
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: 'hidden' as const } : c))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnhide = async (commentId: string) => {
    setActionLoading(commentId)
    try {
      await unhideComment(commentId)
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: 'visible' as const } : c))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleLoadMore = () => {
    if (nextCursor) {
      loadComments(nextCursor)
    }
  }

  // Auth states
  if (!authChecked) {
    return <div className="admin-auth-loading">验证权限中...</div>
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-forbidden">
        <div className="admin-forbidden-code">403</div>
        <p className="admin-forbidden-text">无权访问</p>
        <p className="admin-forbidden-hint">此页面仅限管理员访问</p>
        <a className="admin-forbidden-link" href="/">
          返回首页
        </a>
      </div>
    )
  }

  return (
    <div className="admin-comments">
      <div className="admin-comments-header">
        <h1 className="admin-comments-title">评论管理</h1>
        <div className="admin-filter-group">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`admin-filter-btn${statusFilter === f.key ? ' is-active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" className="admin-error-retry" onClick={() => loadComments()}>
            重试
          </button>
        </div>
      )}

      {loading && comments.length === 0 ? (
        <div className="admin-loading">加载中...</div>
      ) : comments.length === 0 ? (
        <div className="admin-empty">暂无评论</div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>作者</th>
                  <th>内容</th>
                  <th>目标</th>
                  <th>状态</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((comment) => (
                  <tr key={comment.id}>
                    <td>
                      <div className="admin-table-author">
                        <img
                          className="admin-table-avatar"
                          src={comment.author.avatar_url}
                          alt={comment.author.login}
                          loading="lazy"
                        />
                        <a
                          className="admin-table-author-name"
                          href={comment.author.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {comment.author.login}
                        </a>
                      </div>
                    </td>
                    <td>
                      <div className="admin-table-body" title={comment.body_markdown}>
                        {truncate(comment.body_markdown, 60)}
                      </div>
                    </td>
                    <td>
                      <span className="admin-table-target">
                        {comment.target_type}/{comment.target_id}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusPillClass(comment.status)}>
                        {getStatusLabel(comment.status)}
                      </span>
                    </td>
                    <td>
                      <span className="admin-table-time">
                        {formatTime(comment.created_at.ts)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        {comment.status === 'visible' && (
                          <button
                            type="button"
                            className="admin-action-btn admin-action-btn--danger"
                            disabled={actionLoading === comment.id}
                            onClick={() => handleHide(comment.id)}
                          >
                            {actionLoading === comment.id ? '...' : '隐藏'}
                          </button>
                        )}
                        {comment.status === 'hidden' && (
                          <button
                            type="button"
                            className="admin-action-btn"
                            disabled={actionLoading === comment.id}
                            onClick={() => handleUnhide(comment.id)}
                          >
                            {actionLoading === comment.id ? '...' : '恢复'}
                          </button>
                        )}
                        {(comment.status === 'deleted_by_user' ||
                          comment.status === 'deleted_by_admin') && (
                          <span className="admin-table-time">--</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {nextCursor && (
            <div className="admin-pagination">
              <button
                type="button"
                className="admin-pagination-btn"
                disabled={loading}
                onClick={handleLoadMore}
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
