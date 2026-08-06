const { kv } = require('@vercel/kv');
const { withAuth } = require('./auth/middleware');

const KEY = 'config';

const DEFAULT_CONFIG = {
  email: 'contato@http200.ti',
  linkedin: 'https://linkedin.com',
  github: 'https://github.com',
  corPrimaria: '#3b82f6',
  corAccent: '#06b6d4'
};

/* GET — público */
const publicHandler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      let config = await kv.get(KEY);
      if (!config) config = DEFAULT_CONFIG;
      return res.status(200).json(config);
    } catch (err) {
      return res.status(200).json(DEFAULT_CONFIG);
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
};

/* PUT — autenticado */
const authHandler = withAuth(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'PUT') {
    try {
      const config = req.body || {};
      await kv.set(KEY, config);
      return res.status(200).json({ success: true, config });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao salvar configurações.' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
});

module.exports = async function (req, res) {
  if (req.method === 'GET') {
    return publicHandler(req, res);
  }
  return authHandler(req, res);
};