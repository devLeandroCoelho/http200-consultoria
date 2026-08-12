/**
 * HTTP200.TI Consultoria — API Principal
 * 
 * Roteador central da API. Retorna documentação dos endpoints.
 * 
 * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 */

import { corsHeaders, handleOptions } from './_lib/cors.js';

const ENDPOINT_METHODS = 'GET, OPTIONS';

/** Documentação da API */
const API_DOCS = {
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
};

export async function GET(req) {
  return new Response(
    JSON.stringify(API_DOCS),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
  );
}

export async function OPTIONS(req) {
  return handleOptions(req, ENDPOINT_METHODS);
}

export const config = { runtime: 'nodejs' };
