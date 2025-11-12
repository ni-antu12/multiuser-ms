// Genera un identificador corto compuesto de caracteres alfanuméricos.
// Se usa para producir UUIDs amigables (8 caracteres por defecto) sin depender de paquetes externos.
export function generateShortUuid(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let index = 0; index < length; index++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

