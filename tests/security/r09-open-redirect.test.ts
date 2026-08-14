import { describe, expect, it } from 'vitest'
import { resolveSafeRedirect, runSecurityScan } from '@securevibe/security-engine'

describe('R09 — Open Redirect', () => {
  it('rejects external and deceptive URL payloads', () => {
    expect(resolveSafeRedirect('https://evil.com', 'https://app.com')).toBe('/dashboard')
    expect(resolveSafeRedirect('//evil.com/path', 'https://app.com')).toBe('/dashboard')
    expect(resolveSafeRedirect('https://app.com@evil.com', 'https://app.com')).toBe('/dashboard')
  })

  it('allows same-origin paths', () => {
    expect(resolveSafeRedirect('/settings?tab=billing', 'https://app.com')).toBe('/settings?tab=billing')
  })

  it('detects vulnerable Next.js redirects with exact file and line', () => {
    const findings = runSecurityScan({ scanId: 'scan_test', files: [{ path: 'app/auth/callback/route.ts', content: 'const redirect = searchParams.get("redirect")\nreturn NextResponse.redirect(`${origin}${redirect}`)' }] })
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'R09', file: 'app/auth/callback/route.ts', lineStart: 2 })
  })
})
