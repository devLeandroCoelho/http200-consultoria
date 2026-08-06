import { supabase } from './_lib/supabase.js';
import { verifyToken } from './auth/verify.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const rateLimitMap = new Map();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.start > RATE_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

function getClientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

const CONTENT_KEYS = ['hero', 'sobre', 'diferenciais', 'cta'];

function sanitizeObject(obj) {
  if (typeof obj === 'string') return obj.trim();
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

// GET - retornar todo conteúdo (público)
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

// PUT - atualizar conteúdo (autenticado)
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
      if (!CONTENT_KEYS.includes(key)) {
        return new Response(
          JSON.stringify({ success: false, error: `Chave '${key}' não é permitida` }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      const sanitized = sanitizeObject(value);

      // Upsert (insert ou update)
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

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Rate limit excedido. Tente novamente em 1 minuto.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
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

export const config = { runtime: 'edge' };
