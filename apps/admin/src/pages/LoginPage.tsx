import { useAuth } from '@/stores/auth'

const API_BASE = '/v1'

export default function LoginPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="login-page">
        <div className="spinner" />
      </div>
    )
  }

  if (user?.role === 'admin') {
    window.location.href = '/admin/'
    return null
  }

  const returnTo = encodeURIComponent('/admin/')
  const loginUrl = `${API_BASE}/auth/github/start?return_to=${returnTo}`

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Tsuki Admin</h1>
        <p>使用 GitHub 管理员账号登录</p>
        <a href={loginUrl} className="btn btn-primary btn-lg">
          使用 GitHub 登录
        </a>
      </div>
    </div>
  )
}
