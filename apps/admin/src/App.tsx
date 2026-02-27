import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PendingChangesProvider } from '@/stores/pending-changes'
import { AuthProvider } from '@/stores/auth'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardPage from '@/pages/DashboardPage'
import PostsPage from '@/pages/PostsPage'
import PostEditPage from '@/pages/PostEditPage'
import SettingsPage from '@/pages/SettingsPage'
import CommentsPage from '@/pages/CommentsPage'
import FriendsPage from '@/pages/FriendsPage'
import LoginPage from '@/pages/LoginPage'
import SetupPage from '@/pages/SetupPage'

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <AuthProvider>
        <PendingChangesProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="posts" element={<PostsPage />} />
                <Route path="posts/new" element={<PostEditPage />} />
                <Route path="posts/draft/:draftId" element={<PostEditPage />} />
                <Route path="posts/:slug" element={<PostEditPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="comments" element={<CommentsPage />} />
                <Route path="friends" element={<FriendsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PendingChangesProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
