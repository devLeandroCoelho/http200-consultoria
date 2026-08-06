import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'http200ti-secret-key-2026';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Método não permitido' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

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

export const config = { runtime: 'edge' };
