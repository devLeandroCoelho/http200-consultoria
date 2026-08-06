/**
 * HTTP200.TI Consultoria — Conteúdo
 * 
 * Gerencia o conteúdo dinâmico da landing page.
 * 
 * Rotas:
 *   GET /api/conteudo  — Retorna todo conteúdo (público)
 *   PUT /api/conteudo  — Atualiza conteúdo (autenticado)
 * 
 * Chaves disponíveis:
 *   hero, sobre, diferenciais, cta
 * 
 * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 * Data: 2026-08-06
 */

import { supabase } from './_lib/supabase.js';
import { verifyToken } from './auth.js';

/** Headers CORS */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/** Chaves permitidas para conteúdo (whitelist de segurança) */
const CONTENT_KEYS = ['hero', 'sobre', 'diferenciais', 'cta'];

/**
 * Remove tags HTML e sanitiza strings
 * @param {*} obj - Objeto a ser sanitizado
 * @returns {*} Objeto sanitizado
 */
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

/**
 * GET — Retorna todo conteúdo (público)
 * Agrupa por chave em um objeto único
 */
async function getConteudo() {
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

  // Converte array de {chave, dados} para objeto {hero: {...}, sobre: {...}}
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

/**
 * PUT — Atualiza conteúdo (autenticado)
 * Aceita múltiplas chaves no mesmo request
 * @body {Object} body - Objeto com chaves a atualizar
 */
async function updateConteudo(req) {
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
      // Validação: só permite chaves da whitelist
      if (!CONTENT_KEYS.includes(key)) {
        return new Response(
          JSON.stringify({ success: false, error: `Chave '${key}' não é permitida` }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const sanitized = sanitizeObject(value);

      // Upsert: insere ou atualiza
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

/**
 * Handler principal — roteia por método HTTP
 */
export async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  switch (req.method) {
    case 'GET': return getConteudo();
    case 'PUT': return updateConteudo(req);
    default:
      return new Response(
        JSON.stringify({ success: false, error: 'Método não permitido' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
  }
}

export default handler;
export const config = { runtime: 'nodejs' };
