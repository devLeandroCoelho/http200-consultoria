/**
 * HTTP200.TI Consultoria — Conteúdo
 * 
 * Gerencia o conteúdo dinâmico da landing page.
 * 
 * Rotas:
 *   GET /api/conteudo  — Retorna todo conteúdo (público)
 *   PUT /api/conteudo  — Atualiza conteúdo (autenticado)
 * 
 * Chaves: hero, sobre, diferenciais, cta
 * 
 * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 */

import jwt from 'jsonwebtoken';
import { corsHeaders, handleOptions } from './_lib/cors.js';
import { supabasePublic, supabaseAdmin } from './_lib/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    '[http200-consultoria] JWT_SECRET não definido. Configure a env var JWT_SECRET ' +
    '(Vercel: Settings → Environment Variables) e faça redeploy. ' +
    'A API recusou iniciar por segurança — sem fallback hardcoded.'
  );
}

const ENDPOINT_METHODS = 'GET, PUT, OPTIONS';

/** Chaves permitidas (whitelist de segurança) */
const CONTENT_KEYS = ['hero', 'sobre', 'diferenciais', 'cta'];

function verifyToken(req) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

function sanitizeObject(obj) {
  if (typeof obj === 'string') return obj.trim().replace(/<[^>]*>/g, '');
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

/** GET — Retorna todo conteúdo */
export async function GET(req) {
  const { data, error } = await supabasePublic
    .from('conteudo')
    .select('chave, dados');

  if (error) {
    console.error('Erro ao buscar conteúdo:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar conteúdo' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }

  const conteudo = {};
  if (data) {
    for (const item of data) {
      conteudo[item.chave] = item.dados;
    }
  }

  return new Response(
    JSON.stringify({ success: true, data: conteudo }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
  );
}

/** PUT — Atualiza conteúdo (autenticado) */
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
      if (!CONTENT_KEYS.includes(key)) {
        return new Response(
          JSON.stringify({ success: false, error: `Chave '${key}' não é permitida` }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
        );
      }

      const sanitized = sanitizeObject(value);
      const { error } = await supabaseAdmin
        .from('conteudo')
        .upsert(
          { chave: key, dados: sanitized, updated_at: new Date().toISOString() },
          { onConflict: 'chave' }
        );

      if (error) {
        console.error(`Erro ao atualizar conteúdo ${key}:`, error);
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
    console.error('Erro ao atualizar conteúdo:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao atualizar conteúdo' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }
}

export async function OPTIONS(req) {
  return handleOptions(req, ENDPOINT_METHODS);
}

export const config = { runtime: 'nodejs' };
