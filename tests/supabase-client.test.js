/**
 * HTTP200.TI Consultoria — Testes do helper api/_lib/supabase.js
 *
 * Garante o contrato do fix MAJOR RLS (auditoria 13/08):
 *   1. Fail-closed: sem SERVICE_ROLE_KEY, o módulo recusa o boot (mesmo
 *      padrão do JWT_SECRET) — nunca há fallback silencioso para a anon key.
 *   2. Com as envs presentes, são criados DOIS clientes: público (anon key)
 *      e admin (service_role key).
 *
 * @supabase/supabase-js é 100% mockado (zero rede) — mesmo mock da suíte.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';

describe('api/_lib/supabase.js — fail-closed (SERVICE_ROLE_KEY)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.dontMock('@supabase/supabase-js');
  });

  it('recusa o boot quando SERVICE_ROLE_KEY está ausente', async () => {
    vi.stubEnv('SERVICE_ROLE_KEY', '');
    vi.resetModules();
    vi.doMock('@supabase/supabase-js', async () => {
      const { createMockClient } = await import('./helpers/supabase-mock.js');
      return { createClient: (url, key) => createMockClient(url, key) };
    });

    await expect(import('../api/_lib/supabase.js')).rejects.toThrow(/SERVICE_ROLE_KEY/);
  });

  it('cria os clientes público (anon) e admin (service_role) com as envs presentes', async () => {
    vi.resetModules();
    vi.doMock('@supabase/supabase-js', async () => {
      const { createMockClient } = await import('./helpers/supabase-mock.js');
      return { createClient: (url, key) => createMockClient(url, key) };
    });
    
    const { supabaseState } = await import('./helpers/supabase-mock.js');
    supabaseState.clients = [];

    const mod = await import('../api/_lib/supabase.js');

    expect(mod.supabasePublic).toBeDefined();
    expect(mod.supabaseAdmin).toBeDefined();

    expect(supabaseState.clients).toHaveLength(2);
    expect(supabaseState.clients).toContainEqual(
      expect.objectContaining({ key: process.env.SUPABASE_ANON_KEY })
    );
    expect(supabaseState.clients).toContainEqual(
      expect.objectContaining({ key: process.env.SERVICE_ROLE_KEY })
    );
  });
});
