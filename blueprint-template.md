# Security Blueprint — Template Canónico

> Substitua todos os `{{PLACEHOLDERS}}` com os dados reais da auditoria.
> Este template é auto-suficiente: o programador não necessita do relatório separado.

---

# 🔐 Blueprint de Correcção de Segurança

**Projecto:** {{NOME_DO_PROJECTO}}  
**Data da auditoria:** {{DATA}}  
**Auditado por:** Claude Security Audit Skill v1.0  

---

## Score de Segurança

| Métrica | Valor |
|---------|-------|
| Score actual | {{SCORE_ACTUAL}}/100 |
| Score esperado após correcções | 100/100 |
| Vulnerabilidades CRÍTICO | {{N_CRITICO}} |
| Vulnerabilidades ALTO | {{N_ALTO}} |
| Vulnerabilidades MÉDIO | {{N_MEDIO}} |
| **Resultado actual** | **{{RESULTADO}}** |

---

## Índice de Vulnerabilidades

| # | Regra | Severidade | Localização | Esforço | Status |
|---|-------|-----------|-------------|---------|--------|
{{TABELA_INDICE}}

> **Esforço:** Baixo (< 1h) · Médio (1–4h) · Alto (> 4h)

---

<!-- Repita o bloco abaixo para CADA vulnerabilidade encontrada, em ordem de severidade (CRÍTICO → ALTO → MÉDIO) -->

---

## [R{{XX}}] {{NOME_DA_REGRA}} — {{SEVERIDADE}}

### Contexto

**O que existe actualmente:**

```{{LINGUAGEM}}
// Código actual vulnerável
{{CODIGO_VULNERAVEL}}
```

**Por que é explorável:**  
{{EXPLICACAO_EXPLORACAO}}

**Impacto potencial:**  
{{IMPACTO}} _(ex.: account takeover, perda financeira, exposição de dados)_

---

### Arquitectura da Correcção

```
{{DIAGRAMA_ASCII_OU_MERMAID}}
```

> _Inclua diagrama apenas quando o fluxo envolver múltiplos componentes (ex.: middleware → BD → resposta)._

---

### Implementação Passo a Passo

#### Passo 1 — {{TITULO_PASSO_1}}

```{{LINGUAGEM}}
// {{COMENTARIO_EXPLICATIVO}}
{{CODIGO_CORRECAO_PASSO_1}}
```

#### Passo 2 — {{TITULO_PASSO_2}}

```{{LINGUAGEM}}
{{CODIGO_CORRECAO_PASSO_2}}
```

> _Adicione tantos passos quantos necessários. Cada passo deve ser atómico e testável._

---

### Teste de Validação

```{{LINGUAGEM_TESTE}}
// Teste que prova que a vulnerabilidade foi corrigida
// Executar com: {{COMANDO_TESTE}}
describe('{{NOME_REGRA}} — correcção', () => {
  it('{{DESCRICAO_DO_TESTE}}', async () => {
    {{CODIGO_TESTE}}
  });
});
```

**Resultado esperado:** {{RESULTADO_ESPERADO_DO_TESTE}}

---

### Checklist de Deploy

- [ ] {{ITEM_CHECKLIST_1}}
- [ ] {{ITEM_CHECKLIST_2}}
- [ ] Variáveis de ambiente actualizadas (se aplicável)
- [ ] Testes de segurança a passar (`{{COMANDO_TESTE}}`)
- [ ] Revisão de código por par antes do merge

---

<!-- FIM DO BLOCO DE VULNERABILIDADE — repita acima para cada falha -->

---

## Checklist Global Pré-Deploy

### Obrigatório (CRÍTICO e ALTO)
- [ ] Todos os CRÍTICO corrigidos e testados
- [ ] Todos os ALTO corrigidos e testados
- [ ] Suite de testes de segurança a passar integralmente
- [ ] Variáveis de ambiente auditadas — nenhum secret no código
- [ ] RLS configurado e testado (se usar Supabase/PostgreSQL)
- [ ] Rate limiting activo em endpoints de autenticação
- [ ] Logs de segurança activos para operações financeiras

### Recomendado (MÉDIO e Boas Práticas)
- [ ] Falhas MÉDIO endereçadas ou agendadas
- [ ] Testes de penetração com IA (R25) realizados
- [ ] Documentação de regras de acesso actualizada
- [ ] CAPTCHA configurado em endpoints expostos
- [ ] Rotação de secrets agendada

---

## Referências e Recursos

| Recurso | Descrição |
|---------|-----------|
| [OWASP Top 10](https://owasp.org/www-project-top-ten/) | Top 10 vulnerabilidades mais críticas da web |
| [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security) | Configuração correcta de Row Level Security |
| [bcrypt npm](https://www.npmjs.com/package/bcrypt) | Hash seguro de passwords em Node.js |
| [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) | Rate limiting para Express/Next.js API routes |
| [zod](https://zod.dev/) | Validação de schema server-side em TypeScript |

---

_Blueprint gerado automaticamente pela Security Audit Skill v1.0_  
_Baseado em: Relatório CTF v1.0 + Plataforma de Análise de Segurança de Código v1.0_
