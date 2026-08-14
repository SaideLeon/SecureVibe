# Catálogo de Regras de Segurança

Fonte: Plataforma de Análise de Segurança de Código (v1.0) + Relatório CTF (v1.0)

---

## Secção A — Regras da Plataforma (R01–R25)

### A.1 Autenticação e Gerenciamento de Credenciais

| ID  | Severidade | Nome | Descrição |
|-----|-----------|------|-----------|
| R01 | CRÍTICO | Hash de senha moderno | Senhas devem usar Argon2, bcrypt ou scrypt. MD5 e SHA-1 são proibidos. |
| R02 | ALTO | Sem enumeração de utilizadores | Resposta de autenticação deve ser sempre genérica: "credenciais inválidas". Nunca revelar se o e-mail existe. |
| R03 | CRÍTICO | Secrets fora do código | Nenhum secret, API key ou token no código-fonte ou em ficheiros versionados. Apenas variáveis de ambiente fora do repositório. |
| R04 | ALTO | Não criar autenticação própria | Usar soluções estabelecidas: Supabase Auth, Auth0, Keycloak, NextAuth. Autenticação manual aumenta superfície de ataque. |
| R05 | ALTO | Revogação de JWT | Implementar blocklist ou rotação de refresh tokens. Tokens sem revogação são inválidáveis mesmo após comprometimento. |

### A.2 Rate Limiting e Protecção contra Abuso

| ID  | Severidade | Nome | Descrição |
|-----|-----------|------|-----------|
| R06 | ALTO | Rate limiting por endpoint | Endpoints de autenticação, OTP e recuperação de senha precisam de limites mais rígidos com lockout progressivo. |
| R07 | ALTO | Limite de tamanho de input | Todo campo deve ter validação server-side de tamanho máximo. Validação apenas no front-end é insuficiente. |
| R08 | CRÍTICO | Protecção contra Race Condition | Operações financeiras e contadores devem usar transacções atómicas. Verificação separada da acção é vulnerável. |

### A.3 Validação e Sanitização de Dados

| ID  | Severidade | Nome | Descrição |
|-----|-----------|------|-----------|
| R09 | CRÍTICO | Validação server-side obrigatória | Toda validação deve existir no servidor. Dados do cliente são sempre suspeitos. |
| R10 | CRÍTICO | Protecção SQL Injection | Usar queries parametrizadas ou ORM com sanitização. Concatenação directa de input é proibida. |
| R11 | ALTO | Protecção XSS | Conteúdo de utilizador renderizado na interface deve ser escapado/sanitizado. |
| R12 | ALTO | Validação de upload (MIME + Magic Bytes) | Upload deve verificar MIME Type declarado E os Magic Bytes do ficheiro. Extensão sozinha é insuficiente. |
| R13 | MÉDIO | Restrição de URLs externas em imagens | Campos de URL de imagem devem restringir ao próprio domínio. URLs externas revelam IPs dos utilizadores. |
| R14 | MÉDIO | Limite de tamanho de URL | URLs do próprio domínio ainda precisam de limite de tamanho, incluindo query strings. |

### A.4 Controlo de Acesso e Autorização

| ID  | Severidade | Nome | Descrição |
|-----|-----------|------|-----------|
| R15 | CRÍTICO | Protecção IDOR | Toda operação em recursos deve verificar no back-end se o utilizador tem autorização. Nunca confiar em IDs do cliente. |
| R16 | ALTO | Regras de acesso explícitas | Regras de negócio de acesso devem ser explicitamente implementadas (ex.: só compradores acessam conteúdo pago). |
| R17 | CRÍTICO | RLS configurado restritivamente | Em Supabase/PostgreSQL, políticas RLS devem ser restritivas por defeito. RLS permissivo é das falhas mais exploradas. |
| R18 | ALTO | Protecção Mass Assignment | API não deve aceitar campos sensíveis (roles, saldo, status de pagamento) no body sem whitelist explícita. |

### A.5 Integridade da Lógica de Negócio

| ID  | Severidade | Nome | Descrição |
|-----|-----------|------|-----------|
| R19 | CRÍTICO | Consistência em transacções financeiras | Operações financeiras exigem transacções ACID. Prevenir exploração por compras/reembolsos simultâneos. |
| R20 | ALTO | Verificação de pré-condições | Fluxos de reembolso, saque e cancelamento devem verificar todas as pré-condições antes de executar. |
| R21 | ALTO | Detecção automática de fraude | Operações de alto risco não podem depender exclusivamente de revisão humana. Implementar regras automáticas. |

### A.6 Práticas de Desenvolvimento Seguro

