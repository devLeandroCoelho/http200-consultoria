const { kv } = require('@vercel/kv');

const SERVICOS_KEY = 'servicos';
const CONTEUDO_KEY = 'conteudo';
const CONFIG_KEY = 'config';

const DEFAULT_SERVICOS = [
  {
    id: 'srv-001',
    titulo: 'Consultoria em Infraestrutura',
    descricao: 'Planejamento, implantação e otimização de infraestrutura de TI, incluindo servidores, redes e cloud computing.',
    icone: '🖥️',
    criadoEm: new Date().toISOString()
  },
  {
    id: 'srv-002',
    titulo: 'Segurança da Informação',
    descricao: 'Auditoria, implementação de controles e monitoramento para proteger os dados e sistemas da sua empresa.',
    icone: '🔒',
    criadoEm: new Date().toISOString()
  },
  {
    id: 'srv-003',
    titulo: 'Transformação Digital',
    descricao: 'Estratégia e execução de processos de digitalização, automação e adoção de novas tecnologias.',
    icone: '🚀',
    criadoEm: new Date().toISOString()
  },
  {
    id: 'srv-004',
    titulo: 'Desenvolvimento de Software',
    descricao: 'Criação de aplicações web e mobile sob medida, com foco em performance e experiência do usuário.',
    icone: '💻',
    criadoEm: new Date().toISOString()
  },
  {
    id: 'srv-005',
    titulo: 'Suporte e Manutenção',
    descricao: 'Suporte técnico contínuo, manutenção preventiva e corretiva para garantir a disponibilidade dos sistemas.',
    icone: '🛠️',
    criadoEm: new Date().toISOString()
  }
];

const DEFAULT_CONTEUDO = {
  hero: {
    titulo: 'Soluções de TI que impulsionam seu negócio',
    subtitulo: 'Consultoria especializada em infraestrutura, segurança e transformação digital.',
    cta: 'Fale conosco'
  },
  sobre: {
    titulo: 'Sobre a HTTP200.TI',
    texto: 'Somos uma consultoria de TI focada em entregar soluções práticas, seguras e escaláveis. Com experiência em infraestrutura, cloud, segurança da informação e desenvolvimento, ajudamos empresas a alcançar seus objetivos tecnológicos.'
  },
  diferenciais: [
    { titulo: 'Experiência Comprovada', descricao: 'Anos de atuação em projetos de grande porte em diversos segmentos.' },
    { titulo: 'Foco em Resultados', descricao: 'Soluções orientadas a métricas e objetivos claros de negócio.' },
    { titulo: 'Suporte Dedicado', descricao: 'Acompanhamento próximo em todas as etapas do projeto.' },
    { titulo: 'Tecnologia de Ponta', descricao: 'Utilizamos as melhores ferramentas e práticas do mercado.' }
  ],
  cta: {
    titulo: 'Pronto para transformar sua TI?',
    subtitulo: 'Entre em contato e descubra como podemos ajudar sua empresa.'
  }
};

const DEFAULT_CONFIG = {
  email: 'contato@http200.ti',
  linkedin: 'https://linkedin.com',
  github: 'https://github.com',
  corPrimaria: '#3b82f6',
  corAccent: '#06b6d4'
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const existing = await kv.get(SERVICOS_KEY);
    const alreadySeeded = Array.isArray(existing) && existing.length > 0;

    if (alreadySeeded) {
      return res.status(200).json({
        success: true,
        message: 'Banco já populado. Nenhuma alteração feita.',
        seeded: false
      });
    }

    // Popula tudo
    await kv.set(SERVICOS_KEY, DEFAULT_SERVICOS);
    await kv.set(CONTEUDO_KEY, DEFAULT_CONTEUDO);
    await kv.set(CONFIG_KEY, DEFAULT_CONFIG);

    return res.status(201).json({
      success: true,
      message: 'Banco populado com sucesso! Serviços, conteúdo e configurações criados.',
      seeded: true,
      counts: {
        servicos: DEFAULT_SERVICOS.length,
        conteudo: Object.keys(DEFAULT_CONTEUDO).length,
        config: Object.keys(DEFAULT_CONFIG).length
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Erro ao popular banco de dados.',
      details: err.message
    });
  }
};