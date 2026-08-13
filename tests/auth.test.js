/**
 * HTTP200.TI Consultoria — Testes de autenticação (api/auth.js)
 *
 * Cobre: login (credenciais ok/inválidas/ausentes), emissão e validação
 * de JWT, 401 com token ausente/inválido/expirado e tratamento de erros.
 * Usa JWT_SECRET de teste (tests/setup.js) — nunca credenciais reais.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { GET, POST, OPTIONS } from '../api/auth.js';

const SECRET = process.env.JWT_SECRET;
const VALID_USER = process.env.ADMIN_USER;
const VALID_PASS = process.env.ADMIN_PASS;

/** Monta um Request Web API coerente com o que a Vercel entrega ao handler. */
function makeRequest({ method = 'POST', body, token, origin = 'http://localhost:3000' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request('http://localhost/api/auth', {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function signToken(payload, options) {
  return jwt.sign(payload, SECRET, options);
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubEnv('ADMIN_USER', VALID_USER);
  vi.stubEnv('ADMIN_PASS', VALID_PASS);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/auth — login', () => {
  it('retorna 200 e um JWT válido com credenciais corretas', async () => {
    const res = await POST(makeRequest({ body: { usuario: VALID_USER, senha: VALID_PASS } }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user).toBe(VALID_USER);
    expect(json.data.expiresIn).toBe('24h');

    const decoded = jwt.verify(json.data.token, SECRET);
    expect(decoded.user).toBe(VALID_USER);
    expect(decoded.role).toBe('admin');
  });

  it('retorna 401 com credenciais inválidas', async () => {
    const res = await POST(makeRequest({ body: { usuario: VALID_USER, senha: 'senha-errada' } }));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Credenciais inválidas');
  });

  it('retorna 400 quando usuario ou senha estão ausentes', async () => {
    const semUsuario = await POST(makeRequest({ body: { senha: VALID_PASS } }));
    const semSenha = await POST(makeRequest({ body: { usuario: VALID_USER } }));
    const vazio = await POST(makeRequest({ body: {} }));

    expect(semUsuario.status).toBe(400);
    expect(semSenha.status).toBe(400);
    expect(vazio.status).toBe(400);

    for (const res of [semUsuario, semSenha, vazio]) {
      const json = await res.json();
      expect(json.error).toBe('Usuário e senha são obrigatórios');
    }
  });

  it('retorna 500 quando ADMIN_USER/ADMIN_PASS não estão configurados', async () => {
    vi.stubEnv('ADMIN_USER', '');
    vi.stubEnv('ADMIN_PASS', '');

    const res = await POST(makeRequest({ body: { usuario: VALID_USER, senha: VALID_PASS } }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Erro de configuração do servidor');
  });

  it('retorna 500 quando o corpo não é JSON válido (tratamento de erro)', async () => {
    const res = await POST(
      new Request('http://localhost/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"usuario": quebrado',
      })
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Erro interno do servidor');
  });
});

describe('GET /api/auth — validação de token', () => {
  it('retorna 200 (valid: true) com token válido', async () => {
    const token = signToken({ user: VALID_USER, role: 'admin' }, { expiresIn: '1h' });
    const res = await GET(makeRequest({ method: 'GET', token }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.valid).toBe(true);
    expect(json.data.user).toBe(VALID_USER);
    expect(json.data.role).toBe('admin');
    expect(typeof json.data.exp).toBe('number');
  });

  it('retorna 401 sem header Authorization', async () => {
    const res = await GET(makeRequest({ method: 'GET' }));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.error).toBe('Token inválido ou expirado');
  });

  it('retorna 401 com header Authorization fora do formato Bearer', async () => {
    const token = signToken({ user: 'x' }, { expiresIn: '1h' });
    const res = await GET(
      new Request('http://localhost/api/auth', {
        method: 'GET',
        headers: { Authorization: `Token ${token}` },
      })
    );

    expect(res.status).toBe(401);
  });

  it('retorna 401 com token inválido (assinatura errada)', async () => {
    const token = jwt.sign({ user: 'admin' }, 'outro-segredo-qualquer', { expiresIn: '1h' });
    const res = await GET(makeRequest({ method: 'GET', token }));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.valid).toBe(false);
  });

  it('retorna 401 com token expirado', async () => {
    const expPassado = Math.floor(Date.now() / 1000) - 60;
    const token = signToken({ user: VALID_USER, role: 'admin', exp: expPassado });
    const res = await GET(makeRequest({ method: 'GET', token }));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.valid).toBe(false);
  });
});

describe('OPTIONS /api/auth — preflight CORS', () => {
  it('retorna 204 com allowlist de métodos', async () => {
    const res = await OPTIONS(makeRequest({ method: 'OPTIONS' }));

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
  });
});
