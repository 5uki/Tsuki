import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { useEffect, useState } from 'react'
import { fetchSetupStatus } from '@/api/setup'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const [setupReady, setSetupReady] = useState(true)
  const [setupLoading, setSetupLoading] = useState(true)

  useEffect(() => {
    fetchSetupStatus()
      .then((status) => setSetupReady(status.ready))
      .catch(() => setSetupReady(true))
      .finally(() => setSetupLoading(false))
  }, [])

  if (loading || setupLoading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
        <p>验证登录状态...</p>
      </div>
    )
  }

  if (!setupReady) {
    return <Navigate to="/setup" replace />
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
