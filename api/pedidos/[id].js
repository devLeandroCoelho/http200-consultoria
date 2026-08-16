/**
 * HTTP200.TI Consultoria — Pedidos por ID (público)
 *
 * GET /api/pedidos/:id — Busca pedido por ID (público)
 *
 * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 * Issue: #23
 */

import { corsHeaders, handleOptions } from '../_lib/cors.js';
import { supabasePublic } from '../_lib/supabase.js';

const ENDPOINT_METHODS = 'GET, OPTIONS';

export async function GET(req, context) {
  try {
    const id = context.params?.id;
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    const { data, error } = await supabasePublic
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar pedido:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Pedido não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar pedido' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }
}

export async function OPTIONS(req) {
  return handleOptions(req, ENDPOINT_METHODS);
}

export const config = { runtime: 'nodejs' };
