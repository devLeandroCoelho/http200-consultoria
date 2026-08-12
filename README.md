<div align="center">

![License: MIT](https://img.shields.io/github/license/devLeandroCoelho/http200-consultoria)
![Deploy](https://img.shields.io/github/actions/workflow/status/devLeandroCoelho/http200-consultoria/deploy.yml?label=deploy&logo=github)
![Site](https://img.shields.io/website?url=https%3A%2F%2Fdevleandrocoelho.github.io%2Fhttp200-consultoria&label=site&logo=githubpages)

</div>

<p align="center">
  <a href="#português">Português</a> | <a href="#english">English</a>
</p>

---

# <a id="português"></a>Português

# HTTP200.TI — Landing Page de Consultoria de TI

Landing page profissional para a [HTTP200.TI](https://http200.ti), consultoria especializada em **DevOps, Backend, IA e Transformação Digital**.

### Funcionalidades

- Design responsivo para todos os dispositivos (mobile, tablet, desktop)
- HTML5 semântico com design system customizado em CSS3
- JavaScript vanilla — zero dependências externas
- Carregamento rápido com deploy estático
- Painel administrativo para gerenciamento de conteúdo

### Stack

| Camada | Tecnologia |
|--------|------------|
| Markup | HTML5 (semântico) |
| Estilos | CSS3 (design system customizado) |
| Interatividade | JavaScript vanilla |
| Hospedagem | GitHub Pages + Vercel (API serverless) |

### Como rodar

```bash
git clone https://github.com/devLeandroCoelho/http200-consultoria.git
cd http200-consultoria
open index.html
```

> Para rodar a API localmente, veja o [CONTRIBUTING.md](CONTRIBUTING.md#como-rodar-localmente).

## Contribuindo

Quer ajudar? Leia o [CONTRIBUTING.md](CONTRIBUTING.md) — guia rápido com como rodar o projeto, padrões de código e como abrir issues e pull requests.

## Licença

Distribuído sob **MIT License** — veja o arquivo [LICENSE](LICENSE).

---

# <a id="english"></a>English

Professional landing page for [HTTP200.TI](https://http200.ti) — an IT consulting firm specializing in **DevOps, Backend, AI, and Digital Transformation**.

## Features

- Fully responsive design for all devices (mobile, tablet, desktop)
- Semantic HTML5 with custom CSS design system
- Vanilla JavaScript — zero external dependencies
- Fast loading with static deployment
- Admin panel for content management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Markup | HTML5 (semantic) |
| Styling | CSS3 (custom design system) |
| Interactivity | Vanilla JavaScript |
| Hosting | GitHub Pages + Vercel (serverless API) |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/devLeandroCoelho/http200-consultoria.git
cd http200-consultoria

# Open in browser
open index.html
```

## Deployment

The site is deployed via **GitHub Pages** and the API runs on **Vercel** (serverless functions in `api/`).

Live site: **[http200.ti](https://devleandrocoelho.github.io/http200-consultoria)**

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to run the project, code standards, and how to open issues and pull requests.

## License

Distributed under **MIT License** — see [LICENSE](LICENSE).

---

# <a id="environment"></a>Variáveis de Ambiente / Environment Variables

> Configuração de backend (endpoints em `api/`). Copie `.env.example` para `.env.local` em dev e configure as mesmas variáveis na Vercel (**Settings → Environment Variables**). **Nunca commite valores reais** — `.gitignore` já cobre `.env*`.

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `JWT_SECRET` | ✅ | Segredo para assinar/verificar tokens JWT. **Sem fallback** — se ausente, a API falha ao iniciar por segurança. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_USER` / `ADMIN_PASS` | ✅ | Credenciais do painel admin |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | ✅ | Conexão com o Supabase |
| `CORS_ALLOWED_ORIGINS` | ❌ | Origens CORS extras (vírgula-separadas), somam-se à allowlist padrão |

## CORS (origens permitidas)

A API **nunca** responde com `Access-Control-Allow-Origin: *`. A allowlist padrão:

- `https://devleandrocoelho.github.io` — produção (GitHub Pages)
- `https://http200-consultoria.vercel.app` — produção (Vercel)
- `http://localhost:*` / `http://127.0.0.1:*` — desenvolvimento local

Se o domínio de produção na Vercel for customizado, adicione-o em `CORS_ALLOWED_ORIGINS`.

<div align="center">

Made with ❤️ by [Leandro Coelho](https://github.com/devLeandroCoelho)

</div>
