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

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'http200ti-fallback-secret';

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
export async function GET() {
  const { data, error } = await supabase
    .from('conteudo')
    .select('chave, dados');

  if (error) {
    console.error('Erro ao buscar conteúdo:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar conteúdo' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

/** PUT — Atualiza conteúdo (autenticado) */
export async function PUT(req) {
  const user = verifyToken(req);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const body = await req.json();
    const updates = {};

    for (const [key, value] of Object.entries(body)) {
      if (!CONTENT_KEYS.includes(key)) {
        return new Response(
          JSON.stringify({ success: false, error: `Chave '${key}' não é permitida` }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const sanitized = sanitizeObject(value);
      const { error } = await supabase
        .from('conteudo')
        .upsert(
          { chave: key, dados: sanitized, updated_at: new Date().toISOString() },
          { onConflict: 'chave' }
        );

      if (error) {
        console.error(`Erro ao atualizar conteúdo ${key}:`, error);
        return new Response(
          JSON.stringify({ success: false, error: `Erro ao atualizar ${key}` }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      updates[key] = sanitized;
    }

    return new Response(
      JSON.stringify({ success: true, data: updates }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao atualizar conteúdo:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao atualizar conteúdo' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export const config = { runtime: 'nodejs' };
