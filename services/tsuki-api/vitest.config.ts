import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@entry': resolve(__dirname, './entry'),
      '@api': resolve(__dirname, './api'),
      '@usecases': resolve(__dirname, './usecases'),
      '@atoms': resolve(__dirname, './atoms'),
      '@contracts': resolve(__dirname, './contracts'),
      '@adapters': resolve(__dirname, './adapters'),
    },
  },
})
