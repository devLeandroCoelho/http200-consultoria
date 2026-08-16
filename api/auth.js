/**
 * HTTP200.TI Consultoria — Autenticação
 * 
 * Gerencia login, verificação de sessão e logout via cookie httpOnly.
 * 
 * Rotas:
 *   POST /api/auth — Login (define cookie httpOnly)
 *   GET /api/auth — Verifica se sessão é válida (via cookie)
 *   DELETE /api/auth — Logout (limpa cookie)
 * 
 * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 */

import jwt from 'jsonwebtoken';
import { corsHeaders, handleOptions, isAllowedOrigin } from './_lib/cors.js';

const AUTH_METHODS = 'GET, POST, DELETE, OPTIONS';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error(
    '[http200-consultoria] JWT_SECRET não definido. Configure a env var JWT_SECRET ' +
    '(Vercel: Settings → Environment Variables) e faça redeploy. ' +
    'A API recusou iniciar por segurança — sem fallback hardcoded.'
  );
}

const COOKIE_NAME = 'admin_token';
const COOKIE_OPTIONS = [
  'HttpOnly',
  'Secure',
  'SameSite=Lax',
  'Path=/',
  'Max-Age=86400',
].join('; ');

function parseCookie(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=');
    if (k) acc[k] = decodeURIComponent(v.join('='));
    return acc;
  }, {});
}

function getCookieValue(req, name) {
  const cookies = parseCookie(req.headers.get('cookie') || '');
  return cookies[name] || null;
}

function buildSetCookie(token) {
  return `${COOKIE_NAME}=${token}; ${COOKIE_OPTIONS}`;
}

function buildClearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

/**
 * Verifica se um token JWT é válido
 * @param {string|null} token
 * @returns {Object|null} Payload do token ou null se inválido
 */
function verifyJwt(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function corsResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(null, AUTH_METHODS),
      ...extraHeaders,
    },
  });
}

/** GET — Verificar sessão via cookie */
export async function GET(req) {
  try {
    const token = getCookieValue(req, COOKIE_NAME);
    const decoded = verifyJwt(token);
    if (!decoded) {
      return new Response(
        JSON.stringify({ success: false, valid: false, error: 'Sessão inválida ou expirada' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, AUTH_METHODS) } }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        data: { user: decoded.user, role: decoded.role, exp: decoded.exp },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, AUTH_METHODS) } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, valid: false, error: 'Erro interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, AUTH_METHODS) } }
    );
  }
}

/** POST — Login */
export async function POST(req) {
  try {
    const body = await req.json();
    const { usuario, senha } = body;

    if (!usuario || !senha) {
      return corsResponse({ success: false, error: 'Usuário e senha são obrigatórios' }, 400);
    }

    const userSanitized = String(usuario).trim();
    const passSanitized = String(senha).trim();
    const validUser = process.env.ADMIN_USER;
    const validPass = process.env.ADMIN_PASS;

    if (!validUser || !validPass) {
      console.error('ADMIN_USER ou ADMIN_PASS não configurados');
      return corsResponse({ success: false, error: 'Erro de configuração do servidor' }, 500);
    }

    if (userSanitized !== validUser || passSanitized !== validPass) {
      return corsResponse({ success: false, error: 'Credenciais inválidas' }, 401);
    }

    const token = jwt.sign(
      { user: userSanitized, role: 'admin' },
      SECRET,
      { expiresIn: '24h' }
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: { user: userSanitized, expiresIn: '24h' },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(req, AUTH_METHODS),
          'Set-Cookie': buildSetCookie(token),
        },
      }
    );
  } catch (error) {
    console.error('Erro no login:', error);
    return corsResponse({ success: false, error: 'Erro interno do servidor' }, 500);
  }
}

/** DELETE — Logout */
export async function DELETE(req) {
  try {
    const origin = req.headers.get('origin');
    const headers = {
      'Content-Type': 'application/json',
      ...corsHeaders(req, AUTH_METHODS),
      'Set-Cookie': buildClearCookie(),
    };

    if (origin && isAllowedOrigin(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Logout realizado' }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Erro no logout:', error);
    return corsResponse({ success: false, error: 'Erro interno do servidor' }, 500);
  }
}

export async function OPTIONS(req) {
  return handleOptions(req, AUTH_METHODS);
}

export const config = { runtime: 'nodejs' };
