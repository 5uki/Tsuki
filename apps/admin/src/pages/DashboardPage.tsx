import { useAuth } from '@/stores/auth'
import { usePendingChanges } from '@/stores/pending-changes'
import { useT } from '@/i18n/context'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { user } = useAuth()
  const { count } = usePendingChanges()
  const t = useT()

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('admin.dashboard.title')}</h1>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>{t('admin.dashboard.welcome')}</h3>
          <p className="text-muted">
            {t('admin.dashboard.welcomeDesc', { login: user?.login ?? '' })}
          </p>
        </div>

        <Link to="/posts" className="card card-link">
          <h3>{t('admin.dashboard.postsCard')}</h3>
          <p className="text-muted">{t('admin.dashboard.postsDesc')}</p>
        </Link>

        <Link to="/comments" className="card card-link">
          <h3>{t('admin.dashboard.commentsCard')}</h3>
          <p className="text-muted">{t('admin.dashboard.commentsDesc')}</p>
        </Link>

        <Link to="/friends" className="card card-link">
          <h3>{t('admin.dashboard.friendsCard')}</h3>
          <p className="text-muted">{t('admin.dashboard.friendsDesc')}</p>
        </Link>

        <Link to="/settings" className="card card-link">
          <h3>{t('admin.dashboard.settingsCard')}</h3>
          <p className="text-muted">{t('admin.dashboard.settingsDesc')}</p>
        </Link>

        {count > 0 && (
          <div className="card card-warning">
            <h3>{t('admin.dashboard.pendingCard')}</h3>
            <p className="text-muted">{t('admin.dashboard.pendingDesc', { count })}</p>
          </div>
        )}
      </div>
    </div>
  )
}
