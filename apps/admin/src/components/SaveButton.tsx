import { useState } from 'react'
import { usePendingChanges } from '@/stores/pending-changes'
import { useT } from '@/i18n/context'

export default function SaveButton() {
  const { count, save, saving } = usePendingChanges()
  const [message, setMessage] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const t = useT()

  if (count === 0) return null

  const handleSave = async () => {
    const commitMsg = message.trim() || `admin: update ${count} file(s)`
    await save(commitMsg)
    setMessage('')
    setShowDialog(false)
  }

  return (
    <>
      <button className="save-fab" onClick={() => setShowDialog(true)} disabled={saving}>
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
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t('admin.save.title')}</h3>
            <p className="text-muted">{t('admin.save.countMsg', { count })}</p>
            <input
              type="text"
              className="input"
              placeholder={t('admin.save.commitPlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowDialog(false)}>
                {t('admin.save.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? t('admin.save.submitting') : t('admin.save.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
