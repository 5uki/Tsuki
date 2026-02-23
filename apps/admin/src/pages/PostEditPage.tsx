import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPost } from '@/api/posts'
import { usePendingChanges } from '@/stores/pending-changes'
import TipTapEditor from '@/components/editor/TipTapEditor'
import type { AdminPostDTO } from '@tsuki/shared'

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
  if (meta.tags.length) lines.push(`tags: [${meta.tags.map(t => `"${t}"`).join(', ')}]`)
  if (meta.categories.length) lines.push(`categories: [${meta.categories.map(c => `"${c}"`).join(', ')}]`)
  if (meta.cover) lines.push(`cover: "${meta.cover}"`)
  if (meta.status !== 'published') lines.push(`status: ${meta.status}`)
  lines.push('---')
  return lines.join('\n')
}

export default function PostEditPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { addChange } = usePendingChanges()
  const isNew = !slug

  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [date, setDate] = useState('')
  const [tags, setTags] = useState('')
  const [categories, setCategories] = useState('')
  const [cover, setCover] = useState('')
  const [status, setStatus] = useState('published')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!slug) return
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
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  const handleSave = useCallback(() => {
    const postSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (!postSlug) {
      setError('请输入标题')
      return
    }

    const frontmatter = buildFrontmatter({
      title,
      summary,
      date: date || new Date().toISOString().split('T')[0]!,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      categories: categories.split(',').map(c => c.trim()).filter(Boolean),
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
  }, [slug, title, summary, date, tags, categories, cover, status, content, isNew, addChange, navigate])

  if (loading) return <div className="page"><div className="spinner" /></div>
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isNew ? '新建文章' : `编辑: ${title}`}</h1>
        <button className="btn btn-primary" onClick={handleSave}>
          暂存变更
        </button>
      </div>

      <div className="post-editor-grid">
        <div className="post-editor-main">
          <TipTapEditor content={content} onChange={setContent} />
        </div>

        <div className="post-editor-sidebar">
          <div className="form-group">
            <label>标题</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>摘要</label>
            <textarea className="input" rows={3} value={summary} onChange={e => setSummary(e.target.value)} />
          </div>
          <div className="form-group">
            <label>日期</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>标签（逗号分隔）</label>
            <input className="input" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
          <div className="form-group">
            <label>分类（逗号分隔）</label>
            <input className="input" value={categories} onChange={e => setCategories(e.target.value)} />
          </div>
          <div className="form-group">
            <label>封面图路径</label>
            <input className="input" value={cover} onChange={e => setCover(e.target.value)} placeholder="contents/media/cover.jpg" />
          </div>
          <div className="form-group">
            <label>状态</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
              <option value="unlisted">未列出</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
