
-- ============================================
-- HTTP200.TI — Script SQL para Supabase
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

-- ============================================
-- ISSUE #17 — Loja de Templates Digitais
-- ============================================

-- Tabela de Produtos (template kits)
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  imagem_url TEXT DEFAULT '',
  categoria TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pedidos (compras de templates)
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  email_cliente TEXT NOT NULL,
  whatsapp TEXT DEFAULT '',
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  produto_nome TEXT NOT NULL,
  produto_preco DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'entregue', 'cancelado')),
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo);
CREATE INDEX IF NOT EXISTS idx_servicos_ordem ON servicos(ordem);
CREATE INDEX IF NOT EXISTS idx_conteudo_chave ON conteudo(chave);
CREATE INDEX IF NOT EXISTS idx_config_chave ON config(chave);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_produto ON pedidos(produto_id);

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
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (anon)
CREATE POLICY "Serviços são públicos para leitura" ON servicos
  FOR SELECT USING (ativo = true);

CREATE POLICY "Conteúdo é público para leitura" ON conteudo
  FOR SELECT USING (true);

CREATE POLICY "Config é público para leitura" ON config
  FOR SELECT USING (true);

CREATE POLICY "Produtos ativos são públicos para leitura" ON produtos
  FOR SELECT USING (ativo = true);

CREATE POLICY "Pedidos são públicos para INSERT (qualquer pessoa pode comprar)" ON pedidos
  FOR INSERT WITH CHECK (true);

-- Políticas de escrita — RESTRITAS a service_role (fix MAJOR auditoria 13/08)
CREATE POLICY "Backend pode inserir serviços" ON servicos
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Backend pode atualizar serviços" ON servicos
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Backend pode deletar serviços" ON servicos
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Backend pode inserir conteúdo" ON conteudo
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Backend pode atualizar conteúdo" ON conteudo
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Backend pode inserir config" ON config
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Backend pode atualizar config" ON config
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Backend pode gerenciar produtos" ON produtos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Backend pode gerenciar pedidos" ON pedidos
  FOR ALL USING (auth.role() = 'service_role');
