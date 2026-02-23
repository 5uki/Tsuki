import { useState } from 'react'
import { usePendingChanges } from '@/stores/pending-changes'

export default function SaveButton() {
  const { count, save, saving } = usePendingChanges()
  const [message, setMessage] = useState('')
  const [showDialog, setShowDialog] = useState(false)

  if (count === 0) return null

  const handleSave = async () => {
    const commitMsg = message.trim() || `admin: update ${count} file(s)`
    await save(commitMsg)
    setMessage('')
    setShowDialog(false)
  }

  return (
    <>
      <button
        className="save-fab"
        onClick={() => setShowDialog(true)}
        disabled={saving}
      >
        {saving ? (
          <span className="spinner-small" />
        ) : (
          <>
            <span className="save-icon">💾</span>
            <span className="save-badge">{count}</span>
          </>
        )}
      </button>

      {showDialog && (
        <div className="modal-overlay" onClick={() => setShowDialog(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <h3>提交变更</h3>
            <p className="text-muted">{count} 个文件将被提交到 Git</p>
            <input
              type="text"
              className="input"
              placeholder="提交信息（可选）"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowDialog(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
