import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPost } from '@/api/posts'
import {
  fetchDraft,
  saveDraft as saveDraftApi,
  publishDraft as publishDraftApi,
} from '@/api/drafts'
import { usePendingChanges } from '@/stores/pending-changes'
import TipTapEditor from '@/components/editor/TipTapEditor'
import type { AdminPostDTO } from '@tsuki/shared'
import { extractErrorMessage } from '@tsuki/shared/errors'

function buildFrontmatter(meta: {
  title: string
  summary: string
  date: string
  tags: string[]
  categories: string[]
  cover: string
  status: string
}): string {
  const lines = ['---']
  lines.push(`title: "${meta.title}"`)
  if (meta.summary) lines.push(`summary: "${meta.summary}"`)
  if (meta.date) lines.push(`date: ${meta.date}`)
  if (meta.tags.length) lines.push(`tags: [${meta.tags.map((t) => `"${t}"`).join(', ')}]`)
  if (meta.categories.length)
    lines.push(`categories: [${meta.categories.map((c) => `"${c}"`).join(', ')}]`)
  if (meta.cover) lines.push(`cover: "${meta.cover}"`)
  if (meta.status !== 'published') lines.push(`status: ${meta.status}`)
  lines.push('---')
  return lines.join('\n')
}

export default function PostEditPage() {
  const { slug, draftId } = useParams<{ slug?: string; draftId?: string }>()
  const navigate = useNavigate()
  const { addChange } = usePendingChanges()
  const isDraftMode = !!draftId
  const isNew = !slug && !draftId

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [date, setDate] = useState('')
  const [tags, setTags] = useState('')
  const [categories, setCategories] = useState('')
  const [cover, setCover] = useState('')
  const [status, setStatus] = useState('published')
  const [content, setContent] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  useEffect(() => {
    if (isDraftMode && draftId) {
      fetchDraft(draftId)
        .then((draft) => {
          setCurrentDraftId(draft.id)
          setTitle(draft.title)
          setSummary(draft.summary)
          setCover(draft.cover_url || '')
          setContent(draft.content_markdown)
          if (draft.scheduled_at) {
            setScheduledAt(new Date(draft.scheduled_at).toISOString().slice(0, 16))
          }
        })
        .catch((err: unknown) => setError(extractErrorMessage(err)))
        .finally(() => setLoading(false))
    } else if (slug) {
      fetchPost(slug)
        .then((post: AdminPostDTO) => {
          setTitle(post.title)
          setSummary(post.summary)
          setDate(post.date || '')
          setTags(post.tags.join(', '))
          setCategories(post.categories.join(', '))
          setCover(post.cover || '')
          setStatus(post.status)
          setContent(post.content_markdown)
        })
        .catch((err: unknown) => setError(extractErrorMessage(err)))
        .finally(() => setLoading(false))
    }
  }, [slug, draftId, isDraftMode])

  const handleSaveDraft = useCallback(async () => {
    const draftSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    if (!draftSlug || !title) {
      setError('请输入标题')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const result = await saveDraftApi({
        id: currentDraftId,
        slug: draftSlug,
        title,
        summary,
        cover_url: cover || null,
        content_markdown: content,
        scheduled_at: scheduledAt ? new Date(scheduledAt).getTime() : null,
      })
      setCurrentDraftId(result.id)
      if (!isDraftMode) {
        navigate(`/posts/draft/${result.id}`, { replace: true })
      }
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }, [currentDraftId, slug, title, summary, cover, content, scheduledAt, isDraftMode, navigate])

  const handlePublishDraft = useCallback(async () => {
    if (!currentDraftId) return
    setSaving(true)
    setError(null)
    try {
      await publishDraftApi(currentDraftId)
      navigate('/posts', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }, [currentDraftId, navigate])

  const handleSave = useCallback(() => {
    const postSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    if (!postSlug) {
      setError('请输入标题')
      return
    }

    const frontmatter = buildFrontmatter({
      title,
      summary,
      date: date || new Date().toISOString().split('T')[0]!,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      categories: categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      cover,
      status,
    })

    const fullContent = `${frontmatter}\n\n${content}`
    const path = `contents/posts/${postSlug}.md`

    addChange({
      path,
      action: isNew ? 'create' : 'update',
      content: fullContent,
      encoding: 'utf-8',
    })

    if (isNew) {
      navigate(`/posts/${postSlug}`, { replace: true })
    }
  }, [
    slug,
    title,
    summary,
    date,
    tags,
    categories,
    cover,
    status,
    content,
    isNew,
    addChange,
    navigate,
  ])

  if (loading)
    return (
      <div className="page">
        <div className="spinner" />
      </div>
    )
  if (error)
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    )

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isDraftMode ? `编辑草稿: ${title}` : isNew ? '新建文章' : `编辑: ${title}`}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isDraftMode ? (
            <>
              <button className="btn" onClick={handleSaveDraft} disabled={saving}>
                {saving ? '保存中...' : '保存草稿'}
              </button>
              <button className="btn btn-primary" onClick={handlePublishDraft} disabled={saving}>
                发布
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={handleSaveDraft} disabled={saving}>
                {saving ? '保存中...' : '保存为草稿'}
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                暂存变更
              </button>
            </>
          )}
        </div>
      </div>

      <div className="post-editor-grid">
        <div className="post-editor-main">
          <TipTapEditor content={content} onChange={setContent} />
        </div>

        <div className="post-editor-sidebar">
          <div className="form-group">
            <label>标题</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>摘要</label>
            <textarea
              className="input"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
          {!isDraftMode && (
            <>
              <div className="form-group">
                <label>日期</label>
                <input
                  className="input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>标签（逗号分隔）</label>
                <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
              <div className="form-group">
                <label>分类（逗号分隔）</label>
                <input
                  className="input"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>状态</label>
                <select
                  className="input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="published">已发布</option>
                  <option value="draft">草稿</option>
                  <option value="unlisted">未列出</option>
                </select>
              </div>
            </>
          )}
          <div className="form-group">
            <label>封面图路径</label>
            <input
              className="input"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="contents/media/cover.jpg"
            />
          </div>
          <div className="form-group">
            <label>定时发布</label>
            <input
              className="input"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
