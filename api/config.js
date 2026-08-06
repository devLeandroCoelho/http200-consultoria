/**
 * HTTP200.TI Consultoria — Configurações
 * 
 * Gerencia configurações gerais do site (email, redes sociais, etc.)
 * 
 * Rotas:
 *   GET /api/config  — Retorna configurações (público)
 *   PUT /api/config  — Atualiza configurações (autenticado)
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

/** Configurações padrão (usadas quando o banco está vazio) */
const DEFAULT_CONFIG = {
  email: 'http200.ti@gmail.com',
  linkedin: 'https://linkedin.com/in/devleandrocoelho',
  github: 'https://github.com/devLeandroCoelho'
};

/**
 * GET — Retorna configurações (público)
 * Se não houver dados no banco, retorna configurações padrão
 */
async function getConfig() {
  const { data, error } = await supabase
    .from('config')
    .select('chave, valor');

  // Em caso de erro ou banco vazio, retorna padrão
  if (error || !data || data.length === 0) {
    return new Response(
      JSON.stringify({ success: true, data: DEFAULT_CONFIG }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Converte array de {chave, valor} para objeto
  const config = {};
  for (const item of data) {
    config[item.chave] = item.valor;
  }

  return new Response(
    JSON.stringify({ success: true, data: config }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

/**
 * PUT — Atualiza configurações (autenticado)
 * @body {Object} body - Chaves a atualizar (email, linkedin, github)
 */
async function updateConfig(req) {
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
      const sanitized = String(value).trim();

      // Upsert: insere ou atualiza
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
    console.error('Erro ao atualizar config:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao atualizar configurações' }),
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
    case 'GET': return getConfig();
    case 'PUT': return updateConfig(req);
    default:
      return new Response(
        JSON.stringify({ success: false, error: 'Método não permitido' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
  }
}

export default handler;
export const config = { runtime: 'nodejs' };
