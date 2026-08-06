import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'http200ti-secret-key-2026';

export function verifyToken(req) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;

  const token = auth.split(' ')[1];
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function generateToken(user) {
  return jwt.sign({ user, role: 'admin' }, SECRET, { expiresIn: '24h' });
}
