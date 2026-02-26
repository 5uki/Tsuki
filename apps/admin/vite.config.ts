import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path, { resolve } from 'node:path'

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
  base: '/admin/',
  plugins: [
    react(),
    {
      name: 'tsuki-admin-favicon',
      transformIndexHtml(html) {
        return html.replace('__TSUKI_FAVICON__', faviconHref)
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/v1': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify('0.0.1'),
  },
})
