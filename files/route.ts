import { NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateSecurityScore, runSecurityScan } from '@securevibe/security-engine'
import { fetchGithubRepoFiles } from '@securevibe/security-engine/github/fetch-repo'
import { runAiSecurityAudit } from '@securevibe/security-engine/ai/run-ai-audit'
import { GROQ_DEFAULT_MODEL } from '@securevibe/security-engine/ai/groq-client'
import type { Severity } from '@securevibe/shared/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const bodySchema = z.object({
  repoUrl: z.string().min(3, 'Indique um URL de repositório GitHub ou "owner/repo".'),
  githubToken: z.string().optional(),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Pedido inválido.' }, { status: 400 })
  }

  const { repoUrl, githubToken } = parsed.data
  const scanId = `scan_${Date.now().toString(36)}`

  let repoData: Awaited<ReturnType<typeof fetchGithubRepoFiles>>
  try {
    repoData = await fetchGithubRepoFiles(repoUrl, githubToken)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao aceder ao repositório GitHub.' }, { status: 422 })
  }

  if (repoData.files.length === 0) {
    return NextResponse.json({ error: 'Nenhum ficheiro de código elegível foi encontrado no repositório indicado.' }, { status: 422 })
  }

  const repoLabel = `${repoData.ref.owner}/${repoData.ref.repo}@${repoData.branch}`
  const staticFindings = runSecurityScan({ scanId, files: repoData.files })

  let aiFindings: Awaited<ReturnType<typeof runAiSecurityAudit>> = []
  let aiError: string | undefined
  try {
    aiFindings = await runAiSecurityAudit(repoData.files, { scanId, repoLabel, model: GROQ_DEFAULT_MODEL })
  } catch (error) {
    aiError = error instanceof Error ? error.message : 'Falha na auditoria por IA.'
  }

  const findings = [...staticFindings, ...aiFindings]
  const score = calculateSecurityScore(findings)
  const counts = findings.reduce<Record<Severity, number>>(
    (acc, f) => ({ ...acc, [f.severity]: acc[f.severity] + 1 }),
    { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  )

  return NextResponse.json({
    scanId,
    status: 'completed',
    repo: repoLabel,
    filesAnalyzed: repoData.files.length,
    model: GROQ_DEFAULT_MODEL,
    aiError,
    ...score,
    counts,
    findings,
  })
}
