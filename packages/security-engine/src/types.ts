import type { SecurityFinding, Severity, Category } from '@securevibe/shared/types'
export type SourceFile = { path: string; content: string }
export type DetectionContext = { files: SourceFile[]; scanId: string }
export type DetectionFunction = (context: DetectionContext) => SecurityFinding[]
export type SecurityRule = { id: string; name: string; severity: Severity; category: Category; description: string; detect: DetectionFunction }
