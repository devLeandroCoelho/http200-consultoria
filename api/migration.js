// POST /api/migration — Executa SQL de criação de tabelas e dados iniciais no Supabase
//
// Estratégia:
//   1. Se SUPABASE_SERVICE_ROLE_KEY estiver configurada → Management API (execução direta)
//   2. Fallback → retorna o SQL completo para copiar/colar no SQL Editor do Supabase
//
// Uso:
//   curl -X POST https://http200-consultoria.vercel.app/api/migration

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SUPABASE_PROJECT_REF = 'daldmwjaoerphrqlzfbw';
const SUPABASE_API_BASE = 'https://api.supabase.com';

// SQL completo: criação de tabelas, índices, dados iniciais e RLS
const SQL_MIGRATION = `
-- ============================================
-- HTTP200.TI — Script SQL para Supabase
-- Gerenciado por /api/migration
-- ============================================

-- Tabela de Serviços
CREATE TABLE IF NOT EXISTS servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  icon TEXT DEFAULT 'gear',
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Conteúdo
CREATE TABLE IF NOT EXISTS conteudo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  dados JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo);
CREATE INDEX IF NOT EXISTS idx_servicos_ordem ON servicos(ordem);
CREATE INDEX IF NOT EXISTS idx_conteudo_chave ON conteudo(chave);
CREATE INDEX IF NOT EXISTS idx_config_chave ON config(chave);

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Serviços
INSERT INTO servicos (titulo, descricao, icon, ordem, ativo) VALUES
('DevOps & Automação', 'CI/CD, Docker, infraestrutura como código e monitoramento em tempo real. Implementamos pipelines que entregam software com velocidade, segurança e confiabilidade.', 'gear', 1, true),
('Desenvolvimento Backend', 'APIs robustas com Node.js, TypeScript e Java — escaláveis, testadas e prontas para produção. Do design de arquitetura à implantação.', 'code', 2, true),
('Inteligência Artificial', 'Automação com IA, chatbots inteligentes e análise de dados que geram insight real. Não é sobre usar IA por usar — é sobre resolver problemas.', 'brain', 3, true),
('Integrações de Sistemas', 'APIs, webhooks e pontes entre sistemas legados e modernos. Conectamos o que está isolado para que seus sistemas trabalhem juntos.', 'link', 4, true),
('Processos de TI', 'Otimização de processos, indicadores de performance e governança com metodologias ágeis. A tecnologia só entrega resultado quando os processos fazem sentido.', 'chart', 5, true)
ON CONFLICT DO NOTHING;

-- Conteúdo
INSERT INTO conteudo (chave, dados) VALUES
('hero', '{"titulo": "Soluções que conectam tecnologia ao resultado", "subtitulo": "Consultoria especializada em DevOps, Backend, IA e Transformação Digital. Transformamos complexidade técnica em vantagem competitiva para o seu negócio.", "cta": "Fale Conosco"}'),
('sobre', '{"titulo": "Experiência que gera resultados reais", "texto1": "Com mais de 15 anos de experiência em TI — da infraestrutura e suporte ao desenvolvimento de software e DevOps — a HTTP200.TI nasceu da necessidade real de empresas que precisam de soluções técnicas eficientes, sem burocracia.", "texto2": "Conhecemos a dor do time de TI porque já estivemos do outro lado. Sabemos o que funciona, o que não funciona e, principalmente, o que realmente faz diferença no dia a dia da operação.", "anos": "15+", "projetos": "50+", "satisfacao": "98%"}'),
('diferenciais', '[{"titulo": "Experiência Real", "descricao": "Não somos teóricos. Cada solução já foi testada em produção."}, {"titulo": "Foco em Resultado", "descricao": "Medimos sucesso pelo impacto no seu negócio, não pelo código entregue."}, {"titulo": "Comunicação Clara", "descricao": "Sem jargão desnecessário. Você entende exatamente o que está recebendo."}, {"titulo": "Agilidade", "descricao": "Metodologias ágeis aplicadas de verdade. Entregas incrementais e rápidas."}]'),
('cta', '{"titulo": "Pronto para transformar sua operação?", "subtitulo": "Entre em contato e descubra como podemos ajudar a sua empresa a alcançar o próximo nível."}')
ON CONFLICT DO NOTHING;

-- Configurações
INSERT INTO config (chave, valor) VALUES
('email', 'http200.ti@gmail.com'),
('linkedin', 'https://linkedin.com/in/devleandrocoelho'),
('github', 'https://github.com/devLeandroCoelho')
ON CONFLICT DO NOTHING;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (anon)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Serviços são públicos para leitura' AND tablename = 'servicos') THEN
    CREATE POLICY "Serviços são públicos para leitura" ON servicos
      FOR SELECT USING (ativo = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Conteúdo é público para leitura' AND tablename = 'conteudo') THEN
    CREATE POLICY "Conteúdo é público para leitura" ON conteudo
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Config é público para leitura' AND tablename = 'config') THEN
    CREATE POLICY "Config é público para leitura" ON config
      FOR SELECT USING (true);
  END IF;
END
$$;

-- Políticas de escrita (service_role — backend)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Backend pode inserir serviços' AND tablename = 'servicos') THEN
    CREATE POLICY "Backend pode inserir serviços" ON servicos
      FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Backend pode atualizar serviços' AND tablename = 'servicos') THEN
    CREATE POLICY "Backend pode atualizar serviços" ON servicos
      FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Backend pode deletar serviços' AND tablename = 'servicos') THEN
    CREATE POLICY "Backend pode deletar serviços" ON servicos
      FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Backend pode inserir conteúdo' AND tablename = 'conteudo') THEN
    CREATE POLICY "Backend pode inserir conteúdo" ON conteudo
      FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Backend pode atualizar conteúdo' AND tablename = 'conteudo') THEN
    CREATE POLICY "Backend pode atualizar conteúdo" ON conteudo
      FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Backend pode inserir config' AND tablename = 'config') THEN
    CREATE POLICY "Backend pode inserir config" ON config
      FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Backend pode atualizar config' AND tablename = 'config') THEN
    CREATE POLICY "Backend pode atualizar config" ON config
      FOR UPDATE USING (true);
  END IF;
END
$$;
`;

