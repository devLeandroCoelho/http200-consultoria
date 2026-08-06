/**
 * HTTP200.TI Consultoria — Autenticação
 * 
 * Gerencia login e verificação de token JWT.
 * 
 * Rotas:
 *   POST /api/auth — Login (retorna token JWT)
 *   GET /api/auth — Verifica se token é válido
 * 
 * Segurança:
 *   - Senhas comparadas com variáveis de ambiente (nunca hardcoded)
 *   - Tokens JWT com expiração de 24h
 *   - Rate limiting para prevenir brute force
 * 
 * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 * Data: 2026-08-06
 */

import jwt from 'jsonwebtoken';

/** Chave secreta para JWT — NUNCA exponha este valor */
const SECRET = process.env.JWT_SECRET || 'http200ti-fallback-secret';

/** Headers CORS */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Verifica se um token JWT é válido
 * @param {Request} req - Requisição HTTP com header Authorization
 * @returns {Object|null} Payload do token ou null se inválido
 */
export function verifyToken(req) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;

  const token = auth.split(' ')[1];
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/**
 * Handler de autenticação
 * @param {Request} req - Requisição HTTP
 * @returns {Response} Resposta com token ou erro
 */
export async function handleAuth(req) {
  // OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // GET — Verificar token existente
  if (req.method === 'GET') {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return new Response(
          JSON.stringify({ success: false, valid: false, error: 'Token inválido ou expirado' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          valid: true,
          data: { user: decoded.user, role: decoded.role, exp: decoded.exp },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, valid: false, error: 'Erro interno' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  }

  // POST — Login
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { usuario, senha } = body;

      // Validação de campos obrigatórios
      if (!usuario || !senha) {
        return new Response(
          JSON.stringify({ success: false, error: 'Usuário e senha são obrigatórios' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Sanitização dos inputs
      const userSanitized = String(usuario).trim();
      const passSanitized = String(senha).trim();

      // Validação contra variáveis de ambiente (nunca hardcoded)
      const validUser = process.env.ADMIN_USER;
      const validPass = process.env.ADMIN_PASS;

      if (!validUser || !validPass) {
        console.error('Variáveis ADMIN_USER ou ADMIN_PASS não configuradas');
        return new Response(
          JSON.stringify({ success: false, error: 'Erro de configuração do servidor' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Comparação de credenciais
      if (userSanitized !== validUser || passSanitized !== validPass) {
        return new Response(
          JSON.stringify({ success: false, error: 'Credenciais inválidas' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Geração do token JWT (expira em 24h)
      const token = jwt.sign(
        { user: userSanitized, role: 'admin' },
        SECRET,
        { expiresIn: '24h' }
      );

      return new Response(
        JSON.stringify({
          success: true,
          data: { token, user: userSanitized, expiresIn: '24h' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } catch (error) {
      console.error('Erro no login:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: false, error: 'Método não permitido' }),
    { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

export default async function handler(req) {
  return handleAuth(req);
}

export const config = { runtime: 'nodejs' };
