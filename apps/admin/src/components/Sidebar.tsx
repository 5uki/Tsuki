import { NavLink } from 'react-router-dom'
import { useAuth } from '@/stores/auth'

const navItems = [
  { to: '/', label: '概览', icon: '📊' },
  { to: '/posts', label: '文章', icon: '📝' },
  { to: '/comments', label: '评论', icon: '💬' },
  { to: '/friends', label: '友链', icon: '🔗' },
  { to: '/settings', label: '设置', icon: '⚙️' },
]

export default function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Tsuki</h1>
        <span className="sidebar-subtitle">Admin</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
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
