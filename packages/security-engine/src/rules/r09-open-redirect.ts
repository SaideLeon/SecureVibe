import type { SecurityFinding } from '@securevibe/shared/types'
import type { DetectionContext, SecurityRule } from '../types'

const REDIRECT_PARAM = /(searchParams\.get\(['"](?:redirect|next|returnTo)['"]\)|\.get\(['"](?:redirect|next|returnTo)['"]\))/
const NEXT_REDIRECT = /NextResponse\.redirect|redirect\(/

export function resolveSafeRedirect(input: string | null, origin: string, fallback = '/dashboard') {
  if (!input) return fallback
  try {
    const target = new URL(input, origin)
    const trusted = new URL(origin)
    if (target.origin !== trusted.origin) return fallback
    return `${target.pathname}${target.search}${target.hash}` || fallback
  } catch {
    return fallback
  }
}

export const openRedirectRule: SecurityRule = {
  id: 'R09',
  name: 'Open Redirect',
  severity: 'HIGH',
  category: 'REDIRECT',
  description: 'Detects user-controlled redirect destinations that are passed to a redirect response without origin validation.',
  detect(context: DetectionContext): SecurityFinding[] {
    const findings: SecurityFinding[] = []
    for (const file of context.files) {
      if (!/\.(ts|tsx|js|jsx)$/.test(file.path)) continue
      const lines = file.content.split(/\r?\n/)
      lines.forEach((line, index) => {
        if (NEXT_REDIRECT.test(line) && /redirect|next|returnTo/.test(line)) {
          const windowStart = Math.max(0, index - 8)
          const snippet = lines.slice(windowStart, index + 3).join('\n')
          if (REDIRECT_PARAM.test(snippet) && !/resolveSafeRedirect|new URL\([^\n]+origin\)|\.origin\s*===/.test(snippet)) {
            findings.push({ id: `${context.scanId}-R09-${findings.length + 1}`, ruleId: 'R09', title: 'Open Redirect', severity: 'HIGH', category: 'REDIRECT', file: file.path, lineStart: index + 1, lineEnd: index + 1, confidence: 0.82, description: 'A redirect destination influenced by the user reaches a redirect response without proving the final URL belongs to the application origin.', exploitability: 'An attacker can craft login or callback links that send users to a phishing domain after a trusted SecureVibe route is opened.', impact: 'Phishing, credential theft, account takeover assistance, and trust boundary bypass.', evidence: [{ kind: 'pattern', message: 'User-controlled redirect parameter flows into a redirect call without same-origin validation.', snippet }], remediation: { explanation: 'Resolve the candidate redirect with the application origin and allow only same-origin destinations before redirecting.', testCode: 'expect(resolveSafeRedirect("https://evil.com", "https://app.com")).toBe("/dashboard")' }, validation: { command: 'npm test -- tests/security/r09-open-redirect.test.ts', expected: 'External, protocol-relative, and @host payloads resolve to the fallback path.' }, status: 'OPEN' })
          }
        }
      })
    }
    return findings
  },
}
