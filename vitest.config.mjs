/**
 * HTTP200.TI Consultoria — Configuração do Vitest
 *
 * Runner de testes da API (issue #4).
 * Ambiente Node (sem DOM) e setup com env vars FAKE para os testes —
 * NUNCA carrega .env.local nem chama o Supabase de produção.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    // Restaura process.env entre arquivos de teste (evita vazamento de env)
    unstubEnvs: true,
  },
});
