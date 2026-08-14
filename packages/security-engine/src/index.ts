import type { DetectionContext } from './types'
import { rules } from './rules'
export { calculateSecurityScore, SCORE_ALGORITHM_VERSION } from './scoring'
export { resolveSafeRedirect } from './rules'
export type { DetectionContext, SecurityRule, SourceFile } from './types'
export function runSecurityScan(context: DetectionContext) { return rules.flatMap((rule) => rule.detect(context)) }
