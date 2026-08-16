/**
 * HTTP200.TI Consultoria — Upload
 * 
 * Upload de imagens (autenticado).
 * 
 * Rota: POST /api/upload
 * 
 * * Autor: Leandro Coelho — http200.ti@gmail.com
 * Versão: 1.0.0
 */

import jwt from 'jsonwebtoken';
import { corsHeaders, handleOptions } from './_lib/cors.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    '[http200-consultoria] JWT_SECRET não definido. Configure a env var JWT_SECRET ' +
    '(Vercel: Settings → Environment Variables) e faça redeploy. ' +
    'A API recusou iniciar por segurança — sem fallback hardcoded.'
  );
}

const ENDPOINT_METHODS = 'POST, OPTIONS';

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

function sanitizeSvg(base64Data) {
  try {
    let svgString;
    if (base64Data.includes(',')) {
      svgString = Buffer.from(base64Data.split(',')[1], 'base64').toString('utf-8');
    } else {
      svgString = Buffer.from(base64Data, 'base64').toString('utf-8');
    }

    let cleaned = svgString;

    cleaned = cleaned.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<\s*script\b[^>]*\/>/gi, '');

    cleaned = cleaned.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
    cleaned = cleaned.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

    cleaned = cleaned.replace(/<(foreignObject|embed|object|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    cleaned = cleaned.replace(/<\s*(foreignObject|embed|object|iframe)\b[^>]*\/>/gi, '');

    const sanitizedBase64 = Buffer.from(cleaned, 'utf-8').toString('base64');

    if (base64Data.includes(',')) {
      return base64Data.split(',')[0] + ',' + sanitizedBase64;
    }
    return sanitizedBase64;
  } catch {
    return null;
  }
}

/** POST — Upload de imagem */
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
    const { filename, data } = body;

    if (!filename || !data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome e dados são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    if (!isValidFileType(filename)) {
      return new Response(
        JSON.stringify({ success: false, error: `Tipo não permitido. Aceitos: ${ALLOWED_EXTENSIONS.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    const base64Data = data.split(',')[1] || data;
    const sizeInBytes = Math.ceil(base64Data.length * 3 / 4);
    if (sizeInBytes > MAX_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ success: false, error: 'Arquivo muito grande. Máximo: 2MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
      );
    }

    let processedData = data;
    if (filename.toLowerCase().endsWith('.svg')) {
      const sanitized = sanitizeSvg(base64Data);
      if (!sanitized) {
        return new Response(
          JSON.stringify({ success: false, error: 'SVG inválido ou não sanitizado' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
        );
      }
      processedData = sanitized;
    }

    return new Response(
      JSON.stringify({ success: true, data: { url: processedData, filename } }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  } catch (error) {
    console.error('Erro no upload:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao processar upload' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(req, ENDPOINT_METHODS) } }
    );
  }
}

export async function OPTIONS(req) {
  return handleOptions(req, ENDPOINT_METHODS);
}

export const config = { runtime: 'nodejs' };
