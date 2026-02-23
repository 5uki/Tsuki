import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AdminFileChange } from '@tsuki/shared'
import { commitChanges } from '@/api/commit'

interface PendingChangesState {
  changes: Map<string, AdminFileChange>
  addChange: (change: AdminFileChange) => void
  removeChange: (path: string) => void
  clearChanges: () => void
  save: (message: string) => Promise<void>
  saving: boolean
  count: number
}

const PendingChangesContext = createContext<PendingChangesState | null>(null)

export function PendingChangesProvider({ children }: { children: ReactNode }) {
  const [changes, setChanges] = useState<Map<string, AdminFileChange>>(new Map())
  const [saving, setSaving] = useState(false)

  const addChange = useCallback((change: AdminFileChange) => {
    setChanges(prev => {
      const next = new Map(prev)
      next.set(change.path, change)
      return next
    })
  }, [])

  const removeChange = useCallback((path: string) => {
    setChanges(prev => {
      const next = new Map(prev)
      next.delete(path)
      return next
    })
  }, [])

  const clearChanges = useCallback(() => {
    setChanges(new Map())
  }, [])

  const save = useCallback(async (message: string) => {
    if (changes.size === 0) return
    setSaving(true)
    try {
      await commitChanges(message, Array.from(changes.values()))
      setChanges(new Map())
    } finally {
      setSaving(false)
    }
  }, [changes])

  return (
    <PendingChangesContext.Provider
      value={{ changes, addChange, removeChange, clearChanges, save, saving, count: changes.size }}
    >
      {children}
    </PendingChangesContext.Provider>
  )
}

export function usePendingChanges() {
  const ctx = useContext(PendingChangesContext)
  if (!ctx) throw new Error('usePendingChanges must be used within PendingChangesProvider')
  return ctx
}
