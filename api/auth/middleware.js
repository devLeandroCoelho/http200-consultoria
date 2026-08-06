import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'http200ti-secret-key-2026';

/**
 * Middleware de autenticação JWT para Edge Runtime.
 * Verifica o header Authorization e retorna os dados do usuário decodificados.
 * Retorna null se o token for inválido ou ausente.
 */
export function verifyAuth(req) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;

  const token = auth.split(' ')[1];
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/**
 * Wrapper para handler que exige autenticação.
 * Se autenticado, chama handler com user.
 * Se não, retorna Response 401.
 */
export function withAuth(handler) {
  return async function (req) {
    const user = verifyAuth(req);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido ou ausente' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    return handler(req, user);
  };
}