/**
 * Executa SQL via Supabase Management API
 * Requer: SUPABASE_SERVICE_ROLE_KEY no env do Vercel
 */
async function executeViaManagementAPI(sql) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return { ok: false, reason: 'SUPABASE_SERVICE_ROLE_KEY não configurada' };
  }

  const url = `${SUPABASE_API_BASE}/v1/projects/${SUPABASE_PROJECT_REF}/database/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, reason: `Management API retornou ${response.status}: ${body}` };
  }

  return { ok: true };
}

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Use POST para executar a migration',
      }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Tentar execução via Management API
  if (hasServiceRole) {
    try {
      const result = await executeViaManagementAPI(SQL_MIGRATION);

      if (result.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Migration executada com sucesso via Management API!',
            method: 'management-api',
            project: SUPABASE_PROJECT_REF,
            note: 'Verifique as tabelas no painel do Supabase.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Management API falhou — retornar SQL + erro
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Management API falhou. Copie o SQL abaixo e cole no SQL Editor do Supabase.',
          method: 'management-api',
          error: result.reason,
          sql: SQL_MIGRATION.trim(),
          instructions: [
            '1. Acesse https://supabase.com/dashboard/project/daldmwjaoerphrqlzfbw/sql/new',
            '2. Cole o SQL do campo "sql" abaixo',
            '3. Clique em "Run"',
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Erro ao chamar Management API. Copie o SQL abaixo.',
          error: err.message,
          sql: SQL_MIGRATION.trim(),
          instructions: [
            '1. Acesse https://supabase.com/dashboard/project/daldmwjaoerphrqlzfbw/sql/new',
            '2. Cole o SQL do campo "sql" abaixo',
            '3. Clique em "Run"',
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  }

  // Sem SUPABASE_SERVICE_ROLE_KEY — retornar SQL para execução manual
  return new Response(
    JSON.stringify({
      success: true,
      message: 'SUPABASE_SERVICE_ROLE_KEY não configurada. Retornando SQL para execução manual.',
      method: 'manual',
      project: SUPABASE_PROJECT_REF,
      dashboard_url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`,
      sql: SQL_MIGRATION.trim(),
      instructions: [
        '1. Acesse o SQL Editor do Supabase (link acima)',
        '2. Cole o SQL do campo "sql"',
        '3. Clique em "Run"',
        '4. Para automatizar: adicione SUPABASE_SERVICE_ROLE_KEY como variável de ambiente no Vercel',
      ],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

export const config = { runtime: 'edge' };
