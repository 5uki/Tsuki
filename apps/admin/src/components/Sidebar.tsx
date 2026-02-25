import { NavLink } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { useT } from '@/i18n/context'
import type { TranslationKey } from '@tsuki/i18n'

const navItems: { to: string; labelKey: TranslationKey; icon: string }[] = [
  { to: '/', labelKey: 'admin.nav.dashboard', icon: '📊' },
  { to: '/posts', labelKey: 'admin.nav.posts', icon: '📝' },
  { to: '/comments', labelKey: 'admin.nav.comments', icon: '💬' },
  { to: '/friends', labelKey: 'admin.nav.friends', icon: '🔗' },
  { to: '/settings', labelKey: 'admin.nav.settings', icon: '⚙️' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const t = useT()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Tsuki</h1>
        <span className="sidebar-subtitle">Admin</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="sidebar-footer">
          <img src={user.avatar_url} alt={user.login} className="sidebar-avatar" />
          <span className="sidebar-username">{user.login}</span>
        </div>
      )}
    </aside>
  )
}
