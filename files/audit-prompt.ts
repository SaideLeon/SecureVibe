import type { SourceFile } from '../types'
import { AI_RULESET, type RuleDef } from './ruleset'

const MAX_TOTAL_CHARS = 55_000
const MAX_FILE_CHARS = 8_000

// Ficheiros com maior probabilidade de conter vulnerabilidades reais entram primeiro
// no orçamento de contexto enviado à Groq.
const PRIORITY_HINTS = [
  /auth/i, /middleware/i, /\bapi\//i, /route\.(ts|js)/i, /payment/i, /pagamento/i,
  /webhook/i, /supabase/i, /jwt/i, /session/i, /admin/i, /upload/i, /\.env/i, /config/i, /otp/i,
]

function scoreFile(file: SourceFile): number {
  let score = 0
  for (const pattern of PRIORITY_HINTS) if (pattern.test(file.path)) score += 1
  return score
}

export function selectFilesForAudit(files: SourceFile[]): SourceFile[] {
  const sorted = [...files].sort((a, b) => scoreFile(b) - scoreFile(a))
  const selected: SourceFile[] = []
  let total = 0
  for (const file of sorted) {
    const trimmed = file.content.length > MAX_FILE_CHARS ? `${file.content.slice(0, MAX_FILE_CHARS)}\n/* ...truncado... */` : file.content
    if (total + trimmed.length > MAX_TOTAL_CHARS) continue
    selected.push({ path: file.path, content: trimmed })
    total += trimmed.length
  }
  return selected
}

function formatRuleset(rules: RuleDef[]): string {
  return rules.map((rule) => `- [${rule.id}] (${rule.severity}) ${rule.name}: ${rule.description}`).join('\n')
}

export function buildAuditSystemPrompt(): string {
  return [
    'Você é um auditor de segurança sénior especializado em aplicações "vibe coded" (Next.js, Supabase, APIs de IA).',
    'Analise o código fornecido EXCLUSIVAMENTE contra o catálogo de regras abaixo. Não invente regras novas nem IDs fora da lista.',
    'Reporte apenas vulnerabilidades reais e evidenciadas no código — nunca especule sem prova visível no snippet.',
    'Responda APENAS com um array JSON válido, sem markdown, sem comentários, sem texto antes ou depois do array.',
    'Cada item do array deve seguir exactamente este formato:',
    '{"ruleId":"R10","file":"caminho/exacto.ts","lineStart":12,"lineEnd":14,"title":"Título curto","description":"O que está errado e porquê é explorável","exploitability":"Como um atacante exploraria isto","impact":"Impacto potencial concreto","snippet":"trecho de código (máx. 5 linhas) que evidencia a falha","confidence":0.8,"remediationExplanation":"O que deve ser feito para corrigir","patch":"código de correcção completo (opcional)","testCode":"snippet de teste que prova a correcção (opcional)","validationCommand":"comando para correr o teste (opcional)","validationExpected":"resultado esperado do teste (opcional)"}',
    'Se não encontrar nenhuma vulnerabilidade real, responda apenas: []',
    '',
    'Catálogo de regras (use apenas estes IDs):',
    formatRuleset(AI_RULESET),
  ].join('\n')
}

export function buildAuditUserPrompt(files: SourceFile[], repoLabel: string): string {
  const selected = selectFilesForAudit(files)
  const filesBlock = selected.map((file) => `### Ficheiro: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``).join('\n\n')
  return [
    `Repositório: ${repoLabel}`,
    `Ficheiros analisados: ${selected.length} de ${files.length} recolhidos (os restantes foram omitidos por limite de contexto).`,
    '',
    filesBlock,
  ].join('\n')
}
