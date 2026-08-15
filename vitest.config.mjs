import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@securevibe/security-engine': resolve(import.meta.dirname, 'packages/security-engine/src'),
      '@securevibe/shared': resolve(import.meta.dirname, 'packages/shared/src'),
    },
  },
})
