import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const nextConfig: NextConfig = {
  transpilePackages: ['@securevibe/security-engine', '@securevibe/shared'],
  turbopack: {
    root: repoRoot,
  },
}

export default nextConfig
