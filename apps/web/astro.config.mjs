// @ts-check
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [react()],
  vite: {
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
