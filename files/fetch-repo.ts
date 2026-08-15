import type { SourceFile } from '../types'

export type GithubRepoRef = { owner: string; repo: string; branch?: string; subpath?: string }

const CODE_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs|py|rb|go|php|java|sql|json|yaml|yml|prisma)$/i
const IGNORED_PATH = /(^|\/)(node_modules|\.git|\.next|dist|build|coverage|\.turbo|\.vercel|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)(\/|$)/i
const MAX_FILE_BYTES = 200_000
const MAX_FILES = 80

export function parseGithubUrl(input: string): GithubRepoRef {
  const cleaned = input.trim().replace(/\.git$/, '')

  const shortMatch = cleaned.match(/^([\w.-]+)\/([\w.-]+)$/)
  if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] }

  const url = new URL(cleaned.startsWith('http') ? cleaned : `https://github.com/${cleaned}`)
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length < 2) throw new Error('URL de repositório GitHub inválido.')

  const [owner, repo] = parts
  let branch: string | undefined
  let subpath: string | undefined
  if (parts[2] === 'tree' && parts[3]) {
    branch = parts[3]
    subpath = parts.slice(4).join('/') || undefined
  }
  return { owner, repo: repo.replace(/\.git$/, ''), branch, subpath }
}

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } : { Accept: 'application/vnd.github+json' }
}

async function getDefaultBranch(ref: GithubRepoRef, token?: string): Promise<string> {
  if (ref.branch) return ref.branch
  const res = await fetch(`https://api.github.com/repos/${ref.owner}/${ref.repo}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(`Não foi possível aceder ao repositório (HTTP ${res.status}). Verifique o URL e, se for privado, o token.`)
  const data = await res.json()
  return data.default_branch as string
}

type GitTreeItem = { path: string; type: 'blob' | 'tree'; size?: number; sha: string }

async function getTree(ref: GithubRepoRef, branch: string, token?: string): Promise<GitTreeItem[]> {
  const res = await fetch(`https://api.github.com/repos/${ref.owner}/${ref.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`Não foi possível listar os ficheiros do repositório (HTTP ${res.status}).`)
  const data = await res.json()
  return (data.tree ?? []) as GitTreeItem[]
}

async function fetchFileContent(ref: GithubRepoRef, branch: string, path: string, token?: string): Promise<string> {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const res = await fetch(`https://api.github.com/repos/${ref.owner}/${ref.repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), Accept: 'application/vnd.github.raw' },
  })
  if (!res.ok) return ''
  return res.text()
}

export async function fetchGithubRepoFiles(
  input: string,
  token?: string
): Promise<{ ref: GithubRepoRef; branch: string; files: SourceFile[] }> {
  const ref = parseGithubUrl(input)
  const branch = await getDefaultBranch(ref, token)
  const tree = await getTree(ref, branch, token)

  const candidates = tree
    .filter((item) => item.type === 'blob')
    .filter((item) => !IGNORED_PATH.test(item.path))
    .filter((item) => CODE_EXTENSIONS.test(item.path) || /^\.env/.test(item.path.split('/').pop() ?? ''))
    .filter((item) => (item.size ?? 0) <= MAX_FILE_BYTES)
    .filter((item) => (ref.subpath ? item.path.startsWith(ref.subpath) : true))
    .slice(0, MAX_FILES)

  const files: SourceFile[] = []
  for (const item of candidates) {
    const content = await fetchFileContent(ref, branch, item.path, token)
    if (content) files.push({ path: item.path, content })
  }

  return { ref, branch, files }
}
