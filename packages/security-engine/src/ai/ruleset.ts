import type { Category, Severity } from '@securevibe/shared/types'

export type RuleDef = {
  id: string
  severity: Severity
  category: Category
  name: string
  description: string
}

// Catálogo canónico (Plataforma R01-R25 + Relatório CTF-R01-11).
// Mantido em sincronia com references/ruleset.md da skill "security-audit".
export const AI_RULESET: RuleDef[] = [
  { id: 'R01', severity: 'CRITICAL', category: 'AUTH', name: 'Hash de senha moderno', description: 'Senhas devem usar Argon2, bcrypt ou scrypt. MD5 e SHA-1 são proibidos.' },
  { id: 'R02', severity: 'HIGH', category: 'AUTH', name: 'Sem enumeração de utilizadores', description: 'Resposta de autenticação deve ser sempre genérica ("credenciais inválidas"), nunca revelando se o e-mail existe.' },
  { id: 'R03', severity: 'CRITICAL', category: 'SECRETS', name: 'Secrets fora do código', description: 'Nenhum secret, API key ou token deve estar no código-fonte ou em ficheiros versionados.' },
  { id: 'R04', severity: 'HIGH', category: 'AUTHENTICATION', name: 'Não criar autenticação própria', description: 'Deve-se usar soluções estabelecidas (Supabase Auth, Auth0, Keycloak, NextAuth) em vez de autenticação manual.' },
  { id: 'R05', severity: 'HIGH', category: 'AUTHENTICATION', name: 'Revogação de JWT', description: 'Deve existir blocklist ou rotação de refresh tokens para permitir invalidar sessões comprometidas.' },
  { id: 'R06', severity: 'HIGH', category: 'RATE_LIMITING', name: 'Rate limiting por endpoint', description: 'Endpoints de autenticação, OTP e recuperação de senha precisam de limites rígidos com lockout progressivo.' },
  { id: 'R07', severity: 'HIGH', category: 'INPUT_VALIDATION', name: 'Limite de tamanho de input', description: 'Todo campo deve ter validação server-side de tamanho máximo; validação apenas no front-end é insuficiente.' },
  { id: 'R08', severity: 'CRITICAL', category: 'RACE_CONDITION', name: 'Protecção contra Race Condition', description: 'Operações financeiras e contadores devem usar transacções atómicas; verificação separada da acção é vulnerável.' },
  { id: 'R09', severity: 'CRITICAL', category: 'INPUT_VALIDATION', name: 'Validação server-side obrigatória', description: 'Toda validação deve existir no servidor. Dados do cliente são sempre suspeitos.' },
  { id: 'R10', severity: 'CRITICAL', category: 'DATABASE', name: 'Protecção SQL Injection', description: 'Usar queries parametrizadas ou ORM com sanitização; concatenação directa de input é proibida.' },
  { id: 'R11', severity: 'HIGH', category: 'INPUT_VALIDATION', name: 'Protecção XSS', description: 'Conteúdo de utilizador renderizado na interface deve ser escapado/sanitizado.' },
  { id: 'R12', severity: 'HIGH', category: 'UPLOAD', name: 'Validação de upload (MIME + Magic Bytes)', description: 'Upload deve verificar o MIME Type declarado E os Magic Bytes do ficheiro; extensão sozinha é insuficiente.' },
  { id: 'R13', severity: 'MEDIUM', category: 'UPLOAD', name: 'Restrição de URLs externas em imagens', description: 'Campos de URL de imagem devem restringir ao próprio domínio para não revelar IPs dos utilizadores.' },
  { id: 'R14', severity: 'MEDIUM', category: 'API', name: 'Limite de tamanho de URL', description: 'URLs do próprio domínio ainda precisam de limite de tamanho, incluindo query strings.' },
  { id: 'R15', severity: 'CRITICAL', category: 'ACCESS_CONTROL', name: 'Protecção IDOR', description: 'Toda operação em recursos deve verificar no back-end se o utilizador tem autorização; nunca confiar em IDs do cliente.' },
  { id: 'R16', severity: 'HIGH', category: 'ACCESS_CONTROL', name: 'Regras de acesso explícitas', description: 'Regras de negócio de acesso devem ser explicitamente implementadas (ex.: só compradores acessam conteúdo pago).' },
  { id: 'R17', severity: 'CRITICAL', category: 'DATABASE', name: 'RLS configurado restritivamente', description: 'Em Supabase/PostgreSQL, políticas RLS devem ser restritivas por defeito.' },
  { id: 'R18', severity: 'HIGH', category: 'API', name: 'Protecção Mass Assignment', description: 'API não deve aceitar campos sensíveis (roles, saldo, status de pagamento) no body sem whitelist explícita.' },
  { id: 'R19', severity: 'CRITICAL', category: 'BUSINESS_LOGIC', name: 'Consistência em transacções financeiras', description: 'Operações financeiras exigem transacções ACID para prevenir exploração por compras/reembolsos simultâneos.' },
  { id: 'R20', severity: 'HIGH', category: 'BUSINESS_LOGIC', name: 'Verificação de pré-condições', description: 'Fluxos de reembolso, saque e cancelamento devem verificar todas as pré-condições antes de executar.' },
  { id: 'R21', severity: 'HIGH', category: 'BUSINESS_LOGIC', name: 'Detecção automática de fraude', description: 'Operações de alto risco não podem depender exclusivamente de revisão humana.' },
  { id: 'R22', severity: 'CRITICAL', category: 'DEV_PRACTICES', name: 'Defesa em profundidade', description: 'Cada camada (front-end, API, BD) deve ser independentemente segura.' },
  { id: 'R23', severity: 'HIGH', category: 'DEV_PRACTICES', name: 'Testes de segurança automatizados', description: 'Testes devem cobrir acesso não autorizado, race condition, inputs maliciosos e bypass de autorização.' },
  { id: 'R24', severity: 'HIGH', category: 'DEV_PRACTICES', name: 'Segurança no prompt (projectos IA)', description: 'Requisitos de segurança devem estar no prompt inicial de geração de código.' },
  { id: 'R25', severity: 'MEDIUM', category: 'DEV_PRACTICES', name: 'IA como atacante', description: 'Usar IA para tentar comprometer o sistema durante o desenvolvimento.' },

  { id: 'CTF-R01', severity: 'CRITICAL', category: 'AUTHENTICATION', name: 'Secrets JWT únicos por subsistema', description: 'JWT partilhado entre subsistemas permite forjar tokens de outros utilizadores; cada subsistema deve ter o seu secret.' },
  { id: 'CTF-R02', severity: 'HIGH', category: 'AUTHENTICATION', name: 'Unicidade global de username', description: 'Usernames duplicados entre subsistemas + JWT partilhado permitem account takeover.' },
  { id: 'CTF-R03', severity: 'CRITICAL', category: 'SECRETS', name: 'Secrets distintos por ambiente', description: 'Homologação com o mesmo secret JWT de produção permite gerar tokens válidos para utilizadores reais.' },
  { id: 'CTF-R04', severity: 'CRITICAL', category: 'INPUT_VALIDATION', name: 'Rejeitar valores fracionados onde não permitidos', description: 'Inputs fracionados numa posição inteira devem ser rejeitados explicitamente.' },
  { id: 'CTF-R05', severity: 'CRITICAL', category: 'BUSINESS_LOGIC', name: 'Lógica de resultado exclusivamente no servidor', description: 'Resultado de jogos/lógica determinística calculada no front-end pode ser prevista/manipulada.' },
  { id: 'CTF-R06', severity: 'CRITICAL', category: 'CRYPTO', name: 'Não expor chaves de criptografia no cliente', description: 'Chaves (ex.: AES) no JavaScript do cliente equivalem a dado em texto claro.' },
  { id: 'CTF-R07', severity: 'CRITICAL', category: 'RACE_CONDITION', name: 'Ler estado DENTRO da Transaction', description: 'Saldo consultado antes do bloco de transacção permite Race Condition.' },
  { id: 'CTF-R08', severity: 'CRITICAL', category: 'RATE_LIMITING', name: 'Rate limiting em OTP', description: 'OTP sem rate limit permite brute force em segundos; exigir mínimo 6 dígitos, limite de tentativas e lockout.' },
  { id: 'CTF-R09', severity: 'HIGH', category: 'RATE_LIMITING', name: 'CAPTCHA e bloqueio por IP em endpoints críticos', description: 'Login, OTP e recuperação de senha devem ter CAPTCHA e bloqueio progressivo por IP.' },
  { id: 'CTF-R10', severity: 'HIGH', category: 'ACCESS_CONTROL', name: 'Rotas escondidas não substituem autenticação', description: 'Rotas obscuras (ex.: /zadmin) podem ser localizadas por wordlist; acesso deve exigir MFA robusto.' },
  { id: 'CTF-R11', severity: 'HIGH', category: 'CRYPTO', name: 'Seeds de jogo geradas e validadas no servidor', description: 'Seeds geradas no front-end são previsíveis; devem ser geradas no servidor, vinculadas à sessão e invalidadas após uso.' },
]
