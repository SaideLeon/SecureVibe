import type { SecurityFinding, Severity } from '@securevibe/shared/types'
export const SCORE_ALGORITHM_VERSION = 'securevibe-score-v1'
const weights: Record<Severity, number> = { CRITICAL: 30, HIGH: 15, MEDIUM: 7, LOW: 2 }
export function calculateSecurityScore(findings: SecurityFinding[]) {
  const penalty = findings.filter((f) => f.status !== 'FIXED' && f.status !== 'FALSE_POSITIVE').reduce((sum, f) => sum + weights[f.severity] * Math.max(0.3, Math.min(1, f.confidence)), 0)
  return { score: Math.max(0, Math.round(100 - penalty)), algorithmVersion: SCORE_ALGORITHM_VERSION }
}
