/**
 * HTTP200.TI Consultoria — Clientes Supabase
 *
 * Dois clientes com papéis distintos (fix MAJOR da auditoria 13/08):
 *   - supabasePublic: anon key — SOMENTE leitura (GETs públicos)
 *   - supabaseAdmin : service_role key — escrita autenticada (verifyToken)
 *
 * Fail-closed: sem SERVICE_ROLE_KEY o módulo falha no boot (mesmo padrão do
 * JWT_SECRET). NUNCA há fallback silencioso para a anon key em operações de
 * escrita — isso reintroduziria o bypass em que qualquer um com a anon key
 * gravaria direto no Supabase REST, contornando o verifyToken do app.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  throw new Error(
    '[http200-consultoria] SERVICE_ROLE_KEY não definida. Configure a env var SERVICE_ROLE_KEY ' +
    '(Supabase Dashboard → Settings → API → service_role) no ambiente (Vercel: Settings → ' +
    'Environment Variables) e faça redeploy. A API recusou iniciar por segurança — ' +
    'sem fallback para a anon key.'
  );
}

/** Cliente público — leitura (anon key, respeita RLS) */
export const supabasePublic = createClient(supabaseUrl || '', anonKey || '');

/** Cliente administrativo — escrita (service_role key, ignora RLS) */
export const supabaseAdmin = createClient(supabaseUrl || '', serviceRoleKey);
