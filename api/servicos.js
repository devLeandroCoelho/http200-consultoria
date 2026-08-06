/**
 * HTTP200.TI Consultoria — Serviços
 * 
 * CRUD completo para gerenciamento de serviços.
 * 
 * Rotas:
 *   GET    /api/servicos    — Lista serviços (público)
 *   POST   /api/servicos    — Cria serviço (auth)
 *   PUT    /api/servicos    — Atualiza serviço (auth)
 *   DELETE /api/servicos?id — Remove serviço (auth)
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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function verifyToken(req) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

/** GET — Lista serviços ativos */
export async function GET() {
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

/** POST — Cria serviço (autenticado) */
export async function POST(req) {
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

/** PUT — Atualiza serviço (autenticado) */
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

/** DELETE — Remove serviço (autenticado) */
export async function DELETE(req) {
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

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export const config = { runtime: 'nodejs' };
