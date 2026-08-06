/**
 * HTTP200.TI Consultoria — Upload
 * 
 * Upload de imagens (autenticado).
 * 
 * Rota: POST /api/upload
 * 
 * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'http200ti-fallback-secret';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.svg'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

function verifyToken(req) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

function isValidFileType(filename) {
  const ext = '.' + filename.split('.').pop().toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/** POST — Upload de imagem */
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
    const { filename, data } = body;

    if (!filename || !data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome e dados são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!isValidFileType(filename)) {
      return new Response(
        JSON.stringify({ success: false, error: `Tipo não permitido. Aceitos: ${ALLOWED_EXTENSIONS.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const base64Data = data.split(',')[1] || data;
    const sizeInBytes = Math.ceil(base64Data.length * 3 / 4);
    if (sizeInBytes > MAX_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ success: false, error: 'Arquivo muito grande. Máximo: 2MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: { url: data, filename } }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro no upload:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao processar upload' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export const config = { runtime: 'nodejs' };
