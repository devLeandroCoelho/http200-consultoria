/**
 * HTTP200.TI Consultoria — Setup dos testes
 *
 * Define env vars FAKE antes de qualquer import da API.
 * Os handlers leem process.env.JWT_SECRET no topo do módulo e falham
 * se ausente — por isso o setup roda ANTES da importação dos módulos.
 *
 * ⚠️ AQUI NUNCA entram credenciais reais. Valores abaixo são exclusivos
 * de teste e não existem em nenhum ambiente de produção.
 */

process.env.JWT_SECRET = 'chave-de-teste-fake-issue-4';
process.env.ADMIN_USER = 'admin-teste';
process.env.ADMIN_PASS = 'senha-teste-123';
process.env.SUPABASE_URL = 'https://supabase-mock.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-fake-de-teste';
