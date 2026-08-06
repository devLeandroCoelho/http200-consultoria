// GET /api — Informações da API
// Esta é a raiz da API. Retorna informações sobre os endpoints disponíveis.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Método não permitido' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const apiInfo = {
    name: 'HTTP200.TI API',
    version: '1.0.0',
    description: 'API para landing page da HTTP200.TI - Consultoria especializada em DevOps, Backend e IA',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Autenticar e obter token JWT',
        'GET /api/auth/verify': 'Verificar validade do token',
      },
      servicos: {
        'GET /api/servicos': 'Listar serviços (público)',
        'POST /api/servicos': 'Criar serviço (autenticado)',
        'PUT /api/servicos': 'Atualizar serviço (autenticado)',
        'DELETE /api/servicos?id=xxx': 'Remover serviço (autenticado)',
      },
      conteudo: {
        'GET /api/conteudo': 'Obter conteúdo da landing (público)',
        'PUT /api/conteudo': 'Atualizar conteúdo (autenticado)',
      },
      config: {
        'GET /api/config': 'Obter configurações (público)',
        'PUT /api/config': 'Atualizar configurações (autenticado)',
      },
      seed: {
        'POST /api/seed': 'Popular dados iniciais (só funciona uma vez)',
      },
      upload: {
        'POST /api/upload': 'Upload de imagem (autenticado)',
      },
      migration: {
        'POST /api/migration': 'Executar SQL de criação de tabelas e dados iniciais',
      },
    },
    docs: 'https://github.com/devLeandroCoelho/http200-consultoria',
  };

  return new Response(JSON.stringify({ success: true, data: apiInfo }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export const config = {
  runtime: 'edge',
};
