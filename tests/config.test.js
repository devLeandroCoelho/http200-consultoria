/**
 * HTTP200.TI Consultoria — Testes de configurações (api/config.js)
 *
 * Cobre: GET público (com fallback DEFAULT_CONFIG), PUT autenticado
 * (401 sem token, 200 com token, upsert por chave) e tratamento de erros.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { supabaseState } from './helpers/supabase-mock.js';

vi.mock('@supabase/supabase-js', async () => {
  const { createMockClient } = await import('./helpers/supabase-mock.js');
  return { createClient: () => createMockClient() };
});

import { GET, PUT, OPTIONS } from '../api/config.js';

const SECRET = process.env.JWT_SECRET;

function makeRequest({ method = 'GET', body, token, origin = 'http://localhost:3000' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request('http://localhost/api/config', {
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

describe('GET /api/config — público', () => {
  it('retorna 200 com as configurações do banco', async () => {
    supabaseState.selectResult = {
      data: [
        { chave: 'email', valor: 'contato@example.com' },
        { chave: 'github', valor: 'https://github.com/x' },
      ],
      error: null,
    };

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({
      email: 'contato@example.com',
      github: 'https://github.com/x',
    });
  });

  it('retorna 200 com DEFAULT_CONFIG quando não há dados', async () => {
    supabaseState.selectResult = { data: [], error: null };

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.email).toBe('http200.ti@gmail.com');
    expect(json.data.github).toBe('https://github.com/devLeandroCoelho');
    expect(json.data.linkedin).toBe('https://linkedin.com/in/devleandrocoelho');
  });

  it('retorna 200 com DEFAULT_CONFIG quando o banco falha (fallback seguro)', async () => {
    supabaseState.selectResult = { data: null, error: new Error('db down') };

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.email).toBe('http200.ti@gmail.com');
  });
});

describe('PUT /api/config — autenticado', () => {
  it('retorna 401 sem token', async () => {
    const res = await PUT(makeRequest({ method: 'PUT', body: { email: 'a@b.com' } }));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Não autorizado');
  });

  it('retorna 401 com token inválido', async () => {
    const token = jwt.sign({ user: 'x' }, 'segredo-errado', { expiresIn: '1h' });
    const res = await PUT(makeRequest({ method: 'PUT', token, body: { email: 'a@b.com' } }));

    expect(res.status).toBe(401);
  });

  it('retorna 200 e faz upsert de cada chave com token válido', async () => {
    const token = validToken();

    const res = await PUT(
      makeRequest({ method: 'PUT', token, body: { email: 'novo@example.com', github: '  https://github.com/novo  ' } })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({
      email: 'novo@example.com',
      github: 'https://github.com/novo',
    });

    expect(supabaseState.upsertCalls).toHaveLength(2);
    expect(supabaseState.upsertCalls[0].data.chave).toBe('email');
    expect(supabaseState.upsertCalls[0].data.valor).toBe('novo@example.com');
    expect(supabaseState.upsertCalls[1].data.chave).toBe('github');
    expect(supabaseState.upsertCalls[1].data.valor).toBe('https://github.com/novo');
  });

  it('retorna 500 quando o upsert falha no banco', async () => {
    supabaseState.upsertResult = { data: null, error: new Error('db down') };
    const token = validToken();

    const res = await PUT(makeRequest({ method: 'PUT', token, body: { email: 'a@b.com' } }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Erro ao atualizar email');
  });

  it('retorna 500 com corpo JSON inválido', async () => {
    const token = validToken();

    const res = await PUT(
      new Request('http://localhost/api/config', {
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
    expect(json.error).toBe('Erro ao atualizar configurações');
  });
});

describe('OPTIONS /api/config — preflight CORS', () => {
  it('retorna 204 com allowlist de métodos', async () => {
    const res = await OPTIONS(makeRequest({ method: 'OPTIONS' }));

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, PUT, OPTIONS');
  });
});
