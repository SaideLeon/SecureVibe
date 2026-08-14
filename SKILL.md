---
name: security-audit
description: >
  Auditoria completa de segurança de código de repositórios. Use esta skill SEMPRE que o
  utilizador enviar código, colar trechos de ficheiros, mencionar um repositório, ou pedir
  para "analisar", "verificar", "auditar", "revisar segurança", "testar vulnerabilidades" ou
  "checar o código". Também activa quando o utilizador mencionar JWT, autenticação, API,
  banco de dados, upload, race condition, RLS, rate limiting, ou qualquer conceito de
  segurança em contexto de código. Não espere a palavra "segurança" — se há código,
  analise. A skill realiza três etapas em sequência: (1) detecta todas as vulnerabilidades
  presentes, classificadas por severidade CRÍTICO / ALTO / MÉDIO; (2) gera um relatório
  executivo com score de segurança e resumo das correcções necessárias; (3) produz um
  blueprint detalhado em .md com a arquitectura completa de correcção, pronto para o
  programador implementar.
---

# Security Audit Skill

Auditoria de segurança de código baseada nas regras do CTF Report e da Plataforma de Análise de Segurança de Código. Segue um fluxo rígido de três fases, sempre executadas em ordem.

---

## Fase 0 — Colecta de Contexto

Antes de auditar, leia **references/ruleset.md** para ter o catálogo completo de regras R01–R25. Carregue-o uma vez e mantenha em contexto.

Se o utilizador enviou:
- **Ficheiros / trechos colados** → audite directamente.
- **Nome de repositório GitHub** → solicite que cole os ficheiros críticos (ex.: rotas de autenticação, middlewares, queries de BD, código de pagamento). Não peça mais do que o necessário.
- **Descrição verbal** → trate como contexto parcial e sinalize quais áreas precisam de código para auditoria completa.

---

## Fase 1 — Detecção de Vulnerabilidades

Analise cada bloco de código contra o catálogo R01–R25. Para cada vulnerabilidade encontrada, preencha internamente a estrutura:

```
REGRA: R<XX>
SEVERIDADE: CRÍTICO | ALTO | MÉDIO
FICHEIRO/FUNÇÃO: <localização exacta>
DESCRIÇÃO: O que está errado e por quê é explorável.
PROVA: Trecho de código que evidencia a falha (máx. 5 linhas).
```

Regras de detecção obrigatórias por categoria:

### Autenticação e Credenciais (R01–R05)
- [ ] Passwords com MD5/SHA-1 → R01 CRÍTICO
- [ ] Mensagens "e-mail não encontrado" / "senha errada" → R02 ALTO
- [ ] Secrets/API keys no código-fonte ou .env commitado → R03 CRÍTICO
- [ ] Sistema de autenticação manual em vez de biblioteca → R04 ALTO
- [ ] JWT sem mecanismo de revogação → R05 ALTO

### Rate Limiting e Abuso (R06–R08)
- [ ] Endpoints de login/OTP sem rate limit → R06 ALTO
- [ ] Campos sem limite de tamanho server-side → R07 ALTO
- [ ] Operações financeiras/críticas sem transacção atómica → R08 CRÍTICO

### Validação de Dados (R09–R14)
- [ ] Validação apenas no front-end → R09 CRÍTICO
- [ ] Queries SQL construídas por concatenação → R10 CRÍTICO
- [ ] Conteúdo de utilizador renderizado sem escape → R11 ALTO
- [ ] Upload sem validação de MIME Type + Magic Bytes → R12 ALTO
- [ ] URLs externas aceites em campos de imagem → R13 MÉDIO
- [ ] URLs sem limite de tamanho → R14 MÉDIO

### Controlo de Acesso (R15–R18)
- [ ] Operações em recursos sem verificar propriedade → R15 CRÍTICO
- [ ] Regras de acesso implícitas ou ausentes → R16 ALTO
- [ ] RLS desactivado ou permissivo → R17 CRÍTICO
- [ ] API aceita campos sensíveis do body sem whitelist → R18 ALTO

