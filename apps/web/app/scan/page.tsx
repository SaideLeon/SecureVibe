'use client'

import { useState } from 'react'
import type { SecurityFinding, Severity } from '@securevibe/shared/types'

type ScanResult = {
  scanId: string
  repo: string
  filesAnalyzed: number
  model: string
  aiError?: string
  score: number
  counts: Record<Severity, number>
  findings: SecurityFinding[]
}

const severityOrder: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const inputStyle = {
  padding: '0.75rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(103,232,249,0.4)',
  background: 'transparent',
  color: 'inherit',
}

export default function ScanPage() {
  const [repoUrl, setRepoUrl] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [downloading, setDownloading] = useState(false)

  async function handleScan() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, githubToken: githubToken || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao analisar o repositório.')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadBlueprint() {
    if (!result) return
    setDownloading(true)
    try {
      const res = await fetch('/api/scans/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findings: result.findings, projectName: result.repo, scanId: result.scanId, repoLabel: result.repo }),
      })
      const data = await res.json()
      const blob = new Blob([data.markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security-blueprint-${result.scanId}.md`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <main className="shell">
      <nav className="topbar">
        <div className="brand">SecureVibe</div>
        <a className="primary-link" href="/">Voltar</a>
      </nav>

      <section className="panel">
        <h2>Analisar repositório GitHub</h2>
        <p className="muted">
          Cole o URL do repositório (ou <code>owner/repo</code>). Para repositórios privados, forneça um Personal
          Access Token com âmbito <code>repo</code> — o token é usado apenas nesta requisição e nunca é guardado.
        </p>

        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '40rem' }}>
          <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/owner/repo" style={inputStyle} />
          <input
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="GitHub token (opcional, para repos privados)"
            type="password"
            style={inputStyle}
          />
          <button className="primary-button" onClick={handleScan} disabled={loading || !repoUrl}>
            {loading ? 'A analisar…' : 'Analisar com IA (Gemini · 3.7 Flash)'}
          </button>
        </div>

        {error && <p style={{ color: '#fda4af', marginTop: '1rem' }}>{error}</p>}
      </section>

      {result && (
        <section className="panel">
          <h2>Resultado — {result.repo}</h2>
          <p className="muted">
            {result.filesAnalyzed} ficheiros analisados · modelo IA: {result.model}
          </p>
          {result.aiError && (
            <p style={{ color: '#fdba74' }}>
              Aviso: a auditoria por IA falhou parcialmente ({result.aiError}). Os resultados abaixo incluem apenas o motor estático.
            </p>
          )}

          <div className="score">
            <span>{result.score}</span>
            <small>/ 100</small>
          </div>

          <div className="severity-grid">
            {severityOrder.map((severity) => (
              <div key={severity} className="severity-row">
                <span>{severity.toLowerCase()}</span>
                <strong>{result.counts[severity] ?? 0}</strong>
              </div>
            ))}
          </div>

          <button className="primary-button" style={{ marginTop: '1.5rem' }} onClick={handleDownloadBlueprint} disabled={downloading}>
            {downloading ? 'A gerar…' : 'Descarregar Blueprint (.md)'}
          </button>

          <div style={{ marginTop: '2rem' }}>
            {result.findings.map((finding) => (
              <article key={finding.id} className="finding">
                <div className="severity">{finding.severity}</div>
                <h3>
                  {finding.ruleId} — {finding.title}
                </h3>
                <p className="muted">
                  {finding.file}: linha {finding.lineStart}
                </p>
                <p>{finding.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
