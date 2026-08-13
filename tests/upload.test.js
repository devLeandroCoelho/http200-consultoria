/**
 * HTTP200.TI Consultoria — Testes de upload (api/upload.js)
 *
 * Cobre: autorização (401 sem/inválido), validações de payload
 * (filename/data obrigatórios), whitelist de extensões, limite de 2MB
 * e tratamento de erros. Nenhum arquivo real é enviado a lugar algum.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { POST, OPTIONS } from '../api/upload.js';

const SECRET = process.env.JWT_SECRET;

function makeRequest({ method = 'POST', body, token, origin = 'http://localhost:3000' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request('http://localhost/api/upload', {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function validToken() {
  return jwt.sign({ user: 'admin-teste', role: 'admin' }, SECRET, { expiresIn: '1h' });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/upload — autorização', () => {
  it('retorna 401 sem token', async () => {
    const res = await POST(makeRequest({ body: { filename: 'foto.jpg', data: 'AA' } }));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Não autorizado');
  });

  it('retorna 401 com token inválido', async () => {
    const token = jwt.sign({ user: 'x' }, 'segredo-errado', { expiresIn: '1h' });
    const res = await POST(makeRequest({ token, body: { filename: 'foto.jpg', data: 'AA' } }));

    expect(res.status).toBe(401);
  });
});

describe('POST /api/upload — validações de payload', () => {
  it('retorna 201 para upload válido com token', async () => {
    const res = await POST(
      makeRequest({ token: validToken(), body: { filename: 'logo.png', data: 'data:image/png;base64,iVBORw0KGgo=' } })
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.filename).toBe('logo.png');
    expect(json.data.url).toContain('data:image/png');
  });

  it('retorna 400 sem filename ou sem data', async () => {
    const token = validToken();
    const semFilename = await POST(makeRequest({ token, body: { data: 'AA' } }));
    const semData = await POST(makeRequest({ token, body: { filename: 'a.png' } }));

    expect(semFilename.status).toBe(400);
    expect(semData.status).toBe(400);
    for (const res of [semFilename, semData]) {
      const json = await res.json();
      expect(json.error).toBe('Nome e dados são obrigatórios');
    }
  });

  it('retorna 400 para extensão fora da allowlist', async () => {
    const token = validToken();

    const res = await POST(makeRequest({ token, body: { filename: 'virus.exe', data: 'AA' } }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Tipo não permitido');
  });

  it('aceita todas as extensões permitidas (.jpg .jpeg .png .svg)', async () => {
    const token = validToken();
    const allowed = ['a.jpg', 'a.jpeg', 'a.png', 'a.svg'];

    for (const filename of allowed) {
      const res = await POST(makeRequest({ token, body: { filename, data: 'AA' } }));
      expect(res.status).toBe(201);
    }
  });

  it('retorna 400 para arquivo acima de 2MB', async () => {
    const token = validToken();
    // base64 de ~2,2MB → > 2MB após conversão (len * 3/4)
    const bigBase64 = 'A'.repeat(2_900_000);

    const res = await POST(makeRequest({ token, body: { filename: 'grande.png', data: bigBase64 } }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Arquivo muito grande');
  });

  it('retorna 500 com corpo JSON inválido', async () => {
    const token = validToken();

    const res = await POST(
      new Request('http://localhost/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: '{quebrado',
      })
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Erro ao processar upload');
  });
});

describe('OPTIONS /api/upload — preflight CORS', () => {
  it('retorna 204 com allowlist de métodos', async () => {
    const res = await OPTIONS(makeRequest({ method: 'OPTIONS' }));

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
  });
});
