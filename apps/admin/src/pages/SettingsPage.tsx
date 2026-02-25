import { useState, useEffect, useCallback } from 'react'
import { fetchConfig, fetchAbout } from '@/api/config'
import { usePendingChanges } from '@/stores/pending-changes'
import { useT } from '@/i18n/context'
import TipTapEditor from '@/components/editor/TipTapEditor'
import { extractErrorMessage } from '@tsuki/shared/errors'

export default function SettingsPage() {
  const { addChange } = usePendingChanges()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useT()

  const [configJson, setConfigJson] = useState('')
  const [aboutContent, setAboutContent] = useState('')

  const [activeTab, setActiveTab] = useState<'site' | 'about'>('site')

  useEffect(() => {
    Promise.all([fetchConfig(), fetchAbout()])
      .then(([configData, aboutData]) => {
        setConfigJson(JSON.stringify(configData.config, null, 2))
        setAboutContent(aboutData.content)
      })
      .catch((err: unknown) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveConfig = useCallback(() => {
    try {
      JSON.parse(configJson) // validate
    } catch {
      setError(t('admin.settings.jsonError'))
      return
    }
    addChange({
      path: 'tsuki.config.json',
      action: 'update',
      content: configJson,
      encoding: 'utf-8',
    })
    setError(null)
  }, [configJson, addChange, t])

  const handleSaveAbout = useCallback(() => {
    addChange({
      path: 'contents/about.md',
      action: 'update',
      content: aboutContent,
      encoding: 'utf-8',
    })
  }, [aboutContent, addChange])

  if (loading)
    return (
      <div className="page">
        <div className="spinner" />
      </div>
    )

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('admin.settings.title')}</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'site' ? 'active' : ''}`}
          onClick={() => setActiveTab('site')}
        >
          {t('admin.settings.siteConfig')}
        </button>
        <button
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          {t('admin.settings.aboutPage')}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {activeTab === 'site' && (
        <div className="settings-section">
          <p className="text-muted">{t('admin.settings.configDesc')}</p>
          <textarea
            className="input code-input"
            rows={20}
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
            spellCheck={false}
          />
          <button className="btn btn-primary mt-3" onClick={handleSaveConfig}>
            {t('admin.settings.saveConfig')}
          </button>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="settings-section">
          <p className="text-muted">{t('admin.settings.aboutDesc')}</p>
          <TipTapEditor content={aboutContent} onChange={setAboutContent} />
          <button className="btn btn-primary mt-3" onClick={handleSaveAbout}>
            {t('admin.settings.saveAbout')}
          </button>
        </div>
      )}
    </div>
  )
}
