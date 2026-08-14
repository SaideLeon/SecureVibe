import type { Severity } from '@securevibe/shared/types'

const order: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
export function ScoreCard({ score, counts }: { score: number; counts: Record<Severity, number> }) {
  return <section className="rounded-3xl border border-cyan-300/20 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/40">
    <p className="text-sm uppercase tracking-[0.4em] text-cyan-300">Security Score</p>
    <div className="mt-6 flex items-end gap-3"><span className="text-7xl font-black">{score}</span><span className="mb-3 text-2xl text-slate-400">/ 100</span></div>
    <div className="mt-8 grid gap-3">{order.map((severity) => <div key={severity} className="flex justify-between rounded-xl bg-white/5 px-4 py-3"><span className="capitalize text-slate-300">{severity.toLowerCase()}</span><strong>{counts[severity]}</strong></div>)}</div>
  </section>
}
