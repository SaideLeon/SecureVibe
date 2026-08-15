import type { Category, SecurityFinding, Severity } from '@securevibe/shared/types'
import type { SourceFile } from '../types'
import { GROQ_DEFAULT_MODEL, runGroqCompletion } from './groq-client'
import { buildAuditSystemPrompt, buildAuditUserPrompt } from './audit-prompt'
import { AI_RULESET } from './ruleset'

type RawAiFinding = {
  ruleId: string
  file: string
  lineStart?: number
  lineEnd?: number
  title?: string
  description?: string
  exploitability?: string
  impact?: string
  snippet?: string
  confidence?: number
  remediationExplanation?: string
  patch?: string
  testCode?: string
  validationCommand?: string
  validationExpected?: string
}

function extractJsonArray(raw: string): RawAiFinding[] {
  const cleaned = raw.trim().replace(/^```(json)?/i, '').replace(/```$/i, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) return []
    try {
      const parsed = JSON.parse(match[0])
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
}

export type AiAuditOptions = { scanId: string; repoLabel: string; model?: string }

export async function runAiSecurityAudit(files: SourceFile[], options: AiAuditOptions): Promise<SecurityFinding[]> {
  const ruleMap = new Map(AI_RULESET.map((rule) => [rule.id, rule]))

  const raw = await runGroqCompletion(
    [
      { role: 'system', content: buildAuditSystemPrompt() },
      { role: 'user', content: buildAuditUserPrompt(files, options.repoLabel) },
    ],
    { model: options.model ?? GROQ_DEFAULT_MODEL, temperature: 0.15, maxCompletionTokens: 8000, reasoningEffort: 'medium' }
  )

  const rawFindings = extractJsonArray(raw)

  return rawFindings
    .filter((item) => ruleMap.has(item.ruleId))
    .map((item, index) => {
      const rule = ruleMap.get(item.ruleId)!
      const finding: SecurityFinding = {
        id: `${options.scanId}-AI-${rule.id}-${index + 1}`,
        ruleId: rule.id,
        title: item.title || rule.name,
        severity: rule.severity as Severity,
        category: rule.category as Category,
        file: item.file || 'desconhecido',
        lineStart: item.lineStart ?? 1,
        lineEnd: item.lineEnd ?? item.lineStart ?? 1,
        confidence: Math.max(0, Math.min(1, item.confidence ?? 0.7)),
        description: item.description || rule.description,
        exploitability: item.exploitability || '',
        impact: item.impact || '',
        evidence: [
          {
            kind: 'pattern',
            message: `Detectado pela auditoria IA (Groq · ${options.model ?? GROQ_DEFAULT_MODEL}) com base na regra ${rule.id}.`,
            snippet: item.snippet,
          },
        ],
        remediation:
          item.remediationExplanation || item.patch || item.testCode
            ? { explanation: item.remediationExplanation || 'Ver blueprint para a correcção detalhada.', patch: item.patch, testCode: item.testCode }
            : undefined,
        validation: item.validationCommand
          ? { command: item.validationCommand, expected: item.validationExpected || 'A vulnerabilidade deixa de ser reproduzível.' }
          : undefined,
        status: 'OPEN',
      }
      return finding
    })
}
