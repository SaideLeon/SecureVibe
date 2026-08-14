import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@securevibe/security-engine', '@securevibe/shared'],
}

export default nextConfig
