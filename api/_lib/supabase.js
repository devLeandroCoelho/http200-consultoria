/**
 * HTTP200.TI Consultoria — Cliente Supabase compartilhado (service-role)
 *
 * Cria UM client no boot do módulo para todos os handlers (servicos,
 * conteudo, config) usarem a service-role key — NUNCA a anon key.
 *
 * Racional de segurança (auditoria 13/08 — MAJOR):
 * - Antes, cada handler criava o client com SUPABASE_ANON_KEY. Como as
 *   policies de escrita usavam USING (true)/WITH CHECK (true), qualquer
 *   um com a anon key (pública) podia gravar direto no PostgREST,
 *   contornando o verifyToken da API.
 * - Agora o client usa SUPABASE_SERVICE_ROLE_KEY (secreta): o Supabase
 *   só atribui o papel `service_role` para essa key, e as policies de
 *   escrita exigem `auth.role() = 'service_role'` (supabase-schema.sql).
 *   A anon key fica sem poder de escrita — fail-closed.
 *
 * Fail-closed: se SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY estiverem
 * ausentes, o módulo LANÇA erro no boot — sem fallback hardcoded, sem
 * valor default. A API recusa iniciar (mesmo comportamento do JWT_SECRET).
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    '[http200-consultoria] SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias. ' +
    'Configure no ambiente (Vercel: Settings → Environment Variables) e faça redeploy. ' +
    'A API recusou iniciar por segurança — sem fallback hardcoded.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
