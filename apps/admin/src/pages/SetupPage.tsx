import { useEffect, useState } from 'react'
import type { SetupConfigDTO, SetupStatusDTO } from '@tsuki/shared'
import { fetchSetupStatus, saveSetupConfig } from '@/api/setup'
import { extractErrorMessage } from '@tsuki/shared/errors'

const EMPTY: SetupConfigDTO = {
  public_origin: '',
  admin_github_ids: '',
  github_oauth_client_id: '',
  github_oauth_client_secret: '',
  github_repo_owner: '',
  github_repo_name: '',
  github_token: '',
}

export default function SetupPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SetupStatusDTO | null>(null)
  const [form, setForm] = useState<SetupConfigDTO>(EMPTY)

  useEffect(() => {
    fetchSetupStatus()
      .then((data) => {
        setStatus(data)
        setForm(data.config)
      })
      .catch((err: unknown) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      const data = await saveSetupConfig(form)
      setStatus(data)
      if (data.ready) {
        window.location.href = '/admin/login'
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
        <p>读取首次启用配置...</p>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 760, margin: '0 auto', paddingTop: 32 }}>
      <h1>首次启用向导</h1>
      <p className="text-muted">配置会写入 D1；若同名环境变量/secret 已存在，仍以 secret 优先。</p>
      {status && (
        <div className="card mb-4">
          <p>
            当前模式：<strong>{status.mode}</strong>；状态：
            <strong>{status.ready ? '已就绪' : '未完成'}</strong>
          </p>
          {!status.ready && (
            <p className="text-sm text-muted">缺失项：{status.missing.join(', ')}</p>
          )}
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card mb-3">
        <h3>基础</h3>
        <label>PUBLIC_ORIGIN</label>
        <input
          className="input"
          value={form.public_origin}
          onChange={(e) => setForm({ ...form, public_origin: e.target.value })}
          placeholder="https://your-domain.com"
        />
        <label>管理员 GitHub IDs（逗号分隔）</label>
        <input
          className="input"
          value={form.admin_github_ids}
          onChange={(e) => setForm({ ...form, admin_github_ids: e.target.value })}
          placeholder="12345,67890"
        />
      </div>

      <div className="card mb-3">
        <h3>GitHub OAuth</h3>
        <label>Client ID</label>
        <input
          className="input"
          value={form.github_oauth_client_id}
          onChange={(e) => setForm({ ...form, github_oauth_client_id: e.target.value })}
        />
        <label>Client Secret</label>
        <input
          className="input"
          value={form.github_oauth_client_secret}
          onChange={(e) => setForm({ ...form, github_oauth_client_secret: e.target.value })}
        />
        <p className="text-sm text-muted">回调地址：{status?.guides.oauth_callback_url}</p>
        <p className="text-sm text-muted">{status?.guides.oauth_note}</p>
      </div>

      <div className="card mb-3">
        <h3>后台发布配置（GitHub Repo）</h3>
        <label>Repo Owner</label>
        <input
          className="input"
          value={form.github_repo_owner}
          onChange={(e) => setForm({ ...form, github_repo_owner: e.target.value })}
          placeholder="your-org"
        />
        <label>Repo Name</label>
        <input
          className="input"
          value={form.github_repo_name}
          onChange={(e) => setForm({ ...form, github_repo_name: e.target.value })}
          placeholder="your-blog-repo"
        />
        <label>GitHub Token</label>
        <input
          className="input"
          value={form.github_token}
          onChange={(e) => setForm({ ...form, github_token: e.target.value })}
        />
        <p className="text-sm text-muted">{status?.guides.publish_note}</p>
      </div>

      <button className="btn btn-primary" onClick={submit} disabled={saving}>
        {saving ? '保存中...' : '保存到 D1'}
      </button>
    </div>
  )
}
