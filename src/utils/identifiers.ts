// Genera un UUID completo (v4) usando crypto.randomUUID si está disponible,
// o una implementación alternativa basada en Math.random
export function generateUuid(): string {
  // Usar crypto.randomUUID si está disponible (Node.js 14.17.0+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: generar UUID v4 manualmente
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Mantener compatibilidad con código existente (deprecated)
export function generateShortUuid(length = 8): string {
  console.warn('generateShortUuid is deprecated, use generateUuid() instead');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let index = 0; index < length; index++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

