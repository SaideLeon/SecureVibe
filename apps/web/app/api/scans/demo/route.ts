import { NextResponse } from 'next/server'
import { calculateSecurityScore, runSecurityScan } from '@securevibe/security-engine'

export async function GET() {
  const files = [{ path: 'apps/web/app/auth/callback/route.ts', content: 'const redirect = searchParams.get("redirect")\nreturn NextResponse.redirect(`${origin}${redirect}`)' }]
  const findings = runSecurityScan({ scanId: 'scan_01JXYZ', files })
  return NextResponse.json({ scanId: 'scan_01JXYZ', status: 'completed', ...calculateSecurityScore(findings), findings })
}
