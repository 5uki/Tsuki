import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/stores/auth'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
        <p>验证登录状态...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return (
      <div className="auth-loading">
        <p>无管理员权限</p>
      </div>
    )
  }

  return <Outlet />
}
