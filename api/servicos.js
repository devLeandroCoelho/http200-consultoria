/**
 * HTTP200.TI Consultoria — Serviços
 * 
 * CRUD completo para gerenciamento de serviços da consultoria.
 * 
 * Rotas:
 *   GET    /api/servicos    — Lista todos os serviços (público)
 *   POST   /api/servicos    — Cria novo serviço (autenticado)
 *   PUT    /api/servicos    — Atualiza serviço (autenticado)
 *   DELETE /api/servicos?id — Remove serviço (autenticado)
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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET — Lista todos os serviços ativos (público)
 * Ordena por ordem de exibição
 */
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

/**
 * POST — Cria um novo serviço (autenticado)
 * @body {string} titulo - Título do serviço
 * @body {string} descricao - Descrição do serviço
 * @body {string} icon - Nome do ícone (opcional, padrão: 'gear')
 * @body {number} ordem - Ordem de exibição (opcional)
 */
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

    // Validação de campos obrigatórios
    if (!titulo || !descricao) {
      return new Response(
        JSON.stringify({ success: false, error: 'Título e descrição são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Inserção no banco
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

/**
 * PUT — Atualiza um serviço existente (autenticado)
 * @body {string} id - ID do serviço (obrigatório)
 * @body {string} titulo - Novo título (opcional)
 * @body {string} descricao - Nova descrição (opcional)
 * @body {string} icon - Novo ícone (opcional)
 * @body {number} ordem - Nova ordem (opcional)
 */
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

    // Monta objeto de atualização apenas com campos enviados
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

/**
 * DELETE — Remove um serviço (soft delete — marca como inativo)
 * @query {string} id - ID do serviço
 */
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

    // Soft delete — apenas marca como inativo
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

/**
 * Handler principal — roteia por método HTTP
 */
export async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
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

export default handler;
export const config = { runtime: 'nodejs22.x' };
