// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import cloudflare from '@astrojs/cloudflare'
import icon from 'astro-icon'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(projectRoot, '..', '..')

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  session: {
    driver: 'memory',
  },
  integrations: [react(), icon()],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  outDir: path.resolve(workspaceRoot, 'dist'),
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
