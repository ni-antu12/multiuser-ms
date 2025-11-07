/**
 * Formatea un RUT agregando el guion automáticamente
 * @param value - El valor del RUT sin formatear
 * @returns El RUT formateado con guion (ej: 12345678-9)
 */
export const formatRut = (value: string): string => {
  // Eliminar todo excepto números y la letra K/k
  let cleaned = value.replace(/[^0-9kK]/g, '');
  
  // Si está vacío, retornar vacío
  if (!cleaned) return '';
  
  // Separar el dígito verificador (último carácter) del resto
  const length = cleaned.length;
  
  if (length <= 1) {
    return cleaned.toUpperCase();
  }
  
  // Tomar los últimos 9 caracteres (8 dígitos + 1 verificador)
  cleaned = cleaned.slice(-9);
  
  // Separar el cuerpo (hasta 8 dígitos) del verificador
  const body = cleaned.slice(0, -1);
  const verifier = cleaned.slice(-1).toUpperCase();
  
  // Si solo hay un carácter, retornarlo
  if (cleaned.length === 1) {
    return cleaned.toUpperCase();
  }
  
  // Formatear: cuerpo + guion + verificador
  return `${body}-${verifier}`;
};

/**
 * Maneja el cambio de input para RUT, formateándolo automáticamente
 */
export const handleRutChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setValue: (value: string) => void
) => {
  const formatted = formatRut(e.target.value);
  setValue(formatted);
};

