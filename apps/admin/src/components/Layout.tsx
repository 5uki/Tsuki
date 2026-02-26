import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import SaveButton from './SaveButton'

export default function Layout() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <Outlet />
      </main>
      <SaveButton />
    </div>
  )
}
