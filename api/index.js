/**
 * HTTP200.TI Consultoria — API Principal
 * 
 * Este arquivo serve como roteador central da API.
 * Redireciona cada rota para o handler correspondente.
 * 
 * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 * Data: 2026-08-06
 */

import { handleAuth } from './auth.js';
import { handler as servicosHandler } from './servicos.js';
import { handler as conteudoHandler } from './conteudo.js';
import { handler as configHandler } from './config.js';
import { handler as uploadHandler } from './upload.js';

/** Headers CORS — permite chamadas de qualquer origem */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handler principal — roteia requisições para o endpoint correto
 * @param {Request} req - Requisição HTTP
 * @returns {Response} Resposta HTTP
 */
export default async function handler(req) {
  // Responde preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/api', '');

  try {
    // Roteamento por path
    if (path === '/auth' || path.startsWith('/auth/')) {
      return handleAuth(req);
    }
    if (path === '/servicos') {
      return servicosHandler(req);
    }
    if (path === '/conteudo') {
      return conteudoHandler(req);
    }
    if (path === '/config') {
      return configHandler(req);
    }
    if (path === '/upload') {
      return uploadHandler(req);
    }

    // Documentação da API
    return new Response(
      JSON.stringify({
        success: true,
        message: 'HTTP200.TI — API da Consultoria',
        version: '1.0.0',
        endpoints: {
          'GET /api/servicos': 'Lista serviços (público)',
          'POST /api/servicos': 'Cria serviço (auth)',
          'PUT /api/servicos': 'Atualiza serviço (auth)',
          'DELETE /api/servicos?id=xxx': 'Remove serviço (auth)',
          'GET /api/conteudo': 'Lista conteúdo (público)',
          'PUT /api/conteudo': 'Atualiza conteúdo (auth)',
          'GET /api/config': 'Lista configurações (público)',
          'PUT /api/config': 'Atualiza configurações (auth)',
          'POST /api/auth': 'Login (usuário/senha)',
          'GET /api/auth': 'Verifica token (auth)',
          'POST /api/upload': 'Upload de imagem (auth)',
        },
        contact: 'http200.ti@gmail.com',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro na API:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

export const config = { runtime: 'nodejs22.x' };
