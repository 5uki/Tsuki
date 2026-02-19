// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import cloudflare from '@astrojs/cloudflare'
import icon from 'astro-icon'
import expressiveCode from 'astro-expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import swup from '@swup/astro'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(projectRoot, '..', '..')

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  session: {
    driver: 'memory',
  },
  integrations: [
    expressiveCode({
      themes: ['github-dark', 'github-light'],
      plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
      defaultProps: {
        showLineNumbers: true,
        wrap: true,
        preserveIndent: true,
      },
      styleOverrides: {
        borderRadius: '0.5rem',
        borderColor: 'var(--tsuki-surface-border)',
        codeFontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
        codeFontSize: '0.875em',
        codeLineHeight: '1.7',
        codePaddingBlock: '1rem',
        codePaddingInline: '1.25rem',
        frames: {
          editorActiveTabIndicatorTopColor: 'var(--tsuki-theme-accent)',
          frameBoxShadowCssValue: '0 2px 8px rgba(0, 0, 0, 0.08)',
          tooltipSuccessBackground: 'var(--tsuki-theme-accent)',
        },
      },
    }),
    swup({
      theme: false,
      containers: ['#swup'],
      animationClass: 'transition-',
      cache: true,
      preload: true,
      accessibility: true,
      globalInstance: true,
      morph: ['.tsuki-banner-waves'],
      updateHead: true,
      updateBodyClass: true,
      reloadScripts: true,
      smoothScrolling: true,
    }),
    react(),
    icon(),
  ],
  markdown: {
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
      },
    },
  },
})
