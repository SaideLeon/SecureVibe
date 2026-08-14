# 🔐 Blueprint de Correcção de Segurança — v2 (reauditoria)

**Projecto:** FateSkill (monorepo `apps/web` + `packages/cli` + `supabase/migrations`)
**Data da auditoria:** 2026-06-16 (reauditoria sobre as correcções da v1)
**Auditado por:** Claude Security Audit Skill v1.0

---

## Score de Segurança

| Métrica | Valor |
|---------|-------|
| Score actual | 70/100 |
| Score esperado após correcções | 100/100 |
| Vulnerabilidades CRÍTICO | 0 |
| Vulnerabilidades ALTO | 2 |
| Vulnerabilidades MÉDIO | 2 |
| **Resultado actual** | **APROVADO CONDICIONALMENTE** |

---

## Correcções da v1 já verificadas (não repetidas neste blueprint)

| Regra | Achado original | Verificação |
|-------|------------------|-------------|
| R15 | Upload sem autenticação | `apps/web/app/api/v1/uploads/skills/route.ts` agora exige `resolveApiUser` + scope `publish` + verifica `author_id` antes de gravar no Storage |
| R22 | RPCs de contadores sem grants | `supabase/migrations/0004_lock_counter_functions.sql` revoga `EXECUTE` de `anon`/`authenticated`, mantém só `service_role` |
| R06-b | Rate limit em memória inefectivo | `apps/web/lib/rate-limit.ts` devolve `503` em produção sem `UPSTASH_REDIS_REST_URL`/`TOKEN` |
| CTF-R09 | Sem CAPTCHA no magic-link | Turnstile integrado em `apps/web/lib/captcha.ts` + `apps/web/app/login/page.tsx` |
| R02 | Erro exposto no magic-link | Resposta genérica ao cliente; detalhe só em `console.error` |

---

## Índice de Vulnerabilidades Pendentes

