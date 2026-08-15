import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateBlueprintMarkdown } from '@securevibe/security-engine/blueprint/generate-blueprint'
import type { SecurityFinding } from '@securevibe/shared/types'

export const runtime = 'nodejs'

const findingSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  title: z.string(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  category: z.string(),
  file: z.string(),
  lineStart: z.number(),
  lineEnd: z.number(),
  confidence: z.number(),
  description: z.string(),
  exploitability: z.string(),
  impact: z.string(),
  evidence: z.array(
    z.object({
      kind: z.enum(['pattern', 'ast', 'config', 'test']),
      message: z.string(),
      snippet: z.string().optional(),
    })
  ),
  remediation: z
    .object({
      explanation: z.string(),
      patch: z.string().optional(),
      testCode: z.string().optional(),
    })
    .optional(),
  validation: z
    .object({
      command: z.string(),
      expected: z.string(),
    })
    .optional(),
  status: z.enum(['OPEN', 'FIX_GENERATED', 'FIX_APPLIED', 'TESTING', 'FIXED', 'FALSE_POSITIVE']),
})

const bodySchema = z.object({
  findings: z.array(findingSchema),
  projectName: z.string().min(1),
  scanId: z.string().min(1),
  repoLabel: z.string().min(1),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Pedido inválido.' }, { status: 400 })
  }

  const markdown = generateBlueprintMarkdown(parsed.data.findings as SecurityFinding[], {
    projectName: parsed.data.projectName,
    scanId: parsed.data.scanId,
    generatedAt: new Date().toISOString(),
    sourceLabel: parsed.data.repoLabel,
  })

  return NextResponse.json({ markdown })
}
