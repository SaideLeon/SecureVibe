export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type Category = 'AUTH' | 'SECRETS' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATABASE' | 'RATE_LIMITING' | 'REDIRECT' | 'API' | 'UPLOAD'
export type Evidence = { kind: 'pattern' | 'ast' | 'config' | 'test'; message: string; snippet?: string }
export type Remediation = { explanation: string; patch?: string; testCode?: string }
export type Validation = { command: string; expected: string }
export type SecurityFinding = { id: string; ruleId: string; title: string; severity: Severity; category: Category; file: string; lineStart: number; lineEnd: number; confidence: number; description: string; exploitability: string; impact: string; evidence: Evidence[]; remediation?: Remediation; validation?: Validation; status: 'OPEN' | 'FIX_GENERATED' | 'FIX_APPLIED' | 'TESTING' | 'FIXED' | 'FALSE_POSITIVE' }
