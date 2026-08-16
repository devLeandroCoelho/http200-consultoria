/**
 * HTTP200.TI Consultoria — Pedidos (Template Shop)
 *
 * CRUD para gerenciamento de pedidos de templates.
 * Qualquer pessoa pode criar um pedido (público).
 * Apenas admin pode listar/atualizar status/excluir.
 *
 * Rotas:
 *   GET    /api/pedidos          — Lista pedidos (auth)
 *   GET    /api/pedidos/:id      — Busca pedido por ID (público)
 *   POST   /api/pedidos          — Cria pedido (público)
 *   PUT    /api/pedidos          — Atualiza pedido (auth)
 *   DELETE /api/pedidos?id=      — Remove pedido (auth)
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

const WHATSAPP_OWNER_NUMBER = process.env.WHATSAPP_OWNER_NUMBER || '';
const WHATSAPP_NOTIFY_TOKEN = process.env.WHATSAPP_NOTIFY_TOKEN || '';

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

function formatWhatsAppNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length > 12) {
    return '+' + digits;
  }
  return '+' + digits;
}

async function notifyWhatsApp(pedido) {
  if (!WHATSAPP_OWNER_NUMBER || !WHATSAPP_NOTIFY_TOKEN) {
    console.log('[whatsapp] WHATSAPP_OWNER_NUMBER ou WHATSAPP_NOTIFY_TOKEN não definidos. Pulando notificação.');
    return;
  }

  const phone = formatWhatsAppNumber(WHATSAPP_OWNER_NUMBER);
  const message = encodeURIComponent(
    `🛒 Novo pedido recebido!\n\n` +
    `Cliente: ${pedido.nome_cliente}\n` +
    `Email: ${pedido.email_cliente}\n` +
    `WhatsApp: ${pedido.whatsapp || 'não informado'}\n` +
    `Produto: ${pedido.produto_nome}\n` +
    `Valor: R$ ${Number(pedido.produto_preco).toFixed(2)}\n` +
    `ID: ${pedido.id}\n` +
    `Status: ${pedido.status}`
  );

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${message}&apikey=${encodeURIComponent(WHATSAPP_NOTIFY_TOKEN)}`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log('[whatsapp] CallMeBot response:', res.status, text);
  } catch (err) {
    console.error('[whatsapp] Erro ao notificar:', err);
  }
}

/** GET — Lista pedidos (autenticado) */
export async function GET(req) {
  const user = verifyToken(req);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar pedidos' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: data || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar pedidos' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }
}

/** POST — Cria pedido (público) */
export async function POST(req) {
  try {
    const body = await req.json();
    const { nome_cliente, email_cliente, whatsapp, produto_id, produto_nome, produto_preco, observacoes } = body;

    if (!nome_cliente || !email_cliente || !produto_id || !produto_nome || produto_preco === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome, email, produto e preço são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    const { data, error } = await supabasePublic
      .from('pedidos')
      .insert({
        nome_cliente: String(nome_cliente).trim(),
        email_cliente: String(email_cliente).trim(),
        whatsapp: String(whatsapp || '').trim(),
        produto_id: String(produto_id),
        produto_nome: String(produto_nome).trim(),
        produto_preco: formatPreco(produto_preco),
        status: 'pendente',
        observacoes: String(observacoes || '').trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar pedido:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar pedido' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    notifyWhatsApp(data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao criar pedido' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }
}

/** PUT — Atualiza pedido (autenticado) */
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
    const { id, status, observacoes } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    const updates = {};
    if (status) updates.status = String(status);
    if (observacoes !== undefined) updates.observacoes = String(observacoes).trim();
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar pedido:', error);
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
    console.error('Erro ao atualizar pedido:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao atualizar pedido' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }
}

/** DELETE — Remove pedido (autenticado) */
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
      .from('pedidos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao remover pedido:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao remover pedido' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Pedido removido com sucesso' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  } catch (error) {
    console.error('Erro ao remover pedido:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao remover pedido' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }
}

export async function OPTIONS(req) {
  return handleOptions(req, ENDPOINT_METHODS);
}

export const config = { runtime: 'nodejs' };
