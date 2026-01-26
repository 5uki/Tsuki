// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(projectRoot, '..', '..')

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    server: {
      fs: {
        allow: [workspaceRoot],
      },
    },
    resolve: {
      alias: {
        '@': '/src',
        '@entry': '/entry',
        '@api': '/api',
        '@usecases': '/usecases',
        '@atoms': '/atoms',
        '@contracts': '/contracts',
        '@adapters': '/adapters',
      },
    },
  },
})
