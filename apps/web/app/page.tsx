import { ScoreCard } from '../components/score-card'
import { calculateSecurityScore, runSecurityScan } from '@securevibe/security-engine'
import type { Severity } from '@securevibe/shared/types'

const demoFiles = [{ path: 'apps/web/app/auth/callback/route.ts', content: 'const redirect = searchParams.get("redirect")\nreturn NextResponse.redirect(`${origin}${redirect}`)' }]
const findings = runSecurityScan({ scanId: 'scan_01JXYZ', files: demoFiles })
const score = calculateSecurityScore(findings)
const counts = findings.reduce<Record<Severity, number>>((acc, finding) => ({ ...acc, [finding.severity]: acc[finding.severity] + 1 }), { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 })

export default function Home() {
  return <main className="shell">
    <nav className="topbar"><div className="brand">SecureVibe</div><div className="actions"><a className="primary-link" href="/scan">Analisar GitHub</a><a className="primary-link" href="/api/scans/demo">Run demo scan</a></div></nav>
    <section className="hero">
      <div><p className="eyebrow">Build with AI. Ship with confidence.</p><h1>Security layer for AI-built applications.</h1><p className="lede">Connect your repo, scan your app, fix the risks, and prove each vulnerability is secure with evidence-backed findings, suggested patches, and tests.</p>
      <div className="pill-row"><span>GitHub / ZIP input</span><span>Static + AI analysis</span><span>PR-ready fixes</span></div></div>
      <ScoreCard score={score.score} counts={counts} />
    </section>
    <section className="panel"><h2>Demo Finding</h2>{findings.map((finding) => <article key={finding.id} className="finding"><div className="severity">{finding.severity}</div><h3>{finding.ruleId} — {finding.title}</h3><p className="muted">{finding.file}: line {finding.lineStart}</p><p>{finding.description}</p><div className="actions"><button>View Finding</button><button className="primary-button">Generate Fix</button></div></article>)}</section>
  </main>
}