| # | Regra | Severidade | Localização | Esforço | Status |
|---|-------|-----------|-------------|---------|--------|
| 1 | [R06-a](#r06-a-download-ainda-sem-rate-limit--alto) | ALTO | `apps/web/app/api/v1/skills/[name]/download/route.ts` | Baixo | Pendente |
| 2 | [R09](#r09-redirecionamento-aberto-no-callback-oauth--alto) | ALTO | `apps/web/app/auth/callback/route.ts`, `apps/web/app/login/page.tsx` | Baixo | Pendente |
| 3 | [R06-c](#r06-c-star-sem-rate-limit--médio) | MÉDIO | `apps/web/app/api/v1/skills/[name]/star/route.ts` | Baixo | Pendente |
| 4 | [R06-d](#r06-d-ordem-captcha-antes-do-rate-limit--médio) | MÉDIO | `apps/web/app/api/v1/auth/magic-link/route.ts` | Baixo | Pendente |

---

## [R06-a] Download ainda sem rate limit — ALTO

### Contexto

**O que existe actualmente:**

```ts
// apps/web/app/api/v1/skills/[name]/download/route.ts
export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const auth = await resolveApiUser(request).catch(() => null);
  const skill = await getSkillForViewer(name, auth?.userId ?? null);
  if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  const source = request.headers.get("user-agent")?.includes("fateskill-cli") ? "cli" : "api";
  await recordInstall(name, source, auth?.userId ?? null);
```

**Por que é explorável:** mesmo com R22 corrigido (a RPC já não é chamável directamente via PostgREST), este endpoint chama `recordInstall` → `increment_skill_downloads` através do cliente `service_role`, server-side, sem qualquer `enforceRateLimit`. Um simples `GET` repetido continua a inflacionar `downloads` indefinidamente, sem autenticação.

**Impacto potencial:** métricas de popularidade falsificadas, usadas em `sort=downloads` para decidir em que skills confiar.

---

### Implementação Passo a Passo

#### Passo 1 — Rate limit na contabilização, não no download

```ts
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const auth = await resolveApiUser(request).catch(() => null);
  const skill = await getSkillForViewer(name, auth?.userId ?? null);
  if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

  // R06-a: limitar a CONTABILIZAÇÃO por identidade/IP, nunca o download em si.
  const identifier = auth?.userId ?? undefined;
  const limited = await enforceRateLimit(request, "default", identifier ? `download:${identifier}:${name}` : `download:${name}`);
  if (!limited) {
    const source = request.headers.get("user-agent")?.includes("fateskill-cli") ? "cli" : "api";
    await recordInstall(name, source, auth?.userId ?? null);
  }
  // O ficheiro continua a ser servido sempre, independentemente do limite acima.

  if (skill.download_url.startsWith("http")) return NextResponse.redirect(skill.download_url);
  // ...
}
```

---

### Teste de Validação

```ts
describe("R06-a — contabilização de download é limitada", () => {
  it("conta no máximo 1 download por janela/IP, mas continua a servir o ficheiro em todos os pedidos", async () => {
    // 20 GETs seguidos do mesmo IP a /api/v1/skills/fofa-tabela-docx/download
    // esperado: todos devolvem 200/redirect; increment_skill_downloads só é invocado 1x
  });
});
```

**Resultado esperado:** o download nunca falha por causa do rate limit; só a contagem fica protegida.

---

### Checklist de Deploy

- [ ] `enforceRateLimit` adicionado antes de `recordInstall` em `/download`
- [ ] Confirmar que o ficheiro continua acessível mesmo acima do limite
- [ ] Testes de segurança a passar

---

## [R09] Redirecionamento aberto no callback OAuth — ALTO

### Contexto

**O que existe actualmente:**

```ts
// apps/web/app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  if (code) {
    const supabase = await getSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
```

```ts
// apps/web/app/login/page.tsx
const redirect = searchParams.get("redirect") ?? "/dashboard";
// ...
options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` }
```

**Por que é explorável:** `redirect` vem da query string sem qualquer validação e é concatenado por string (não resolvido como URL) para formar o destino final. Um link `/login?redirect=@evil.com/phish` produz `${origin}@evil.com/phish`, isto é `https://fateskill.vercel.app@evil.com/phish` — vários navegadores interpretam tudo antes do `@` como *userinfo* e `evil.com` como o **host real** de destino. O `redirectTo` enviado ao Supabase (`/auth/callback?redirect=...`) passa a validação de allow-list do Supabase porque o *path* (`/auth/callback`) é legítimo — o payload malicioso está escondido na query string, que o Supabase não inspecciona, e é o próprio código da app que faz a concatenação insegura depois da troca de código por sessão.

**Impacto potencial:** a vítima conclui um login GitHub OAuth genuíno (sessão real criada no domínio legítimo) e, imediatamente depois, é silenciosamente enviada para `evil.com` — um vector de phishing particularmente convincente porque ocorre **depois** de uma autenticação real e bem-sucedida.

---

### Arquitectura da Correcção

```
Antes:  origin + redirect (concatenação de strings) ──▶ pode escapar para outro host
Depois: new URL(redirect, origin) ──▶ resolução de URL real
        resolved.origin === origin ? aceitar : usar "/dashboard"
```

---

### Implementação Passo a Passo

#### Passo 1 — Função utilitária de validação de redirecionamento interno

```ts
// apps/web/lib/safe-redirect.ts

/**
 * R09: nunca confiar num parâmetro de redirect do cliente sem validação
 * server-side. Resolve sempre como URL real (nunca concatenação de string)
 * e rejeita qualquer destino que não seja exactamente o mesmo origin.
 */
export function resolveSafeRedirect(rawRedirect: string | null, origin: string, fallback = "/dashboard"): string {
  if (!rawRedirect) return fallback;

  try {
    const resolved = new URL(rawRedirect, origin);
    if (resolved.origin !== origin) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
```

#### Passo 2 — Usar a função no callback (ponto de aplicação real)

```ts
// apps/web/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { resolveSafeRedirect } from "@/lib/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const safePath = resolveSafeRedirect(searchParams.get("redirect"), origin);

  if (code) {
    const supabase = await getSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${safePath}`);
}
```

#### Passo 3 — Defesa em profundidade na página de login

```ts
// apps/web/app/login/page.tsx
import { resolveSafeRedirect } from "@/lib/safe-redirect";

// dentro do componente:
const redirect = resolveSafeRedirect(searchParams.get("redirect"), window.location.origin);
```

---

### Teste de Validação

```ts
// apps/web/lib/safe-redirect.test.ts
import { describe, it, expect } from "vitest";
import { resolveSafeRedirect } from "./safe-redirect";

describe("R09 — resolveSafeRedirect rejeita destinos externos", () => {
  const origin = "https://fateskill.vercel.app";

  it("aceita caminhos internos normais", () => {
    expect(resolveSafeRedirect("/dashboard", origin)).toBe("/dashboard");
  });

  it("rejeita payload de userinfo confusion (@evil.com)", () => {
    expect(resolveSafeRedirect("@evil.com/phish", origin)).toBe("/dashboard");
  });

  it("rejeita URL absoluta para outro host", () => {
    expect(resolveSafeRedirect("https://evil.com", origin)).toBe("/dashboard");
  });

  it("rejeita protocol-relative URL (//evil.com)", () => {
    expect(resolveSafeRedirect("//evil.com", origin)).toBe("/dashboard");
  });
});
```

**Resultado esperado:** qualquer valor de `redirect` que resolva para um `origin` diferente do esperado cai sempre no fallback `/dashboard`.

---

### Checklist de Deploy

- [ ] `lib/safe-redirect.ts` criado e usado em `auth/callback/route.ts`
- [ ] Mesma validação aplicada em `login/page.tsx` (defesa em profundidade)
- [ ] Testes cobrindo `@host`, `//host`, `https://host` e caminhos internos válidos
- [ ] Revisão de código por par antes do merge

---

## [R06-c] `/star` sem rate limit — MÉDIO

### Contexto

**O que existe actualmente:**

```ts
// apps/web/app/api/v1/skills/[name]/star/route.ts
export async function POST(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const auth = await resolveApiUser(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
```

**Por que é explorável:** todas as outras rotas GET públicas já têm `enforceRateLimit("default")` aplicado nesta segunda ronda de correcções — esta ficou de fora. Exige autenticação, mas continua sem fricção contra abuso de recursos.

---

### Implementação Passo a Passo

```ts
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const auth = await resolveApiUser(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const limited = await enforceRateLimit(request, "default", auth.userId);
  if (limited) return limited;
  // ... resto do handler inalterado
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const auth = await resolveApiUser(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const limited = await enforceRateLimit(request, "default", auth.userId);
  if (limited) return limited;
  // ... resto do handler inalterado
}
```

---

### Teste de Validação

```ts
describe("R06-c — /star é limitado por utilizador", () => {
  it("devolve 429 depois de exceder o limite default do mesmo utilizador", async () => {
    // 61 POST/DELETE alternados do mesmo auth.userId → última devolve 429
  });
});
```

---

### Checklist de Deploy

- [ ] `enforceRateLimit("default", auth.userId)` adicionado a `POST` e `DELETE` em `/star`
- [ ] Testes de segurança a passar

---

## [R06-d] Ordem: CAPTCHA antes do rate limit — MÉDIO

### Contexto

**O que existe actualmente:**

```ts
// apps/web/app/api/v1/auth/magic-link/route.ts
if (!(await verifyCaptcha(typeof captchaToken === "string" ? captchaToken : undefined))) {
  return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 });
}
const limited = await enforceRateLimit(request, "auth", email.toLowerCase());
```

**Por que é explorável:** `verifyCaptcha` pode fazer uma chamada de rede a `challenges.cloudflare.com` antes de qualquer rate limit da própria aplicação ser aplicado. Um atacante a enviar muitos pedidos com um `captchaToken` inválido-mas-presente provoca chamadas repetidas ao Turnstile sem nenhuma fricção da app.

---

### Implementação Passo a Passo

#### Passo 1 — Aplicar um rate limit leve por IP antes do CAPTCHA

```ts
// apps/web/app/api/v1/auth/magic-link/route.ts
export async function POST(request: NextRequest) {
  const { email, redirectTo, captchaToken } = await request.json().catch(() => ({}));
  if (typeof email !== "string" || email.length > 254) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  // R06-d: limitar por IP ANTES de gastar uma chamada de rede no CAPTCHA.
  const ipLimited = await enforceRateLimit(request, "default");
  if (ipLimited) return ipLimited;

  if (!(await verifyCaptcha(typeof captchaToken === "string" ? captchaToken : undefined))) {
    return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 });
  }

  // Limite mais estrito por email, depois do captcha passar.
  const limited = await enforceRateLimit(request, "auth", email.toLowerCase());
  if (limited) return limited;
  // ... resto inalterado
}
```

---

### Teste de Validação

```ts
describe("R06-d — rate limit por IP corre antes do CAPTCHA", () => {
  it("devolve 429 sem chamar verifyCaptcha quando o limite default do IP é excedido", async () => {
    // mockar verifyCaptcha com um spy; exceder o limite "default" por IP;
    // esperado: 429 e verifyCaptcha nunca foi chamado
  });
});
```

---

### Checklist de Deploy

- [ ] Rate limit por IP (`"default"`) adicionado antes da chamada a `verifyCaptcha`
- [ ] Confirmar que utilizadores legítimos não são afectados em uso normal
- [ ] Testes de segurança a passar

---

## Checklist Global Pré-Deploy

### Obrigatório (ALTO)
- [ ] R06-a — Contabilização de download limitada por IP/utilizador
- [ ] R09 — `resolveSafeRedirect` aplicado em `auth/callback` e `login/page.tsx`
- [ ] Suite de testes de segurança a passar integralmente

### Recomendado (MÉDIO)
- [ ] R06-c — Rate limit adicionado a `/star`
- [ ] R06-d — Rate limit por IP antes do CAPTCHA no magic-link

---

## Referências e Recursos

| Recurso | Descrição |
|---------|-----------|
| [OWASP — Unvalidated Redirects and Forwards](https://owasp.org/www-community/attacks/Unvalidated_Redirects_and_Forwards) | Contexto e exemplos de open redirect |
| [WHATWG URL Standard](https://url.spec.whatwg.org/) | Regras de resolução de URL relativa (base do fix R09) |
| [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/) | Configuração e verificação server-side |
| [Upstash Redis REST API](https://upstash.com/docs/redis/features/restapi) | Rate limiting distribuído |

---

_Blueprint gerado automaticamente pela Security Audit Skill v1.0 — reauditoria sobre correcções da v1_
