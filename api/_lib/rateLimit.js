// Rate limiting simples em memória (reseta a cada deploy, mas suficiente para landing page)
const rateLimitMap = new Map();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000; // 1 minuto

export function checkRateLimit(ip, limit = RATE_LIMIT) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.start > RATE_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export function getClientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export function applyRateLimit(req) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Rate limit excedido. Tente novamente em 1 minuto.' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
  return null;
}
