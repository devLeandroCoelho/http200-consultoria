/**
 * HTTP200.TI Consultoria — Helper de CORS
 * 
 * Restringe as origens permitidas (allowlist) e reflete a origem na
 * resposta SOMENTE se ela estiver na lista. Nunca retorna '*' em produção.
 * 
 * Origens permitidas por padrão:
 *   - https://devleandrocoelho.github.io          (produção — GitHub Pages)
 *   - https://http200-consultoria.vercel.app      (produção — Vercel, domínio padrão do projeto)
 *   - http://localhost:PORT / http://127.0.0.1:PORT  (desenvolvimento local)
 * 
 * Se o domínio de produção na Vercel for customizado, adicione-o via env var
 * CORS_ALLOWED_ORIGINS (separadas por vírgula) — também útil para previews:
 *   CORS_ALLOWED_ORIGINS="https://staging.example.com,https://preview.example.com"
 * 
 * Autor: Leandro Coelho — http200.ti@gmail.com
 */

/** Origens de produção (GitHub Pages + Vercel) */
const DEFAULT_ALLOWED_ORIGINS = [
  'https://devleandrocoelho.github.io',
  'https://http200-consultoria.vercel.app',
];

/** Origens extras via env (opcional): "https://a.com,https://b.com" */
const EXTRA_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Verifica se a origem é localhost/127.0.0.1 (dev) com qualquer porta.
 * @param {string} origin
 * @returns {boolean}
 */
function isLocalhostOrigin(origin) {
  try {
    const url = new URL(origin);
    return (
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    );
  } catch {
    return false;
  }
}

/**
 * @param {string|null|undefined} origin - Header Origin da requisição
 * @returns {boolean}
 */
export function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (DEFAULT_ALLOWED_ORIGINS.includes(origin)) return true;
  if (EXTRA_ALLOWED_ORIGINS.includes(origin)) return true;
  return isLocalhostOrigin(origin);
}

/**
 * Monta os headers de CORS refletindo a origem apenas se permitida.
 * @param {Request} req - Requisição HTTP (Web API)
 * @param {string} methods - Métodos HTTP do endpoint (ex.: 'GET, POST, OPTIONS')
 * @returns {Object} Headers de CORS
 */
export function corsHeaders(req, methods) {
  const origin = req && req.headers ? req.headers.get('origin') : null;
  const headers = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };

  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

/**
 * Resposta padrão para preflight (OPTIONS), coerente com o endpoint.
 * @param {Request} req
 * @param {string} methods
 * @returns {Response}
 */
export function handleOptions(req, methods) {
  return new Response(null, { status: 204, headers: corsHeaders(req, methods) });
}