### Lógica de Negócio (R19–R21)
- [ ] Operações financeiras sem ACID → R19 CRÍTICO
- [ ] Reembolso/saque sem verificação de pré-condições → R20 ALTO
- [ ] Sem detecção automática de fraude → R21 ALTO

### Práticas de Desenvolvimento (R22–R25)
- [ ] Camadas interdependentes (quebra de defesa em profundidade) → R22 CRÍTICO
- [ ] Sem testes de segurança automatizados → R23 ALTO
- [ ] Requisitos de segurança ausentes no prompt da IA → R24 ALTO
- [ ] Sem uso de IA para testar o próprio sistema → R25 MÉDIO

**Regras adicionais do CTF (CTF-R01–CTF-R11)** — ver **references/ruleset.md** secção CTF.

---

## Fase 2 — Relatório Executivo

Apresente ao utilizador o relatório na seguinte estrutura (em Markdown no chat):

```
## 🔐 Relatório de Segurança

### Score de Segurança: XX/100

| Severidade | Qtd | Desconto |
|------------|-----|----------|
| CRÍTICO    |  N  | N × 25   |
| ALTO       |  N  | N × 10   |
| MÉDIO      |  N  | N × 5    |

**Resultado:** APROVADO COM DISTINÇÃO | APROVADO COM RESSALVAS |
              APROVADO CONDICIONALMENTE | REPROVADO

---

### Vulnerabilidades Encontradas

#### 🔴 CRÍTICO — [R<XX>] Nome da Regra
**Localização:** ficheiro.ts : função()
**Problema:** Descrição clara do que está errado.
**Prova:**
\```lang
trecho de código
\```
**Correcção resumida:** O que deve ser feito (2–3 linhas).

#### 🟠 ALTO — [R<XX>] Nome da Regra
...

#### 🟡 MÉDIO — [R<XX>] Nome da Regra
...

---

### Resumo de Acções

| Prioridade | Acção | Regra |
|------------|-------|-------|
| Imediata   | ...   | R<XX> |
| Antes do deploy | ... | R<XX> |
| Próximo ciclo | ... | R<XX> |
```

Após o relatório no chat, anuncie:
> "A gerar o blueprint de arquitectura de correcção em .md…"

---

## Fase 3 — Blueprint de Correcção (.md)

Gere o ficheiro `/mnt/user-data/outputs/security-blueprint.md` seguindo **rigorosamente** o template em **references/blueprint-template.md**.

O blueprint deve conter **para cada vulnerabilidade encontrada**:

1. **Contexto** — o que existe actualmente e por que é inseguro.
2. **Arquitectura da correcção** — diagrama textual (ASCII ou Mermaid) do fluxo corrigido quando relevante.
3. **Implementação passo a passo** — código completo e funcional da correcção, com comentários explicativos.
4. **Testes de validação** — snippet de teste (jest/vitest/pytest) que prova que a vulnerabilidade foi corrigida.
5. **Checklist de deploy** — itens a verificar antes de colocar em produção.

No topo do blueprint, inclua sempre:
- Score actual vs. score esperado após correcções.
- Tabela de vulnerabilidades com links âncora para cada secção.
- Estimativa de esforço por correcção (Baixo / Médio / Alto).

---

## Regras de Output

- **Nunca** omitir uma vulnerabilidade por ser "óbvia" ou "menor".
- **Nunca** produzir código de exploração — apenas código de correcção.
- Se o código analisado estiver em português ou português moçambicano, mantenha os comentários no mesmo idioma.
- Se não houver vulnerabilidades → score 100, emitir certificado de aprovação e sugerir R23 (testes) e R25 (IA como atacante).
- O blueprint deve ser **auto-suficiente**: um programador deve conseguir seguir sem necessitar de consultar o relatório separado.

---

## Referências

- `references/ruleset.md` — Catálogo completo R01–R25 + CTF-R01–R11 com severidades.
- `references/blueprint-template.md` — Template canónico do blueprint .md.
