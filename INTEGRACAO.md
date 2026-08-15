# Integração — Auditoria via GitHub + Gemini (models/gemini-3.7-flash)

## 1. Onde colocar cada ficheiro

Copia estes ficheiros para o teu repositório `SaideLeon/SecureVibe`, exactamente nestes caminhos (substituem/estendem o que já existe):

```
package.json                                              (actualizado — adiciona @google/genai)
.env.example                                               (novo)
packages/shared/src/types.ts                                (actualizado — novas categorias)
packages/security-engine/src/ai/ruleset.ts                  (novo — catálogo R01-R25 + CTF-R01-11)
packages/security-engine/src/ai/gemini-client.ts            (novo — cliente Gemini, modelo fixo)
packages/security-engine/src/ai/audit-prompt.ts             (novo — prompt da auditoria)
packages/security-engine/src/ai/run-ai-audit.ts             (novo — orquestra Gemini → findings)
packages/security-engine/src/github/fetch-repo.ts           (novo — leitura do GitHub)
packages/security-engine/src/blueprint/generate-blueprint.ts(novo — gera o .md do blueprint)
apps/web/app/api/scans/route.ts                              (novo — endpoint principal)
apps/web/app/api/scans/blueprint/route.ts                    (novo — gera blueprint sob pedido)
apps/web/app/scan/page.tsx                                   (novo — UI de análise)
```

## 2. Instalar e configurar

```bash
npm install
```

No `.env.local` (e nas Environment Variables da Vercel):

```
GEMINI_API_KEY=AIza_xxx
```

Não é preciso `GITHUB_TOKEN` global — o utilizador cola o token dele no formulário `/scan` só quando o repositório é privado; nunca fica guardado (é usado apenas dentro da própria requisição).

## 3. Como o fluxo funciona

1. O utilizador cola `https://github.com/owner/repo` (ou `owner/repo`, ou um link `.../tree/branch/subpasta`) e, opcionalmente, um PAT do GitHub.
2. `fetch-repo.ts` resolve o branch por omissão, lista a árvore completa (`git/trees?recursive=1`) e descarrega até 80 ficheiros de código relevantes (ignora `node_modules`, `.next`, lockfiles, binários, ficheiros >200KB).
3. `runSecurityScan` (motor estático já existente, hoje só com R09-Open-Redirect) corre sobre esses ficheiros.
4. `run-ai-audit.ts` envia os ficheiros mais sensíveis (auth, middleware, pagamentos, Supabase, uploads, OTP — priorizados por `audit-prompt.ts`, com corte em ~55k caracteres para caber no contexto) para a Gemini, com o catálogo completo R01–R25 + CTF-R01–11 no prompt de sistema, Google Search activo e o modelo **fixo em `models/gemini-3.7-flash`** (`gemini-client.ts`).
5. As duas listas de findings são combinadas, o score é recalculado (`calculateSecurityScore` já existente), e tudo é devolvido ao browser.
6. O botão "Descarregar Blueprint" chama `/api/scans/blueprint`, que gera o `.md` completo (contexto, prova, correcção, teste, checklist) por vulnerabilidade — mesma estrutura do `blueprint-template.md` que enviaste.

## 4. Nota sobre colisão de IDs

O motor estático actual usa o id `"R09"` para **Open Redirect**. O catálogo completo (usado na auditoria IA) define `R09` como **"Validação server-side obrigatória"** — são regras diferentes com o mesmo número, herdadas de dois sistemas de numeração distintos. Não alterei o motor estático existente para não quebrar nada, mas no relatório/UI cada finding mostra a sua própria descrição, por isso não há ambiguidade prática. Se quiseres, no próximo passo posso renomear a regra estática para um prefixo próprio (ex.: `SVE-R09`) para eliminar de vez a sobreposição.

## 5. Limitações conhecidas do MVP

- Repositórios muito grandes: só os ficheiros mais "suspeitos" (por nome de caminho) entram na análise IA; o resto fica só no motor estático. O aviso "`X de Y ficheiros analisados`" aparece na resposta.
- Sem persistência: o resultado do scan vive só na memória do browser durante a sessão; recarregar a página perde os findings (o blueprint tem de ser descarregado antes de sair). Se quiseres histórico de scans, o próximo passo natural é uma tabela Supabase `scans` + `findings`, seguindo o mesmo padrão que já usas no Muneri/QueliMercado.
- `@google/genai` na versão declarada no `package.json` — ajusta se a Google já tiver publicado uma major mais recente.
