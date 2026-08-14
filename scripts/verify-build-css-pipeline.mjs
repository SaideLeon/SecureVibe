import { existsSync } from 'node:fs'

const removedConfigs = ['apps/web/postcss.config.js', 'apps/web/tailwind.config.ts']
const staleConfig = removedConfigs.find((file) => existsSync(file))

if (staleConfig) {
  throw new Error(`${staleConfig} must not exist. SecureVibe uses plain CSS for the MVP build to avoid Tailwind/PostCSS plugin mismatches on Vercel.`)
}
