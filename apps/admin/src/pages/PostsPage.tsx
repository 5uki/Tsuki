import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchPosts } from '@/api/posts'
import { fetchDrafts, deleteDraft, publishDraft } from '@/api/drafts'
import type { AdminPostDTO, AdminDraftDTO } from '@tsuki/shared'

type Tab = 'git' | 'drafts'

export default function PostsPage() {
  const [tab, setTab] = useState<Tab>('git')
  const [posts, setPosts] = useState<AdminPostDTO[]>([])
  const [drafts, setDrafts] = useState<AdminDraftDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    if (tab === 'git') {
      fetchPosts()
        .then(setPosts)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    } else {
      fetchDrafts()
        .then(setDrafts)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [tab])

  const handleDeleteDraft = async (id: string) => {
    if (!confirm('确定删除此草稿？')) return
    try {
      await deleteDraft(id)
      setDrafts(prev => prev.filter(d => d.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handlePublishDraft = async (id: string) => {
    if (!confirm('确定发布此草稿到 Git？')) return
    try {
      await publishDraft(id)
      setDrafts(prev => prev.filter(d => d.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>文章管理</h1>
        <Link to="/posts/new" className="btn btn-primary">新建文章</Link>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={`btn ${tab === 'git' ? 'btn-primary' : ''}`}
          onClick={() => setTab('git')}
        >
          已发布 (Git)
        </button>
        <button
          className={`btn ${tab === 'drafts' ? 'btn-primary' : ''}`}
          onClick={() => setTab('drafts')}
        >
          草稿 (D1)
        </button>
      </div>

      {loading && <div className="spinner" />}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && tab === 'git' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>标题</th>
                <th>状态</th>
                <th>日期</th>
                <th>标签</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.slug}>
                  <td>
                    <Link to={`/posts/${post.slug}`} className="link">
                      {post.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge badge-${post.status}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="text-muted">{post.date || '-'}</td>
                  <td className="text-muted">{post.tags.join(', ') || '-'}</td>
                  <td>
                    <Link to={`/posts/${post.slug}`} className="btn btn-sm">
                      编辑
                    </Link>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    暂无文章
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && tab === 'drafts' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>标题</th>
                <th>更新时间</th>
                <th>定时发布</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map(draft => (
                <tr key={draft.id}>
                  <td>
                    <Link to={`/posts/draft/${draft.id}`} className="link">
                      {draft.title}
                    </Link>
                  </td>
                  <td className="text-muted">
                    {new Date(draft.updated_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="text-muted">
                    {draft.scheduled_at
                      ? new Date(draft.scheduled_at).toLocaleString('zh-CN')
                      : '-'}
                  </td>
                  <td style={{ display: 'flex', gap: '0.25rem' }}>
                    <Link to={`/posts/draft/${draft.id}`} className="btn btn-sm">
                      编辑
                    </Link>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handlePublishDraft(draft.id)}
                    >
                      发布
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ color: 'var(--color-danger, #e53e3e)' }}
                      onClick={() => handleDeleteDraft(draft.id)}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {drafts.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    暂无草稿
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
