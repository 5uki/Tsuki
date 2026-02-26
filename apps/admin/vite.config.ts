import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

function resolveFaviconHref() {
  try {
    const configPath = path.resolve(__dirname, '../../tsuki.config.json')
    const raw = fs.readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw) as { site?: { faviconHref?: string } }
    return parsed.site?.faviconHref || '/favicon.svg'
  } catch {
    return '/favicon.svg'
  }
}

const faviconHref = resolveFaviconHref()

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'tsuki-admin-favicon',
      transformIndexHtml(html) {
        return html.replace('__TSUKI_FAVICON__', faviconHref)
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify('0.0.1'),
  },
})