| ID  | Severidade | Nome | Descrição |
|-----|-----------|------|-----------|
| R22 | CRÍTICO | Defesa em profundidade | Cada camada (front-end, API, BD) deve ser independentemente segura. Falha numa camada não deve comprometer as restantes. |
| R23 | ALTO | Testes de segurança automatizados | Testes devem cobrir: acesso não autorizado, Race Condition, inputs maliciosos, bypass de autorização. |
| R24 | ALTO | Segurança no prompt (projetos IA) | Requisitos de segurança devem estar no prompt inicial. Segurança adicionada depois é sempre menos eficaz. |
| R25 | MÉDIO | IA como atacante | Usar IA para tentar comprometer o sistema durante o desenvolvimento. Resolve ~80% das vulnerabilidades comuns. |

---

## Secção B — Regras do CTF (CTF-R01–CTF-R11)

### B.1 Autenticação e Controlo de Sessão

| ID       | Severidade | Nome | Descrição |
|----------|-----------|------|-----------|
| CTF-R01 | CRÍTICO | Secrets JWT únicos por subsistema | JWT compartilhado entre subsistemas (afiliados, principais) permite forjar tokens de outros utilizadores. Cada subsistema deve ter o seu secret e escopo de validação. |
| CTF-R02 | ALTO | Unicidade global de username | Usernames duplicados entre subsistemas + JWT partilhado = account takeover. Usernames devem ser únicos globalmente ou o escopo do token delimitado. |
| CTF-R03 | CRÍTICO | Secrets distintos por ambiente | Ambientes de homologação com o mesmo secret JWT de produção permitem geração de tokens válidos para utilizadores reais. |

### B.2 Validação de Dados e Lógica de Negócio

| ID       | Severidade | Nome | Descrição |
|----------|-----------|------|-----------|
| CTF-R04 | CRÍTICO | Rejeitar valores fracionados onde não permitidos | Input como 7.5 numa posição de jogo inteiro deve ser rejeitado explicitamente. Comparação falha = vantagem infinita. |
| CTF-R05 | CRÍTICO | Lógica de resultado exclusivamente no servidor | Resultado de jogos calculado no front-end (Double com seed de timestamp) pode ser previsto. Toda lógica determinística deve estar no servidor. |
| CTF-R06 | CRÍTICO | Não expor chaves de criptografia no cliente | Chave AES no JavaScript do cliente equivale a dado em texto claro. Secrets e chaves devem existir apenas no servidor. |

### B.3 Controlo de Taxa e Race Conditions

| ID       | Severidade | Nome | Descrição |
|----------|-----------|------|-----------|
| CTF-R07 | CRÍTICO | Ler estado DENTRO da Transaction | Saldo consultado antes do bloco Transaction permite Race Condition: múltiplas requisições lêem saldo positivo antes de qualquer débito. |
| CTF-R08 | CRÍTICO | Rate limiting em OTP | OTP de 4 dígitos sem rate limit = 10.000 combinações em segundos via brute force. OTP deve ter: min 6 dígitos, limite de 5 tentativas, lockout temporário. |
| CTF-R09 | ALTO | CAPTCHA e bloqueio por IP em endpoints críticos | Sem CAPTCHA, ataques de brute force paralelo executam em segundos. Login, OTP e recuperação de senha devem ter CAPTCHA e bloqueio progressivo por IP. |

### B.4 Controlo de Acesso e Obscuridade

| ID       | Severidade | Nome | Descrição |
|----------|-----------|------|-----------|
| CTF-R10 | ALTO | Rotas escondidas não substituem autenticação | Painel admin em /zadmin localizado via wordlist pública em 1 hora. Rotas obscuras podem ser camada extra, mas acesso deve ter MFA robusto. |
| CTF-R11 | ALTO | Seeds de jogo geradas e validadas no servidor | Seeds geradas no front-end são previsíveis. Devem ser: geradas no servidor, vinculadas à sessão, invalidadas após uso. |

---

## Sistema de Pontuação

| Severidade | Desconto por falha | Aprovação mínima |
|-----------|-------------------|-----------------|
| CRÍTICO   | 25 pontos         | Zero CRÍTICO    |
| ALTO      | 10 pontos         | ≥ 70 pontos     |
| MÉDIO     | 5 pontos          | ≥ 85 pontos     |

### Classificações
- **100 pts** — Aprovado com distinção
- **85–99 pts** — Aprovado com ressalvas (só falhas MÉDIO)
- **70–84 pts** — Aprovado condicionalmente (falhas ALTO sem CRÍTICO)
- **< 70 pts ou qualquer CRÍTICO** — Reprovado — não apto para produção
