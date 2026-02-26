import { useState, useEffect, useCallback } from 'react'
import { fetchConfig } from '@/api/config'
import { usePendingChanges } from '@/stores/pending-changes'
import { extractErrorMessage } from '@tsuki/shared/errors'

interface FriendLink {
  name: string
  avatar?: string
  description?: string
  url: string
}

export default function FriendsPage() {
  const { addChange } = usePendingChanges()
  const [friends, setFriends] = useState<FriendLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [configJson, setConfigJson] = useState<Record<string, unknown>>({})

  // Edit state
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [form, setForm] = useState<FriendLink>({ name: '', url: '' })

  useEffect(() => {
    fetchConfig()
      .then(({ config }) => {
        const c = config as Record<string, unknown>
        setConfigJson(c)
        setFriends(Array.isArray(c.friends) ? c.friends : [])
      })
      .catch((err: unknown) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const saveToChanges = useCallback(
    (updatedFriends: FriendLink[]) => {
      const updated = { ...configJson, friends: updatedFriends }
      addChange({
        path: 'tsuki.config.json',
        action: 'update',
        content: JSON.stringify(updated, null, 2),
        encoding: 'utf-8',
      })
    },
    [configJson, addChange]
  )

  const handleAdd = () => {
    setEditIdx(friends.length)
    setForm({ name: '', url: '' })
  }

  const handleEdit = (idx: number) => {
    setEditIdx(idx)
    setForm({ ...friends[idx]! })
  }

  const handleSave = () => {
    if (!form.name || !form.url) return
    const updated = [...friends]
    if (editIdx !== null && editIdx < friends.length) {
      updated[editIdx] = form
    } else {
      updated.push(form)
    }
    setFriends(updated)
    saveToChanges(updated)
    setEditIdx(null)
    setForm({ name: '', url: '' })
  }

  const handleDelete = (idx: number) => {
    if (!confirm(`确定删除 ${friends[idx]!.name}？`)) return
    const updated = friends.filter((_, i) => i !== idx)
    setFriends(updated)
    saveToChanges(updated)
  }

  if (loading)
    return (
      <div className="page">
        <div className="spinner" />
      </div>
    )

  return (
    <div className="page">
      <div className="page-header">
        <h1>友链管理</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          添加友链
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {editIdx !== null && (
        <div className="card mb-4">
          <h3>{editIdx < friends.length ? '编辑友链' : '添加友链'}</h3>
          <div className="form-group">
            <label>名称</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>URL</label>
            <input
              className="input"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>头像 URL</label>
            <input
              className="input"
              value={form.avatar || ''}
              onChange={(e) => setForm({ ...form, avatar: e.target.value || undefined })}
            />
          </div>
          <div className="form-group">
            <label>简介</label>
            <input
              className="input"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value || undefined })}
            />
          </div>
          <div className="form-row">
            <button className="btn btn-primary" onClick={handleSave}>
              保存
            </button>
            <button className="btn btn-ghost" onClick={() => setEditIdx(null)}>
              取消
            </button>
          </div>
        </div>
      )}

      <div className="friends-grid">
        {friends.map((friend, idx) => (
          <div key={idx} className="card friend-card">
            <div className="friend-info">
              {friend.avatar && <img src={friend.avatar} alt="" className="friend-avatar" />}
              <div>
                <strong>{friend.name}</strong>
                {friend.description && <p className="text-muted text-sm">{friend.description}</p>}
                <a href={friend.url} target="_blank" rel="noopener" className="text-sm link">
                  {friend.url}
                </a>
              </div>
            </div>
            <div className="friend-actions">
              <button className="btn btn-sm" onClick={() => handleEdit(idx)}>
                编辑
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(idx)}>
                删除
              </button>
            </div>
          </div>
        ))}
        {friends.length === 0 && <p className="text-center text-muted">暂无友链</p>}
      </div>
    </div>
  )
}
