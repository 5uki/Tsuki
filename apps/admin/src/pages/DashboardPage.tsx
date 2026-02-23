import { useAuth } from '@/stores/auth'
import { usePendingChanges } from '@/stores/pending-changes'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { user } = useAuth()
  const { count } = usePendingChanges()

  return (
    <div className="page">
      <div className="page-header">
        <h1>概览</h1>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>欢迎回来</h3>
          <p className="text-muted">
            {user?.login}，你正在使用 Tsuki 管理后台。
          </p>
        </div>

        <Link to="/posts" className="card card-link">
          <h3>📝 文章管理</h3>
          <p className="text-muted">创建、编辑和管理博客文章</p>
        </Link>

        <Link to="/comments" className="card card-link">
          <h3>💬 评论管理</h3>
          <p className="text-muted">审核、置顶和管理评论</p>
        </Link>

        <Link to="/friends" className="card card-link">
          <h3>🔗 友链管理</h3>
          <p className="text-muted">管理友情链接</p>
        </Link>

        <Link to="/settings" className="card card-link">
          <h3>⚙️ 站点设置</h3>
          <p className="text-muted">修改站点配置和个人资料</p>
        </Link>

        {count > 0 && (
          <div className="card card-warning">
            <h3>📦 待提交变更</h3>
            <p className="text-muted">{count} 个文件待提交到 Git</p>
          </div>
        )}
      </div>
    </div>
  )
}
