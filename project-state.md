# http200-consultoria — Estado do Projeto (Memória Canônica)

> **Regra de ouro**: TODO agente deve ler este arquivo ANTES de varrer o repositório.
> Ao final de cada missão, atualize este arquivo com o que mudou.
> Última atualização: 2026-08-14 (CI de testes ativo — PR #16 aberto)

---

## 1. Visão Geral

**http200-consultoria** — landing page profissional da HTTP200.TI (consultoria de DevOps, Backend,
IA e Transformação Digital) com painel administrativo e API serverless.

- **GitHub**: https://github.com/devLeandroCoelho/http200-consultoria — branch padrão: **`main`**
- **Produção (site)**: https://devleandrocoelho.github.io/http200-consultoria (GitHub Pages)
- **Produção (API)**: https://http200-consultoria.vercel.app (Vercel serverless)
- **Deploy**: GitHub Pages (estático) + Vercel (API) — workflow `deploy.yml`

## 2. Stack

```
HTML5 + CSS3 + JavaScript vanilla (frontend estático)
API serverless Vercel (Node 24, ES modules) em api/ — handlers GET/POST/PUT/DELETE/OPTIONS
Deps: @supabase/supabase-js ^2.45.0 · jsonwebtoken ^9.0.0 · vitest ^4.1.10 (dev)
Idioma: pt-BR + EN (README)
```

## 3. Estrutura

```
http200-consultoria/
├── index.html / login.html / admin.html   # páginas
├── script.js / styles.css
├── api/                                   # API serverless Vercel
│   ├── _lib/cors.js                       # CORS allowlist (nunca '*')
│   ├── auth.js / config.js / conteudo.js / servicos.js / upload.js / index.js
├── tests/                                 # suíte vitest (PR #9, 13/08)
│   ├── auth/conteudo/servicos/upload/config.test.js + helpers/supabase-mock.js + setup.js
├── supabase-schema.sql                    # schema + RLS
├── vercel.json · package.json · vitest.config.mjs
└── README.md (OSS setup: LICENSE MIT + CONTRIBUTING.md + badges)
```

## 4. Status Atual

| Item | Status |
|---|---|
| Issues | 🟢 **#2, #3, #4 fechadas** (13/08) — JWT_SECRET sem fallback, CORS allowlist, suíte de testes (56) |
| Testes | 🟢 56 testes vitest (auth 11 · conteudo 11 · servicos 16 · upload 9 · config 9) — PR #9 mergeado (SHA `122e0d9`); mock Supabase 100% (zero rede) |
| Segurança | 🟢 JWT_SECRET obrigatória (fail-closed, sem fallback) · CORS allowlist validada em produção (origem permitida reflete; origem alheia bloqueada) · 401 sem token nos PUTs |
| CI | 🟢 deploy.yml (GitHub Pages + Vercel build) + ci.yml (vitest, 56 testes, em PRs e push na main) — PR #16 aberto |
| Auditoria pós-merge (13/08) | ✅ APROVADO — qa-engineer + security-blue-team: **0 CRITICAL** |

## 5. Auditoria Formal Pós-Merge (13/08/2026)

Escopo: PRs #5 (OSS setup) e #6 (JWT/CORS), mergeados 12/08. Veredito: **APROVADO** (0 CRITICAL).

| Achado | Severidade | Ação |
|---|---|---|
| **RLS de escrita com `WITH CHECK (true)`/`USING (true)`** em servicos/conteudo/config (supabase-schema.sql:89-107) — API usa anon key; qualquer um com a anon key grava direto no Supabase REST contornando o verifyToken | **MAJOR** (pré-existente, não introduzido por #5/#6) | Backlog: restringir a `auth.role() = 'service_role'` + usar service-role key na API (ou role authenticated com claim admin) |
| Token JWT do admin em `localStorage` (admin.html:774) — exposto a XSS futuro | MINOR | Backlog: migrar para cookie httpOnly |
| Upload aceita `.svg` (2MB, sem sanitização) — SVG arbitrário pode carregar script se servido inline | MINOR | Backlog: remover svg ou servir com Content-Disposition: attachment |
| Sem rate limiting no POST /api/auth (força bruta de ADMIN_PASS) | MINOR | Backlog: delay/backoff |
| Fail-closed: se JWT_SECRET ausente na Vercel, toda API falha no boot | MINOR (ops) | Env já configurada (smoke prod ok 13/08) |
| Repo sem CI de testes | MINOR | Backlog: job vitest em PR (suíte pronta) |
| LGPD: sem dados de terceiros (só credenciais admin) | INFO | — |

## 6. Issues — Histórico Recente

| # | Issue | Status |
|---|---|---|
| 4 | Suíte de testes para a API (auth, conteúdo, upload) | ✅ Fechada 13/08 (PR #9, 56 testes) |
| 3 | Restringir CORS a origens conhecidas (hoje é *) | ✅ Fechada 13/08 com evidência em produção (allowlist; origem não permitida bloqueada) |
| 2 | Remover JWT_SECRET com fallback hardcoded | ✅ Fechada (PR #6) |
| 5/6 | OSS setup / security fix | ✅ Mergeados (PRs #5/#6) |

## 7. Pendências / Backlog

| Item | Prioridade | Quem |
|---|---|---|
| RLS de escrita → service_role (MAJOR pré-existente) | 🔥 DO NOW (próximo sprint) | backend-dev + security-blue-team |
| ~~CI job vitest em PRs~~ | ✅ Feito 14/08 (PR #16 — ci.yml, 56 testes verdes no runner) | devops |
| Token admin: localStorage → cookie httpOnly | 📅 PLAN | frontend-dev + security-blue-team |
| Upload: remover/sanitizar SVG | 📅 PLAN | backend-dev |
| Rate limiting no POST /api/auth | 📅 PLAN | backend-dev |

## 8. Decisões do Chefe

| # | Decisão | Aplicação |
|---|---|---|
| — | Sem decisões específicas para este projeto até 13/08 | — |

## 9. ⚠️ Concorrência no clone local (14/08)

> **Atenção**: o clone em `repos-readmes/http200-consultoria` é COMPARTILHADO — backend-dev trabalha nele
> em paralelo (branch `feat/rls-service-role`, fix RLS MAJOR). Devops (CI) trabalhou num clone isolado em
> `/var/folders/.../opencode/http200-ci` para não disputar working tree. Evite `reset --hard`/`checkout .`
> nesse clone sem combinar com o backend-dev.

## 10. Sessões por Agente

| Agente | task_id | Contexto já carregado |
|---|---|---|
| backend-dev | ses_0051537e8ffes0a7a4avLXjSgk | Implementou suíte vitest (PR #9) |
| dev-manager | ses_0050eb199ffe0DVldbiyrIiRXJ | Review + merge PR #9 |
| qa-engineer | ses_005156c8fffe9i7Lupie589khC | Auditoria formal pós-merge (APROVADO) |
| security-blue-team | ses_00515528fffexq4mcnfff3o6Rl | Auditoria segurança pós-merge (APROVADO; MAJOR RLS p/ backlog) |
