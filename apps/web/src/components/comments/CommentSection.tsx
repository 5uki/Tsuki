import { useState, useEffect, useCallback } from 'react'
import type { CommentDTO, UserDTO } from '@tsuki/shared/dto'
import { getCurrentUser, getComments, createComment, editComment, deleteComment } from '@/lib/api'
import CommentForm from './CommentForm'
import CommentList from './CommentList'
import type { CommentItemI18n } from './CommentItem'
import './comments.css'

export interface CommentSectionI18n extends CommentItemI18n {
  count: string
  loginToComment: string
}

interface CommentSectionProps {
  targetType: 'post' | 'moment'
  targetId: string
  i18n?: CommentSectionI18n
}

export default function CommentSection({ targetType, targetId, i18n }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentDTO[]>([])
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userChecked, setUserChecked] = useState(false)

  const loadComments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getComments(targetType, targetId)
      setComments(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载评论失败')
    } finally {
      setLoading(false)
    }
  }, [targetType, targetId])

  const checkUser = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
    } catch {
      setCurrentUser(null)
    } finally {
      setUserChecked(true)
    }
  }, [])

  useEffect(() => {
    loadComments()
    checkUser()
  }, [loadComments, checkUser])

  const handleCreateComment = async (body: string) => {
    const newComment = await createComment(targetType, targetId, body)
    setComments((prev) => [...prev, newComment])
  }

  const handleReply = async (parentId: string, body: string) => {
    const newComment = await createComment(targetType, targetId, body, parentId)
    setComments((prev) => [...prev, newComment])
  }

  const handleEdit = async (commentId: string, body: string) => {
    const updated = await editComment(commentId, body)
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)))
  }

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId)
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, status: 'deleted_by_user' as const, body_html: '', body_markdown: '' }
          : c
      )
    )
  }

  const commentCount = comments.filter(
    (c) => c.status !== 'deleted_by_user' && c.status !== 'deleted_by_admin'
  ).length

  const openLoginModal = () => {
    window.dispatchEvent(new CustomEvent('tsuki:open-login'))
  }

  const countLabel = (i18n?.count ?? '{count} 条评论').replace('{count}', String(commentCount))

  return (
    <div className="comment-section">
      <h2 className="comment-section-title">{countLabel}</h2>

      {userChecked &&
        (currentUser ? (
          <CommentForm onSubmit={handleCreateComment} i18n={i18n} />
        ) : (
          <div className="comment-login-prompt">
            <button className="comment-login-link" type="button" onClick={openLoginModal}>
              {i18n?.loginToComment ?? '登录后发表评论'}
            </button>
          </div>
        ))}

      {loading && <div className="comment-loading">...</div>}

      {error && (
        <div className="comment-error" role="alert">
          <span>{error}</span>
          <button type="button" className="comment-error-retry" onClick={loadComments}>
            ↻
          </button>
        </div>
      )}

      {!loading && !error && (
        <CommentList
          comments={comments}
          currentUser={currentUser}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          i18n={i18n}
        />
      )}
    </div>
  )
}
