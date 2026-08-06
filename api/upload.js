import { kv } from '@vercel/kv';
import { verifyToken } from './auth/verify.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const rateLimitMap = new Map();
const RATE_LIMIT = 20;
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

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
const MAX_SIZE = 2 * 1024 * 1024;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Método não permitido' }), { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ success: false, error: 'Rate limit excedido' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  const user = verifyToken(req);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  try {
    const contentType = req.headers.get('content-type');

    // Upload via multipart/form-data
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      if (!file) {
        return new Response(JSON.stringify({ success: false, error: 'Nenhum arquivo enviado' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return new Response(JSON.stringify({ success: false, error: `Tipo não permitido. Aceitos: ${ALLOWED_TYPES.join(', ')}` }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (file.size > MAX_SIZE) {
        return new Response(JSON.stringify({ success: false, error: 'Arquivo muito grande. Máximo: 2MB' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      await kv.set(`upload:${id}`, { id, url: dataUrl, type: file.type, size: file.size, name: file.name, uploadedBy: user.user, uploadedAt: new Date().toISOString() });
      return new Response(JSON.stringify({ success: true, data: { url: dataUrl, id } }), { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Upload via JSON com base64
    if (contentType?.includes('application/json')) {
      const body = await req.json();
      const { data, type, name } = body;
      if (!data || !type) {
        return new Response(JSON.stringify({ success: false, error: 'Dados e tipo são obrigatórios' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (!ALLOWED_TYPES.includes(type)) {
        return new Response(JSON.stringify({ success: false, error: `Tipo não permitido. Aceitos: ${ALLOWED_TYPES.join(', ')}` }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const sizeInBytes = Math.ceil((data.length * 3) / 4);
      if (sizeInBytes > MAX_SIZE) {
        return new Response(JSON.stringify({ success: false, error: 'Arquivo muito grande. Máximo: 2MB' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      await kv.set(`upload:${id}`, { id, url: data, type, size: sizeInBytes, name: name || 'unnamed', uploadedBy: user.user, uploadedAt: new Date().toISOString() });
      return new Response(JSON.stringify({ success: true, data: { url: data, id } }), { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    return new Response(JSON.stringify({ success: false, error: 'Content-Type não suportado' }), { status: 415, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    console.error('Erro no upload:', error);
    return new Response(JSON.stringify({ success: false, error: 'Erro ao processar upload' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}

export const config = { runtime: 'edge' };
