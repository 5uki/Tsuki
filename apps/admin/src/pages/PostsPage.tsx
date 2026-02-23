import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchPosts } from '@/api/posts'
import type { AdminPostDTO } from '@tsuki/shared'

export default function PostsPage() {
  const [posts, setPosts] = useState<AdminPostDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <h1>文章管理</h1>
        <Link to="/posts/new" className="btn btn-primary">新建文章</Link>
      </div>

      {loading && <div className="spinner" />}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
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
    </div>
  )
}
