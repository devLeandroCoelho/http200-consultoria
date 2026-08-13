/**
 * HTTP200.TI Consultoria — Testes de serviços (api/servicos.js)
 *
 * CRUD completo com Supabase mockado: GET público, POST/PUT/DELETE
 * autenticados (401 sem token), validações de payload e erros do banco.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { supabaseState } from './helpers/supabase-mock.js';

vi.mock('@supabase/supabase-js', async () => {
  const { createMockClient } = await import('./helpers/supabase-mock.js');
  return { createClient: () => createMockClient() };
});

import { GET, POST, PUT, DELETE, OPTIONS } from '../api/servicos.js';

const SECRET = process.env.JWT_SECRET;

function makeRequest({ method = 'GET', body, token, url = 'http://localhost/api/servicos', origin = 'http://localhost:3000' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request(url, {
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

describe('GET /api/servicos — público', () => {
  it('retorna 200 com a lista de serviços ativos', async () => {
    supabaseState.selectResult = {
      data: [
        { id: 1, titulo: 'Site', ativo: true, ordem: 1 },
        { id: 2, titulo: 'Sistema', ativo: true, ordem: 2 },
      ],
      error: null,
    };

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].titulo).toBe('Site');
  });

  it('retorna 200 com array vazio quando não há dados', async () => {
    supabaseState.selectResult = { data: null, error: null };

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  it('retorna 500 quando o Supabase retorna erro', async () => {
    supabaseState.selectResult = { data: null, error: new Error('db down') };

    const res = await GET(makeRequest());

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Erro ao buscar serviços');
  });
});

describe('POST /api/servicos — autenticado', () => {
  it('retorna 401 sem token', async () => {
    const res = await POST(makeRequest({ method: 'POST', body: { titulo: 'X', descricao: 'Y' } }));
    expect(res.status).toBe(401);
  });

  it('retorna 201 e cria o serviço com token válido', async () => {
    supabaseState.insertResult = {
      data: { id: 9, titulo: 'Landing Page', ativo: true },
      error: null,
    };

    const res = await POST(
      makeRequest({ method: 'POST', token: validToken(), body: { titulo: 'Landing Page', descricao: 'Site institucional' } })
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(9);

    expect(supabaseState.insertCalls).toHaveLength(1);
    expect(supabaseState.insertCalls[0].data.titulo).toBe('Landing Page');
    expect(supabaseState.insertCalls[0].data.ativo).toBe(true);
  });

  it('retorna 400 sem titulo ou descricao', async () => {
    const token = validToken();

    const semTitulo = await POST(makeRequest({ method: 'POST', token, body: { descricao: 'X' } }));
    const semDescricao = await POST(makeRequest({ method: 'POST', token, body: { titulo: 'X' } }));

    expect(semTitulo.status).toBe(400);
    expect(semDescricao.status).toBe(400);
  });

  it('retorna 500 quando o insert falha no banco', async () => {
    supabaseState.insertResult = { data: null, error: new Error('db down') };

    const res = await POST(
      makeRequest({ method: 'POST', token: validToken(), body: { titulo: 'X', descricao: 'Y' } })
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Erro ao criar serviço');
  });
});

describe('PUT /api/servicos — autenticado', () => {
  it('retorna 401 sem token', async () => {
    const res = await PUT(makeRequest({ method: 'PUT', body: { id: 1 } }));
    expect(res.status).toBe(401);
  });

  it('retorna 400 sem id', async () => {
    const res = await PUT(makeRequest({ method: 'PUT', token: validToken(), body: { titulo: 'X' } }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('ID é obrigatório');
  });

  it('retorna 200 e atualiza o serviço com token válido', async () => {
    supabaseState.updateResult = { data: { id: 1, titulo: 'Atualizado' }, error: null };

    const res = await PUT(
      makeRequest({ method: 'PUT', token: validToken(), body: { id: 1, titulo: 'Atualizado' } })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.titulo).toBe('Atualizado');

    expect(supabaseState.updateCalls).toHaveLength(1);
    expect(supabaseState.updateCalls[0].data.titulo).toBe('Atualizado');
  });

  it('retorna 404 quando o update não encontra o serviço', async () => {
    supabaseState.updateResult = { data: null, error: new Error('not found') };

    const res = await PUT(
      makeRequest({ method: 'PUT', token: validToken(), body: { id: 999, titulo: 'X' } })
    );

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Serviço não encontrado');
  });
});

describe('DELETE /api/servicos — autenticado', () => {
  it('retorna 401 sem token', async () => {
    const res = await DELETE(makeRequest({ method: 'DELETE', url: 'http://localhost/api/servicos?id=1' }));
    expect(res.status).toBe(401);
  });

  it('retorna 400 sem id na query string', async () => {
    const res = await DELETE(makeRequest({ method: 'DELETE', token: validToken() }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('ID é obrigatório');
  });

  it('retorna 200 e faz soft delete com token válido', async () => {
    supabaseState.deleteResult = { data: null, error: null };

    const res = await DELETE(
      makeRequest({ method: 'DELETE', token: validToken(), url: 'http://localhost/api/servicos?id=5' })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    // Soft delete: update com ativo: false
    expect(supabaseState.updateCalls).toHaveLength(1);
    expect(supabaseState.updateCalls[0].data.ativo).toBe(false);
  });

  it('retorna 500 quando o banco falha', async () => {
    // O soft delete usa .update() — o erro vem do updateResult
    supabaseState.updateResult = { data: null, error: new Error('db down') };

    const res = await DELETE(
      makeRequest({ method: 'DELETE', token: validToken(), url: 'http://localhost/api/servicos?id=5' })
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Erro ao remover serviço');
  });
});

describe('OPTIONS /api/servicos — preflight CORS', () => {
  it('retorna 204 com allowlist de métodos', async () => {
    const res = await OPTIONS(makeRequest({ method: 'OPTIONS' }));

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
  });
});
