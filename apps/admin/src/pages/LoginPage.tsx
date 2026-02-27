import { useAuth } from '@/stores/auth'
import { useT } from '@/i18n/context'
import { useEffect, useState } from 'react'
import { fetchSetupStatus } from '@/api/setup'

const API_BASE = '/v1'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const t = useT()
  const [setupReady, setSetupReady] = useState(true)

  useEffect(() => {
    fetchSetupStatus()
      .then((status) => setSetupReady(status.ready))
      .catch(() => setSetupReady(true))
  }, [])

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

  if (!setupReady) {
    window.location.href = '/admin/setup'
    return null
  }

  const returnTo = encodeURIComponent('/admin/')
  const loginUrl = `${API_BASE}/auth/github/start?return_to=${returnTo}`

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Tsuki Admin</h1>
        <p>{t('admin.login.desc')}</p>
        <a href={loginUrl} className="btn btn-primary btn-lg">
          {t('admin.login.github')}
        </a>
      </div>
    </div>
  )
}
