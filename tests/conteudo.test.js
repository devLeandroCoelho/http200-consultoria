/**
 * HTTP200.TI Consultoria — Testes de conteúdo (api/conteudo.js)
 *
 * Cobre: GET público, PUT autenticado (401 sem token / 200 com token),
 * whitelist de chaves, sanitização de HTML e erros do Supabase.
 * O Supabase é 100% mockado (tests/helpers/supabase-mock.js) — zero rede.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { supabaseState } from './helpers/supabase-mock.js';

vi.mock('@supabase/supabase-js', async () => {
  const { createMockClient } = await import('./helpers/supabase-mock.js');
  return { createClient: () => createMockClient() };
});

import { GET, PUT, OPTIONS } from '../api/conteudo.js';

const SECRET = process.env.JWT_SECRET;

function makeRequest({ method = 'GET', body, token, origin = 'http://localhost:3000' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request('http://localhost/api/conteudo', {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function validToken() {
  return jwt.sign({ user: 'admin-teste', role: 'admin' }, SECRET, { expiresIn: '1h' });
}

beforeEach(() => {
  supabaseState.reset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/conteudo — público', () => {
  it('retorna 200 mapeando chave → dados', async () => {
    supabaseState.selectResult = {
      data: [
        { chave: 'hero', dados: { titulo: 'Olá' } },
        { chave: 'sobre', dados: { texto: 'Sobre nós' } },
      ],
      error: null,
    };

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({
      hero: { titulo: 'Olá' },
      sobre: { texto: 'Sobre nós' },
    });
  });

  it('retorna 200 com objeto vazio quando não há dados', async () => {
    supabaseState.selectResult = { data: null, error: null };

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({});
  });

  it('retorna 500 quando o Supabase retorna erro', async () => {
    supabaseState.selectResult = { data: null, error: new Error('falha no banco') };

    const res = await GET(makeRequest());

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Erro ao buscar conteúdo');
  });
});

describe('PUT /api/conteudo — autenticado', () => {
  it('retorna 401 sem token', async () => {
    const res = await PUT(makeRequest({ method: 'PUT', body: { hero: {} } }));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Não autorizado');
  });

  it('retorna 401 com token inválido', async () => {
    const token = jwt.sign({ user: 'x' }, 'segredo-errado', { expiresIn: '1h' });
    const res = await PUT(makeRequest({ method: 'PUT', token, body: { hero: {} } }));

    expect(res.status).toBe(401);
  });

  it('retorna 200 e persiste o conteúdo com token válido', async () => {
    supabaseState.upsertResult = { data: null, error: null };
    const token = validToken();

    const res = await PUT(
      makeRequest({ method: 'PUT', token, body: { hero: { titulo: 'Novo hero' } } })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ hero: { titulo: 'Novo hero' } });

    // Verifica o que foi enviado ao "banco"
    expect(supabaseState.upsertCalls).toHaveLength(1);
    const { data, opts } = supabaseState.upsertCalls[0];
    expect(data.chave).toBe('hero');
    expect(data.dados).toEqual({ titulo: 'Novo hero' });
    expect(opts.onConflict).toBe('chave');
  });

  it('sanitiza HTML e espaços antes de persistir', async () => {
    const token = validToken();

    await PUT(
      makeRequest({
        method: 'PUT',
        token,
        body: { sobre: { texto: '  <b>Olá</b>  ' } },
      })
    );

    expect(supabaseState.upsertCalls).toHaveLength(1);
    // trim + remoção de tags HTML (o conteúdo textual é preservado)
    expect(supabaseState.upsertCalls[0].data.dados.texto).toBe('Olá');
  });

  it('retorna 400 para chave fora da whitelist', async () => {
    const token = validToken();

    const res = await PUT(
      makeRequest({ method: 'PUT', token, body: { chave_maliciosa: 'x' } })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Chave 'chave_maliciosa' não é permitida");
  });

  it('retorna 500 quando o upsert falha no banco', async () => {
    supabaseState.upsertResult = { data: null, error: new Error('db down') };
    const token = validToken();

    const res = await PUT(makeRequest({ method: 'PUT', token, body: { hero: {} } }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Erro ao atualizar hero');
  });

  it('retorna 500 com corpo JSON inválido', async () => {
    const token = validToken();

    const res = await PUT(
      new Request('http://localhost/api/conteudo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: '{quebrado',
      })
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Erro ao atualizar conteúdo');
  });
});

describe('OPTIONS /api/conteudo — preflight CORS', () => {
  it('retorna 204 com allowlist de métodos', async () => {
    const res = await OPTIONS(makeRequest({ method: 'OPTIONS' }));

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, PUT, OPTIONS');
  });
});
