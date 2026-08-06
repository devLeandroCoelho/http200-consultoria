/**
 * HTTP200.TI Consultoria — Autenticação
 * 
 * Gerencia login e verificação de token JWT.
 * 
 * Rotas:
 *   POST /api/auth — Login (retorna token JWT)
 *   GET /api/auth — Verifica se token é válido
 * 
 * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 */

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'http200ti-fallback-secret';

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
function verifyToken(req) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/** GET — Verificar token existente */
export async function GET(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

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

/** POST — Login */
export async function POST(req) {
  try {
    const body = await req.json();
    const { usuario, senha } = body;

    if (!usuario || !senha) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário e senha são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const userSanitized = String(usuario).trim();
    const passSanitized = String(senha).trim();
    const validUser = process.env.ADMIN_USER;
    const validPass = process.env.ADMIN_PASS;

    if (!validUser || !validPass) {
      console.error('ADMIN_USER ou ADMIN_PASS não configurados');
      return new Response(
        JSON.stringify({ success: false, error: 'Erro de configuração do servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (userSanitized !== validUser || passSanitized !== validPass) {
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais inválidas' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

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

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export const config = { runtime: 'nodejs' };
