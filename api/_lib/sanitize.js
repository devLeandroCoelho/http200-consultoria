// Sanitização de inputs
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/<[^>]*>/g, ''); // Remove HTML tags básicas
}

export function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
