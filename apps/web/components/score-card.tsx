import type { Severity } from '@securevibe/shared/types'

const order: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
export function ScoreCard({ score, counts }: { score: number; counts: Record<Severity, number> }) {
  return <section className="score-card">
    <p className="eyebrow">Security Score</p>
    <div className="score"><span>{score}</span><small>/ 100</small></div>
    <div className="severity-grid">{order.map((severity) => <div key={severity} className="severity-row"><span>{severity.toLowerCase()}</span><strong>{counts[severity]}</strong></div>)}</div>
  </section>
}
