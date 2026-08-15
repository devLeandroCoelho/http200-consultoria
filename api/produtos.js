/**
 * HTTP200.TI Consultoria — Produtos (Template Shop)
 *
 * CRUD completo para gerenciamento de produtos digitais (template kits).
 *
 * Rotas:
 *   GET    /api/produtos    — Lista produtos ativos (público)
 *   POST   /api/produtos    — Cria produto (auth)
 *   PUT    /api/produtos    — Atualiza produto (auth)
 *   DELETE /api/produtos?id — Remove produto (auth)
 *
 * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 * Issue: #17
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

const ENDPOINT_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';

function verifyToken(req) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

function formatPreco(value) {
  const num = Number(value);
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}

/** GET — Lista produtos ativos */
export async function GET(req) {
  const { data, error } = await supabasePublic
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar produtos:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar produtos' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: data || [] }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
  );
}

/** POST — Cria produto (autenticado) */
export async function POST(req) {
  const user = verifyToken(req);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }

  try {
    const body = await req.json();
    const { nome, descricao, preco, imagem_url, categoria, tags } = body;

    if (!nome || !descricao) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome e descrição são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('produtos')
      .insert({
        nome: String(nome).trim(),
        descricao: String(descricao).trim(),
        preco: formatPreco(preco),
        imagem_url: String(imagem_url || '').trim(),
        categoria: String(categoria || '').trim(),
        tags: Array.isArray(tags) ? tags : [],
        ativo: true
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar produto:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar produto' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao criar produto' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }
}

/** PUT — Atualiza produto (autenticado) */
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
    const { id, nome, descricao, preco, imagem_url, categoria, tags, ativo } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    const updates = {};
    if (nome) updates.nome = String(nome).trim();
    if (descricao) updates.descricao = String(descricao).trim();
    if (preco !== undefined) updates.preco = formatPreco(preco);
    if (imagem_url !== undefined) updates.imagem_url = String(imagem_url).trim();
    if (categoria !== undefined) updates.categoria = String(categoria).trim();
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
    if (ativo !== undefined) updates.ativo = Boolean(ativo);
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('produtos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar produto:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Produto não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao atualizar produto' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }
}

/** DELETE — Remove produto (autenticado) */
export async function DELETE(req) {
  const user = verifyToken(req);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    const { error } = await supabaseAdmin
      .from('produtos')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erro ao remover produto:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao remover produto' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Produto removido com sucesso' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao remover produto' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }
}

export async function OPTIONS(req) {
  return handleOptions(req, ENDPOINT_METHODS);
}

export const config = { runtime: 'nodejs' };
