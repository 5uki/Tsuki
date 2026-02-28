/**
 * Setup 页面路由
 *
 * Worker 直接渲染内联 HTML（不依赖前端构建），挂载到 /setup。
 * 简洁现代的单页设计，引导用户完成首次配置。
 */

import { Hono } from 'hono'
import { html } from 'hono/html'
import type { Env, AppContext } from '@contracts/env'

export function setupPageRoutes() {
  const app = new Hono<{ Bindings: Env; Variables: AppContext }>()

  app.get('/', (c) => {
    const workerOrigin = new URL(c.req.url).origin
    const callbackUrl = `${workerOrigin}/v1/auth/github/callback`

    return c.html(renderSetupPage(workerOrigin, callbackUrl))
  })

  // Catch-all for /setup/* sub-paths
  app.get('/*', (c) => {
    return c.redirect('/setup')
  })

  return app
}

function renderSetupPage(workerOrigin: string, callbackUrl: string) {
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Tsuki - Setup</title>
        <style>
          *,
          *::before,
          *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          :root {
            --bg: #fafafa;
            --surface: #ffffff;
            --border: #e5e7eb;
            --text: #1f2937;
            --text-muted: #6b7280;
            --accent: #2563eb;
            --accent-hover: #1d4ed8;
            --success: #059669;
            --error: #dc2626;
            --radius: 8px;
            --shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            padding: 2rem 1rem;
          }
          .container {
            max-width: 560px;
            width: 100%;
          }
          .logo {
            text-align: center;
            margin-bottom: 2rem;
          }
          .logo h1 {
            font-size: 1.75rem;
            font-weight: 700;
            letter-spacing: -0.02em;
          }
          .logo p {
            color: var(--text-muted);
            margin-top: 0.25rem;
            font-size: 0.95rem;
          }
          .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
            box-shadow: var(--shadow);
            margin-bottom: 1.25rem;
          }
          .card h2 {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 1rem;
          }
          .field {
            margin-bottom: 1rem;
          }
          .field:last-child {
            margin-bottom: 0;
          }
          label {
            display: block;
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 0.25rem;
          }
          .hint {
            font-size: 0.78rem;
            color: var(--text-muted);
            margin-bottom: 0.35rem;
          }
          input[type='text'],
          input[type='password'] {
            width: 100%;
            padding: 0.5rem 0.65rem;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 0.9rem;
            font-family: inherit;
            transition: border-color 0.15s;
          }
          input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
          }
          .readonly-field {
            background: #f3f4f6;
            padding: 0.5rem 0.65rem;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 0.82rem;
            font-family: monospace;
            word-break: break-all;
            cursor: pointer;
            position: relative;
          }
          .readonly-field:hover {
            background: #e5e7eb;
          }
          .toggle-btn {
            background: none;
            border: none;
            color: var(--accent);
            cursor: pointer;
            font-size: 0.82rem;
            padding: 0;
            margin-top: 0.5rem;
            font-family: inherit;
          }
          .toggle-btn:hover {
            text-decoration: underline;
          }
          .optional-section {
            display: none;
          }
          .optional-section.open {
            display: block;
          }
          .btn {
            width: 100%;
            padding: 0.65rem;
            background: var(--accent);
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 0.95rem;
            font-weight: 500;
            cursor: pointer;
            font-family: inherit;
            transition: background 0.15s;
          }
          .btn:hover {
            background: var(--accent-hover);
          }
          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .alert {
            padding: 0.75rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            margin-bottom: 1rem;
            display: none;
          }
          .alert-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: var(--error);
          }
          .alert-success {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: var(--success);
          }
          .success-view {
            text-align: center;
            padding: 2rem 0;
            display: none;
          }
          .success-view h2 {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
            color: var(--success);
          }
          .success-view p {
            color: var(--text-muted);
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
          }
          .success-view a {
            display: inline-block;
            padding: 0.5rem 1.25rem;
            background: var(--accent);
            color: #fff;
            border-radius: 6px;
            text-decoration: none;
            font-size: 0.9rem;
            margin: 0 0.35rem;
          }
          .success-view a:hover {
            background: var(--accent-hover);
          }
          .initialized-view {
            text-align: center;
            padding: 3rem 0;
          }
          .initialized-view h2 {
            font-size: 1.25rem;
            margin-bottom: 0.75rem;
          }
          .initialized-view p {
            color: var(--text-muted);
            font-size: 0.9rem;
          }
          a {
            color: var(--accent);
          }
          .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #fff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            vertical-align: middle;
            margin-right: 0.35rem;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>Tsuki</h1>
            <p>First-time Setup</p>
          </div>

          <div id="loading" style="text-align:center; padding:3rem 0; color:var(--text-muted);">
            Checking status...
          </div>

          <!-- Already initialized view -->
          <div id="initialized-view" class="initialized-view" style="display:none;">
            <h2>Already Configured</h2>
            <p>
              Tsuki is already set up. To change settings, use <code>wrangler secret put</code> or
              update the D1 database directly.
            </p>
            <p style="margin-top:0.5rem; font-size:0.85rem; color:var(--text-muted);">
              Redirecting in a moment...
            </p>
          </div>

          <!-- Setup form view -->
          <div id="setup-form" style="display:none;">
            <div id="alert-error" class="alert alert-error"></div>

            <form id="form" autocomplete="off">
              <!-- GitHub OAuth -->
              <div class="card">
                <h2>GitHub OAuth App</h2>
                <p class="hint" style="margin-bottom:0.75rem;">
                  Create a GitHub OAuth App at
                  <a href="https://github.com/settings/developers" target="_blank" rel="noopener">
                    Settings &gt; Developer settings &gt; OAuth Apps
                  </a>
                </p>

                <div class="field">
                  <label>Callback URL</label>
                  <div class="hint">
                    Copy this URL into your OAuth App's "Authorization callback URL"
                  </div>
                  <div
                    class="readonly-field"
                    onclick="navigator.clipboard.writeText(this.textContent.trim())"
                    title="Click to copy"
                  >
                    ${callbackUrl}
                  </div>
                </div>

                <div class="field">
                  <label for="client_id">Client ID *</label>
                  <input
                    type="text"
                    id="client_id"
                    name="github_oauth_client_id"
                    required
                    placeholder="Ov23li..."
                  />
                </div>

                <div class="field">
                  <label for="client_secret">Client Secret *</label>
                  <input
                    type="password"
                    id="client_secret"
                    name="github_oauth_client_secret"
                    required
                    placeholder="Your OAuth app secret"
                  />
                </div>
              </div>

              <!-- Admin Config -->
              <div class="card">
                <h2>Admin Configuration</h2>

                <div class="field">
                  <label for="admin_ids">Admin GitHub User ID *</label>
                  <div class="hint">
                    Numeric ID, not username. Find it at
                    <a
                      href="https://api.github.com/users/YOUR_USERNAME"
                      target="_blank"
                      rel="noopener"
                      >api.github.com/users/USERNAME</a
                    >
                    (comma-separated for multiple)
                  </div>
                  <input
                    type="text"
                    id="admin_ids"
                    name="admin_github_ids"
                    required
                    placeholder="12345678"
                  />
                </div>

                <div class="field">
                  <label for="public_origin">Public Origin (frontend URL) *</label>
                  <div class="hint">Your Cloudflare Pages URL or custom domain, used for CORS</div>
                  <input
                    type="text"
                    id="public_origin"
                    name="public_origin"
                    required
                    placeholder="https://your-site.pages.dev"
                  />
                </div>
              </div>

              <!-- Optional -->
              <div class="card">
                <button type="button" class="toggle-btn" id="toggle-optional">
                  Show optional settings
                </button>
                <div id="optional-section" class="optional-section">
                  <div class="field" style="margin-top:0.75rem;">
                    <label for="github_token">GitHub Token</label>
                    <div class="hint">
                      Personal access token for content management (repo scope)
                    </div>
                    <input
                      type="password"
                      id="github_token"
                      name="github_token"
                      placeholder="ghp_..."
                    />
                  </div>
                  <div class="field">
                    <label for="turnstile_key">Cloudflare Turnstile Secret Key</label>
                    <div class="hint">For comment spam protection (optional)</div>
                    <input
                      type="password"
                      id="turnstile_key"
                      name="cf_turnstile_secret_key"
                      placeholder="0x..."
                    />
                  </div>
                </div>
              </div>

              <button type="submit" class="btn" id="submit-btn">Complete Setup</button>
            </form>
          </div>

          <!-- Success view -->
          <div id="success-view" class="success-view">
            <h2>Setup Complete!</h2>
            <p>Tsuki is now configured and ready to use.</p>
            <div>
              <a id="link-blog" href="/">Blog</a>
              <a id="link-admin" href="/admin">Admin</a>
            </div>
          </div>
        </div>

        <script>
          const API_BASE = '${workerOrigin}/v1/setup'

          ;(async function init() {
            try {
              const res = await fetch(API_BASE + '/status')
              const data = await res.json()

              document.getElementById('loading').style.display = 'none'

              if (data.ok && data.data.initialized) {
                document.getElementById('initialized-view').style.display = 'block'
                setTimeout(() => {
                  window.location.href = '/'
                }, 3000)
              } else {
                document.getElementById('setup-form').style.display = 'block'
              }
            } catch {
              document.getElementById('loading').textContent =
                'Failed to check status. Is the Worker running?'
            }
          })()

          // Toggle optional section
          document.getElementById('toggle-optional').addEventListener('click', function () {
            const section = document.getElementById('optional-section')
            const open = section.classList.toggle('open')
            this.textContent = open ? 'Hide optional settings' : 'Show optional settings'
          })

          // Form submit
          document.getElementById('form').addEventListener('submit', async function (e) {
            e.preventDefault()
            const btn = document.getElementById('submit-btn')
            const alertEl = document.getElementById('alert-error')
            alertEl.style.display = 'none'

            btn.disabled = true
            btn.innerHTML = '<span class="spinner"></span> Saving...'

            try {
              const fd = new FormData(this)
              const body = {}
              for (const [k, v] of fd.entries()) {
                if (typeof v === 'string' && v.trim()) body[k] = v.trim()
              }

              const res = await fetch(API_BASE + '/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              })

              const data = await res.json()

              if (!data.ok) {
                throw new Error(data.error?.message || 'Unknown error')
              }

              document.getElementById('setup-form').style.display = 'none'
              const originVal = body.public_origin || ''
              document.getElementById('link-blog').href = originVal || '/'
              document.getElementById('link-admin').href = (originVal || '') + '/admin'
              document.getElementById('success-view').style.display = 'block'
            } catch (err) {
              alertEl.textContent = err.message
              alertEl.style.display = 'block'
              btn.disabled = false
              btn.textContent = 'Complete Setup'
            }
          })
        </script>
      </body>
    </html>`
}
