import { useState, useRef, useEffect } from 'react'

interface CommentFormProps {
  onSubmit: (body: string) => Promise<void>
  onCancel?: () => void
  initialValue?: string
  placeholder?: string
  submitLabel?: string
  replyTo?: string
  autoFocus?: boolean
}

export default function CommentForm({
  onSubmit,
  onCancel,
  initialValue = '',
  placeholder = '写下你的评论...',
  submitLabel = '发表',
  replyTo,
  autoFocus = false,
}: CommentFormProps) {
  const [body, setBody] = useState(initialValue)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(trimmed)
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '发表失败')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = body.trim().length > 0 && !submitting

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className="comment-form-textarea"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        aria-label={replyTo ? `回复 @${replyTo}` : placeholder}
        disabled={submitting}
        rows={3}
      />
      {error && <div className="comment-form-error" role="alert">{error}</div>}
      <div className="comment-form-actions">
        {replyTo && (
          <span className="comment-form-reply-hint">
            回复 @{replyTo}
          </span>
        )}
        {onCancel && (
          <button
            type="button"
            className="comment-form-cancel"
            onClick={onCancel}
            disabled={submitting}
          >
            取消
          </button>
        )}
        <button
          type="submit"
          className="comment-form-submit"
          disabled={!canSubmit}
        >
          {submitting ? '提交中...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
