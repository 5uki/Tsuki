import { useState, useRef, useEffect } from 'react'

export interface CommentFormI18n {
  placeholder: string
  submit: string
  submitError: string
  submitting: string
  cancel: string
  save: string
  replyTo: string
}

interface CommentFormProps {
  onSubmit: (body: string) => Promise<void>
  onCancel?: () => void
  initialValue?: string
  placeholder?: string
  submitLabel?: string
  replyTo?: string
  autoFocus?: boolean
  i18n?: CommentFormI18n
}

export default function CommentForm({
  onSubmit,
  onCancel,
  initialValue = '',
  placeholder,
  submitLabel,
  replyTo,
  autoFocus = false,
  i18n,
}: CommentFormProps) {
  const [body, setBody] = useState(initialValue)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const labels = {
    placeholder: placeholder ?? i18n?.placeholder ?? '写下你的评论...',
    submit: submitLabel ?? i18n?.submit ?? '发表',
    submitError: i18n?.submitError ?? '发表失败',
    submitting: i18n?.submitting ?? '提交中...',
    cancel: i18n?.cancel ?? '取消',
    replyTo: replyTo ? (i18n?.replyTo ?? '回复 @{name}').replace('{name}', replyTo) : undefined,
  }

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
      setError(err instanceof Error ? err.message : labels.submitError)
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
        placeholder={labels.placeholder}
        aria-label={labels.replyTo ?? labels.placeholder}
        disabled={submitting}
        rows={3}
      />
      {error && (
        <div className="comment-form-error" role="alert">
          {error}
        </div>
      )}
      <div className="comment-form-actions">
        {replyTo && <span className="comment-form-reply-hint">{labels.replyTo}</span>}
        {onCancel && (
          <button
            type="button"
            className="comment-form-cancel"
            onClick={onCancel}
            disabled={submitting}
          >
            {labels.cancel}
          </button>
        )}
        <button type="submit" className="comment-form-submit" disabled={!canSubmit}>
          {submitting ? labels.submitting : labels.submit}
        </button>
      </div>
    </form>
  )
}
