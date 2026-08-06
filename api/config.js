import { supabase } from './_lib/supabase.js';
import { verifyToken } from './auth/verify.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const DEFAULT_CONFIG = {
  email: 'http200.ti@gmail.com',
  linkedin: 'https://linkedin.com/in/devleandrocoelho',
  github: 'https://github.com/devLeandroCoelho'
};

// GET — público
async function getConfig() {
  const { data, error } = await supabase
    .from('config')
    .select('chave, valor');

  if (error) {
    console.error('Erro ao buscar config:', error);
    return new Response(
      JSON.stringify({ success: true, data: DEFAULT_CONFIG }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const config = {};
  if (data && data.length > 0) {
    for (const item of data) {
      config[item.chave] = item.valor;
    }
  } else {
    // Se não tem dados, retorna o padrão
    return new Response(
      JSON.stringify({ success: true, data: DEFAULT_CONFIG }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: config }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

// PUT — autenticado
async function updateConfig(req) {
  const user = verifyToken(req);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const body = await req.json();
    const updates = {};

    for (const [key, value] of Object.entries(body)) {
      const sanitized = String(value).trim();

      // Upsert
      const { error } = await supabase
        .from('config')
        .upsert(
          { chave: key, valor: sanitized, updated_at: new Date().toISOString() },
          { onConflict: 'chave' }
        );

      if (error) {
        console.error(`Erro ao atualizar config ${key}:`, error);
        return new Response(
          JSON.stringify({ success: false, error: `Erro ao atualizar ${key}` }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      updates[key] = sanitized;
    }

    return new Response(
      JSON.stringify({ success: true, data: updates }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao atualizar config:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao atualizar configurações' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  switch (req.method) {
    case 'GET': return getConfig();
    case 'PUT': return updateConfig(req);
    default:
      return new Response(
        JSON.stringify({ success: false, error: 'Método não permitido' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
  }
}

export const config = { runtime: 'nodejs22.x' };
