export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

// Categorias originais preservadas + novas categorias exigidas para cobrir
// o catálogo completo R01-R25 / CTF-R01-11 usado na auditoria por IA.
export type Category =
  | 'AUTH'
  | 'SECRETS'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'DATABASE'
  | 'RATE_LIMITING'
  | 'REDIRECT'
  | 'API'
  | 'UPLOAD'
  | 'INPUT_VALIDATION'
  | 'ACCESS_CONTROL'
  | 'BUSINESS_LOGIC'
  | 'RACE_CONDITION'
  | 'CRYPTO'
  | 'DEV_PRACTICES'

export type Evidence = { kind: 'pattern' | 'ast' | 'config' | 'test'; message: string; snippet?: string }
export type Remediation = { explanation: string; patch?: string; testCode?: string }
export type Validation = { command: string; expected: string }

export type SecurityFinding = {
  id: string
  ruleId: string
  title: string
  severity: Severity
  category: Category
  file: string
  lineStart: number
  lineEnd: number
  confidence: number
  description: string
  exploitability: string
  impact: string
  evidence: Evidence[]
  remediation?: Remediation
  validation?: Validation
  status: 'OPEN' | 'FIX_GENERATED' | 'FIX_APPLIED' | 'TESTING' | 'FIXED' | 'FALSE_POSITIVE'
}
