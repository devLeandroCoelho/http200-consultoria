# Contribuindo para a HTTP200.TI

Obrigado por querer contribuir! Este projeto é a landing page e o painel de administração da [HTTP200.TI](https://http200.ti).

Antes de começar, leia o [LICENSE](LICENSE) — o projeto é distribuído sob **MIT License**.

## Como rodar localmente

### Landing page (frontend estático)

O frontend é HTML/CSS/JS puro — basta abrir no navegador:

```bash
# Opção 1: abrir direto
open index.html

# Opção 2: servidor estático local (recomendado)
python3 -m http.server 8080
# depois acesse http://localhost:8080
```

### API (funções serverless)

As funções em `api/` rodam no runtime Node.js da **Vercel** e dependem do Supabase.

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente (nunca commite `.env.local`):

   | Variável            | Descrição                          |
   | ------------------- | ---------------------------------- |
   | `SUPABASE_URL`      | URL do projeto Supabase            |
   | `SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase   |
   | `JWT_SECRET`        | Segredo para assinar o JWT do login |

3. Suba o ambiente local da Vercel:
   ```bash
   npx vercel dev
   ```

> ⚠️ A API **recusa iniciar** sem `JWT_SECRET` — não existe fallback hardcoded (medida de segurança).

## Estrutura do projeto

```
http200-consultoria/
├── api/                    # Funções serverless (Vercel, runtime Node.js)
│   ├── index.js            # Landing page — lista serviços
│   ├── auth.js             # Login do admin (JWT)
│   ├── servicos.js         # CRUD de serviços
│   ├── conteudo.js         # Conteúdo dinâmico do site
│   ├── upload.js           # Upload de imagens
│   ├── config.js           # Configurações gerais do site
│   └── _lib/cors.js        # Headers CORS compartilhados
├── index.html              # Landing page
├── login.html              # Login do painel admin
├── admin.html              # Painel de administração
├── styles.css              # Design system
├── script.js               # Lógica do frontend
├── supabase-schema.sql     # Schema PostgreSQL (Supabase)
├── vercel.json             # Rotas da Vercel
└── .github/workflows/      # Deploy automático (GitHub Pages)
```

## Padrões de código

- **Frontend**: HTML5 semântico, CSS3 e JavaScript vanilla (sem frameworks e sem dependências externas).
- **API**: named exports (`GET`, `PUT`, etc.) no runtime `nodejs` da Vercel — mantenha compatível com Node.js.
- **CORS**: use os helpers de `api/_lib/cors.js` em toda rota.
- **Segurança**: nunca commite `.env*`, secrets ou tokens. Sem fallback hardcoded de segredos.
- **Banco**: mudanças no schema vão em `supabase-schema.sql` e devem ser aplicadas no Supabase antes do deploy.

## Padrões de commits

Siga [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add service detail modal on landing page
fix: correct login API endpoint and token extraction
refactor: consolidate API into 5 functions
docs: add CONTRIBUTING guide
```

- Prefixos comuns: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Quando o commit resolve uma issue, cite: `(Fixes #12)`.

## Como abrir uma issue

1. Verifique se a issue já não existe (busque antes de criar).
2. Descreva o problema ou a feature com contexto claro:
   - **Bug**: passos para reproduzir, comportamento esperado vs. obtido, ambiente.
   - **Feature**: objetivo e caso de uso — quanto mais específico, melhor.
3. Use labels quando possível (`bug`, `enhancement`, `docs`, etc.).

## Como abrir um Pull Request

1. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feat/minha-mudanca
   ```
2. Faça commits com mensagens claras (veja os padrões acima).
3. Abra o PR via GitHub:
   ```bash
   gh pr create --base main --title "feat: ..." --body "Descrição das mudanças"
   ```
4. No corpo do PR, descreva o que mudou, como testar e (se aplicável) a issue resolvida (`Fixes #N`).
5. O deploy é automático após o merge em `main` — fique de olho no status do workflow.

## Código de conduta

Não há `CODE_OF_CONDUCT` formal; espera-se comportamento respeitoso e profissional em issues, PRs e comentários. Seja claro, construtivo e paciente com quem está aprendendo.
