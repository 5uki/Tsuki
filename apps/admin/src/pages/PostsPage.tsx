import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchPosts } from '@/api/posts'
import { fetchDrafts, deleteDraft, publishDraft } from '@/api/drafts'
import { useT } from '@/i18n/context'
import type { AdminPostDTO, AdminDraftDTO } from '@tsuki/shared'
import { extractErrorMessage } from '@tsuki/shared/errors'

type Tab = 'git' | 'drafts'

export default function PostsPage() {
  const [tab, setTab] = useState<Tab>('git')
  const [posts, setPosts] = useState<AdminPostDTO[]>([])
  const [drafts, setDrafts] = useState<AdminDraftDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useT()

  useEffect(() => {
    setLoading(true)
    setError(null)
    if (tab === 'git') {
      fetchPosts()
        .then(setPosts)
        .catch((err: unknown) => setError(extractErrorMessage(err)))
        .finally(() => setLoading(false))
    } else {
      fetchDrafts()
        .then(setDrafts)
        .catch((err: unknown) => setError(extractErrorMessage(err)))
        .finally(() => setLoading(false))
    }
  }, [tab])

  const handleDeleteDraft = async (id: string) => {
    if (!confirm(t('admin.posts.confirmDelete'))) return
    try {
      await deleteDraft(id)
      setDrafts((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handlePublishDraft = async (id: string) => {
    if (!confirm(t('admin.posts.confirmPublish'))) return
    try {
      await publishDraft(id)
      setDrafts((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('admin.posts.title')}</h1>
        <Link to="/posts/new" className="btn btn-primary">
          {t('admin.posts.new')}
        </Link>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={`btn ${tab === 'git' ? 'btn-primary' : ''}`}
          onClick={() => setTab('git')}
        >
          {t('admin.posts.published')}
        </button>
        <button
          className={`btn ${tab === 'drafts' ? 'btn-primary' : ''}`}
          onClick={() => setTab('drafts')}
        >
          {t('admin.posts.drafts')}
        </button>
      </div>

      {loading && <div className="spinner" />}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && tab === 'git' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.posts.colTitle')}</th>
                <th>{t('admin.posts.colStatus')}</th>
                <th>{t('admin.posts.colDate')}</th>
                <th>{t('admin.posts.colTags')}</th>
                <th>{t('admin.posts.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.slug}>
                  <td>
                    <Link to={`/posts/${post.slug}`} className="link">
                      {post.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge badge-${post.status}`}>{post.status}</span>
                  </td>
                  <td className="text-muted">{post.date || '-'}</td>
                  <td className="text-muted">{post.tags.join(', ') || '-'}</td>
                  <td>
                    <Link to={`/posts/${post.slug}`} className="btn btn-sm">
                      {t('admin.posts.edit')}
                    </Link>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    {t('admin.posts.noPosts')}
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
                <th>{t('admin.posts.colTitle')}</th>
                <th>{t('admin.posts.colUpdated')}</th>
                <th>{t('admin.posts.colScheduled')}</th>
                <th>{t('admin.posts.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft) => (
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
                      {t('admin.posts.edit')}
                    </Link>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handlePublishDraft(draft.id)}
                    >
                      {t('admin.posts.publish')}
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ color: 'var(--color-danger, #e53e3e)' }}
                      onClick={() => handleDeleteDraft(draft.id)}
                    >
                      {t('admin.posts.delete')}
                    </button>
                  </td>
                </tr>
              ))}
              {drafts.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    {t('admin.posts.noDrafts')}
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
