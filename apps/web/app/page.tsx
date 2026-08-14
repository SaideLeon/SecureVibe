import { ScoreCard } from '../components/score-card'
import { calculateSecurityScore, runSecurityScan } from '@securevibe/security-engine'
import type { Severity } from '@securevibe/shared/types'

const demoFiles = [{ path: 'apps/web/app/auth/callback/route.ts', content: 'const redirect = searchParams.get("redirect")\nreturn NextResponse.redirect(`${origin}${redirect}`)' }]
const findings = runSecurityScan({ scanId: 'scan_01JXYZ', files: demoFiles })
const score = calculateSecurityScore(findings)
const counts = findings.reduce<Record<Severity, number>>((acc, finding) => ({ ...acc, [finding.severity]: acc[finding.severity] + 1 }), { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 })

export default function Home() {
  return <main className="min-h-screen px-6 py-8 md:px-12">
    <nav className="mx-auto flex max-w-6xl items-center justify-between"><div className="text-2xl font-black">SecureVibe</div><a className="rounded-full bg-cyan-300 px-5 py-2 font-bold text-slate-950" href="/api/scans/demo">Run demo scan</a></nav>
    <section className="mx-auto grid max-w-6xl gap-8 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
      <div><p className="text-cyan-300">Build with AI. Ship with confidence.</p><h1 className="mt-4 text-5xl font-black leading-tight md:text-7xl">Security layer for AI-built applications.</h1><p className="mt-6 max-w-2xl text-lg text-slate-300">Connect your repo, scan your app, fix the risks, and prove each vulnerability is secure with evidence-backed findings, suggested patches, and tests.</p>
      <div className="mt-8 grid gap-3 text-slate-300 md:grid-cols-3"><span>GitHub / ZIP input</span><span>Static + AI analysis</span><span>PR-ready fixes</span></div></div>
      <ScoreCard score={score.score} counts={counts} />
    </section>
    <section className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-6"><h2 className="text-2xl font-bold">Demo Finding</h2>{findings.map((finding) => <article key={finding.id} className="mt-4 rounded-2xl bg-slate-950/70 p-5"><div className="text-sm font-bold text-orange-300">{finding.severity}</div><h3 className="mt-1 text-xl font-bold">{finding.ruleId} — {finding.title}</h3><p className="mt-2 text-slate-300">{finding.file}: line {finding.lineStart}</p><p className="mt-3 text-slate-300">{finding.description}</p><div className="mt-4 flex gap-3"><button className="rounded-lg border border-cyan-300/40 px-4 py-2">View Finding</button><button className="rounded-lg bg-cyan-300 px-4 py-2 font-bold text-slate-950">Generate Fix</button></div></article>)}</section>
  </main>
}
