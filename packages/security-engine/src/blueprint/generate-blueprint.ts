import type { SecurityFinding, Severity } from '@securevibe/shared/types'

const SEVERITY_WEIGHT: Record<Severity, number> = { CRITICAL: 25, HIGH: 10, MEDIUM: 5, LOW: 2 }
const EFFORT_BY_SEVERITY: Record<Severity, string> = { CRITICAL: 'Alto', HIGH: 'Médio', MEDIUM: 'Baixo', LOW: 'Baixo' }

export type BlueprintMeta = { projectName: string; scanId: string; generatedAt: string; sourceLabel: string }

function computeScore(findings: SecurityFinding[]) {
  const active = findings.filter((f) => f.status !== 'FIXED' && f.status !== 'FALSE_POSITIVE')
  const penalty = active.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0)
  const score = Math.max(0, 100 - penalty)
  const counts: Record<Severity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  for (const f of active) counts[f.severity] += 1

  let result = 'APROVADO COM DISTINÇÃO'
  if (counts.CRITICAL > 0 || score < 70) result = 'REPROVADO — não apto para produção'
  else if (counts.HIGH > 0) result = 'APROVADO CONDICIONALMENTE'
  else if (counts.MEDIUM > 0) result = 'APROVADO COM RESSALVAS'

  return { score, counts, result }
}

export function generateBlueprintMarkdown(findings: SecurityFinding[], meta: BlueprintMeta): string {
  const ordered = [...findings].sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity])
  const { score, counts, result } = computeScore(findings)

  const indexTable = ordered
    .map((f, i) => `| ${i + 1} | [${f.ruleId}] ${f.title} | ${f.severity} | ${f.file}:${f.lineStart} | ${EFFORT_BY_SEVERITY[f.severity]} | Aberto |`)
    .join('\n')

  const sections = ordered
    .map((f) => {
      const proof = f.evidence[0]?.snippet ? `**Prova:**\n\n\`\`\`\n${f.evidence[0].snippet}\n\`\`\`\n` : ''
      const patchBlock = f.remediation?.patch ? `### Implementação da Correcção\n\n\`\`\`\n${f.remediation.patch}\n\`\`\`\n` : ''
      const testBlock = f.remediation?.testCode
        ? [
            '### Teste de Validação',
            '',
            '```',
            f.remediation.testCode,
            '```',
            '',
            `**Comando:** \`${f.validation?.command ?? 'npm test'}\``,
            `**Resultado esperado:** ${f.validation?.expected ?? 'A vulnerabilidade deixa de ser reproduzível.'}`,
            '',
          ].join('\n')
        : ''

      return [
        `## [${f.ruleId}] ${f.title} — ${f.severity}`,
        '',
        `**Localização:** \`${f.file}\` : linha ${f.lineStart}${f.lineEnd !== f.lineStart ? `–${f.lineEnd}` : ''}`,
        '',
        '### Contexto',
        '',
        `**Problema:** ${f.description}`,
        '',
        `**Por que é explorável:** ${f.exploitability || 'Ver descrição acima.'}`,
        '',
        `**Impacto potencial:** ${f.impact || 'Não especificado.'}`,
        '',
        proof,
        f.remediation?.explanation ? `### Correcção Recomendada\n\n${f.remediation.explanation}\n` : '',
        patchBlock,
        testBlock,
        '### Checklist de Deploy',
        '',
        `- [ ] Correcção de ${f.ruleId} implementada`,
        '- [ ] Teste de segurança correspondente a passar',
        '- [ ] Revisão de código por par antes do merge',
        '',
        '---',
        '',
      ].join('\n')
    })
    .join('\n')

  return [
    `# 🔐 Security Blueprint — ${meta.projectName}`,
    '',
    `**Fonte:** ${meta.sourceLabel}`,
    `**Scan ID:** ${meta.scanId}`,
    `**Gerado em:** ${meta.generatedAt}`,
    '**Motor:** Motor estático SecureVibe + Auditoria IA (Gemini · models/gemini-3.7-flash)',
    '',
    '---',
    '',
    '## Score de Segurança',
    '',
    '| Métrica | Valor |',
    '|---------|-------|',
    `| Score actual | ${score}/100 |`,
    '| Score esperado após correcções | 100/100 |',
    `| Vulnerabilidades CRÍTICO | ${counts.CRITICAL} |`,
    `| Vulnerabilidades ALTO | ${counts.HIGH} |`,
    `| Vulnerabilidades MÉDIO | ${counts.MEDIUM} |`,
    `| **Resultado actual** | **${result}** |`,
    '',
    '---',
    '',
    '## Índice de Vulnerabilidades',
    '',
    '| # | Regra | Severidade | Localização | Esforço | Status |',
    '|---|-------|-----------|-------------|---------|--------|',
    indexTable || '| - | Nenhuma vulnerabilidade encontrada | - | - | - | - |',
    '',
    '---',
    '',
    sections || '_Nenhuma vulnerabilidade detectada nesta análise._',
    '## Checklist Global Pré-Deploy',
    '',
    '### Obrigatório (CRÍTICO e ALTO)',
    '- [ ] Todos os CRÍTICO corrigidos e testados',
    '- [ ] Todos os ALTO corrigidos e testados',
    '- [ ] Variáveis de ambiente auditadas — nenhum secret no código',
    '- [ ] RLS configurado e testado (se usar Supabase/PostgreSQL)',
    '- [ ] Rate limiting activo em endpoints de autenticação',
    '',
    '### Recomendado (MÉDIO e Boas Práticas)',
    '- [ ] Falhas MÉDIO endereçadas ou agendadas',
    '- [ ] Testes de segurança automatizados (R23)',
    '- [ ] IA usada como atacante durante o desenvolvimento (R25)',
    '',
    '---',
    '',
    '_Blueprint gerado automaticamente pelo motor SecureVibe (estático + IA via Gemini)._',
  ].join('\n')
}
