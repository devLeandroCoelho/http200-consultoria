import { supabase } from './_lib/supabase.js';
import { verifyToken } from './auth/verify.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Rate limiting em memória
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

// GET - listar todos (público)
async function getServicos() {
  const { data, error } = await supabase
    .from('servicos')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  if (error) {
    console.error('Erro ao buscar serviços:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar serviços' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: data || [] }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

// POST - criar (autenticado)
async function createServico(req) {
  const user = verifyToken(req);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const body = await req.json();
    const { titulo, descricao, icon, ordem } = body;

    if (!titulo || !descricao) {
      return new Response(
        JSON.stringify({ success: false, error: 'Título e descrição são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { data, error } = await supabase
      .from('servicos')
      .insert({
        titulo: String(titulo).trim(),
        descricao: String(descricao).trim(),
        icon: String(icon || 'gear').trim(),
        ordem: Number(ordem) || 0,
        ativo: true
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar serviço:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar serviço' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao criar serviço' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// PUT - atualizar (autenticado)
async function updateServico(req) {
  const user = verifyToken(req);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const body = await req.json();
    const { id, titulo, descricao, icon, ordem } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const updates = {};
    if (titulo) updates.titulo = String(titulo).trim();
    if (descricao) updates.descricao = String(descricao).trim();
    if (icon) updates.icon = String(icon).trim();
    if (ordem !== undefined) updates.ordem = Number(ordem);
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('servicos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar serviço:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Serviço não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao atualizar serviço' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// DELETE - remover (autenticado)
async function deleteServico(req) {
  const user = verifyToken(req);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Soft delete (marca como inativo)
    const { error } = await supabase
      .from('servicos')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erro ao remover serviço:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao remover serviço' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Serviço removido com sucesso' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao remover serviço:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao remover serviço' }),
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
    case 'GET': return getServicos();
    case 'POST': return createServico(req);
    case 'PUT': return updateServico(req);
    case 'DELETE': return deleteServico(req);
    default:
      return new Response(
        JSON.stringify({ success: false, error: 'Método não permitido' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
  }
}

export const config = { runtime: 'nodejs' };
