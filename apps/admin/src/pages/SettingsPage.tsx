import { useState, useEffect, useCallback } from 'react'
import { fetchConfig, fetchAbout } from '@/api/config'
import { usePendingChanges } from '@/stores/pending-changes'
import TipTapEditor from '@/components/editor/TipTapEditor'

export default function SettingsPage() {
  const { addChange } = usePendingChanges()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [configJson, setConfigJson] = useState('')
  const [aboutContent, setAboutContent] = useState('')

  const [activeTab, setActiveTab] = useState<'site' | 'about'>('site')

  useEffect(() => {
    Promise.all([fetchConfig(), fetchAbout()])
      .then(([configData, aboutData]) => {
        setConfigJson(JSON.stringify(configData.config, null, 2))
        setAboutContent(aboutData.content)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveConfig = useCallback(() => {
    try {
      JSON.parse(configJson) // validate
    } catch {
      setError('JSON 格式错误')
      return
    }
    addChange({
      path: 'tsuki.config.json',
      action: 'update',
      content: configJson,
      encoding: 'utf-8',
    })
    setError(null)
  }, [configJson, addChange])

  const handleSaveAbout = useCallback(() => {
    addChange({
      path: 'contents/about.md',
      action: 'update',
      content: aboutContent,
      encoding: 'utf-8',
    })
  }, [aboutContent, addChange])

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>站点设置</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'site' ? 'active' : ''}`}
          onClick={() => setActiveTab('site')}
        >站点配置</button>
        <button
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >关于页面</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {activeTab === 'site' && (
        <div className="settings-section">
          <p className="text-muted">编辑 tsuki.config.json 配置文件</p>
          <textarea
            className="input code-input"
            rows={20}
            value={configJson}
            onChange={e => setConfigJson(e.target.value)}
            spellCheck={false}
          />
          <button className="btn btn-primary mt-3" onClick={handleSaveConfig}>
            暂存配置变更
          </button>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="settings-section">
          <p className="text-muted">编辑关于页面 (Markdown)</p>
          <TipTapEditor content={aboutContent} onChange={setAboutContent} />
          <button className="btn btn-primary mt-3" onClick={handleSaveAbout}>
            暂存关于页变更
          </button>
        </div>
      )}
    </div>
  )
}
