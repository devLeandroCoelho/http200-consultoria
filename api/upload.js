/**
 * HTTP200.TI Consultoria — Upload de Imagens
 * 
 * Gerencia upload de imagens para o site.
 * 
 * Rota:
 *   POST /api/upload — Upload de imagem (autenticado)
 * 
 * Restrições:
 *   - Formatos aceitos: jpg, png, svg
 *   - Tamanho máximo: 2MB
 *   - Armazenamento: base64 no banco (temporário)
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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/** Configurações de upload */
const UPLOAD_CONFIG = {
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.svg'],
};

/**
 * Valida se o tipo do arquivo é permitido
 * @param {string} filename - Nome do arquivo
 * @returns {boolean} True se válido
 */
function isValidFileType(filename) {
  const ext = '.' + filename.split('.').pop().toLowerCase();
  return UPLOAD_CONFIG.allowedExtensions.includes(ext);
}

/**
 * POST — Upload de imagem (autenticado)
 * Recebe imagem em base64 e salva no banco
 * @body {string} filename - Nome do arquivo
 * @body {string} data - Dados em base64 (data:image/...;base64,...)
 */
async function uploadImage(req) {
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

    // Validação de campos
    if (!filename || !data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome e dados do arquivo são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validação de tipo
    if (!isValidFileType(filename)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Tipo não permitido. Aceitos: ${UPLOAD_CONFIG.allowedExtensions.join(', ')}` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validação de tamanho (estimativa do base64)
    const base64Data = data.split(',')[1] || data;
    const sizeInBytes = Math.ceil(base64Data.length * 3 / 4);
    if (sizeInBytes > UPLOAD_CONFIG.maxSizeBytes) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Arquivo muito grande. Máximo: ${UPLOAD_CONFIG.maxSizeBytes / 1024 / 1024}MB` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Gera ID único para o upload
    const uploadId = Date.now().toString(36) + Math.random().toString(36).slice(2);

    // Salva no banco
    const { error } = await supabase
      .from('uploads')
      .upsert(
        { 
          id: uploadId, 
          filename, 
          data, 
          created_at: new Date().toISOString() 
        },
        { onConflict: 'id' }
      );

    if (error) {
      // Se a tabela não existir, cria e tenta novamente
      console.warn('Tabela uploads não existe, tentando criar...');
      await supabase.rpc('exec_sql', { 
        sql: `CREATE TABLE IF NOT EXISTS uploads (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`
      });
      
      // Tenta inserir novamente
      const { error: retryError } = await supabase
        .from('uploads')
        .insert({ id: uploadId, filename, data, created_at: new Date().toISOString() });

      if (retryError) {
        console.error('Erro ao salvar upload:', retryError);
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao salvar arquivo' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          id: uploadId, 
          url: data, // Retorna o base64 como URL
          filename 
        } 
      }),
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

/**
 * Handler principal — roteia por método HTTP
 */
export async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method === 'POST') {
    return uploadImage(req);
  }

  return new Response(
    JSON.stringify({ success: false, error: 'Método não permitido' }),
    { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

export default handler;
export const config = { runtime: 'nodejs' };
