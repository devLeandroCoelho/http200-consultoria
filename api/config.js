/**
 * HTTP200.TI Consultoria — Configurações
 * 
 * Gerencia configurações gerais do site.
 * 
 * Rotas:
 *   GET /api/config  — Retorna configurações (público)
 *   PUT /api/config  — Atualiza configurações (autenticado)
 * 
 * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 */

import jwt from 'jsonwebtoken';
import { corsHeaders, handleOptions } from './_lib/cors.js';
import { supabase } from './_lib/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    '[http200-consultoria] JWT_SECRET não definido. Configure a env var JWT_SECRET ' +
    '(Vercel: Settings → Environment Variables) e faça redeploy. ' +
    'A API recusou iniciar por segurança — sem fallback hardcoded.'
  );
}

const ENDPOINT_METHODS = 'GET, PUT, OPTIONS';

/** Configurações padrão */
const DEFAULT_CONFIG = {
  email: 'http200.ti@gmail.com',
  linkedin: 'https://linkedin.com/in/devleandrocoelho',
  github: 'https://github.com/devLeandroCoelho'
};

function verifyToken(req) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

/** GET — Retorna configurações */
export async function GET(req) {
  const { data, error } = await supabase
    .from('config')
    .select('chave, valor');

  if (error || !data || data.length === 0) {
    return new Response(
      JSON.stringify({ success: true, data: DEFAULT_CONFIG }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }

  const config = {};
  for (const item of data) {
    config[item.chave] = item.valor;
  }

  return new Response(
    JSON.stringify({ success: true, data: config }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
  );
}

/** PUT — Atualiza configurações (autenticado) */
export async function PUT(req) {
  const user = verifyToken(req);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }

  try {
    const body = await req.json();
    const updates = {};

    for (const [key, value] of Object.entries(body)) {
      const sanitized = String(value).trim();
      const { error } = await supabase
        .from('config')
        .upsert(
          { chave: key, valor: sanitized, updated_at: new Date().toISOString() },
          { onConflict: 'chave' }
        );

      if (error) {
        console.error(`Erro ao atualizar config ${key}:`, error);
        return new Response(
          JSON.stringify({ success: false, error: `Erro ao atualizar ${key}` }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
        );
      }

      updates[key] = sanitized;
    }

    return new Response(
      JSON.stringify({ success: true, data: updates }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  } catch (error) {
    console.error('Erro ao atualizar config:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao atualizar configurações' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }
}

export async function OPTIONS(req) {
  return handleOptions(req, ENDPOINT_METHODS);
}

export const config = { runtime: 'nodejs' };
