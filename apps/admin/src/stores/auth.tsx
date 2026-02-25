import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '@/api/client'
import type { UserDTO, ApiResponse } from '@tsuki/shared'

interface AuthState {
  user: UserDTO | null
  loading: boolean
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const res = await api.get<ApiResponse<UserDTO>>('/auth/me')
      setUser(res.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
