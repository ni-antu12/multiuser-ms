// Funciones de ayuda para encapsular la lógica SQL directa sobre la tabla `patients`.
// Mantienen la construcción de consultas crudas fuera del servicio principal.

interface RawExecutor {
  $queryRaw<T = unknown>(query: any, ...params: any[]): Promise<T>;
  $executeRaw(query: any, ...params: any[]): Promise<unknown>;
}

export interface PatientRecord {
  rut: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  telefono: string | null;
  password: string;
}

export interface UpsertPatientInput {
  rut: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  correo: string;
  telefono?: string | null;
  password?: string | null;
}

export async function findPatientByRut(
  executor: RawExecutor,
  rut: string,
): Promise<PatientRecord | null> {
  const result = await executor.$queryRaw<Array<{
    rut: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    correo: string;
    telefono: string | null;
    password: string;
  }>>`
    SELECT rut, nombre, apellido_paterno, apellido_materno, correo, telefono, password
    FROM "patients"
    WHERE rut = ${rut}
    LIMIT 1
  `;

  const patient = result[0];

  if (!patient) {
    return null;
  }

  return {
    rut: patient.rut,
    nombre: patient.nombre,
    apellidoPaterno: patient.apellido_paterno,
    apellidoMaterno: patient.apellido_materno,
    correo: patient.correo,
    telefono: patient.telefono,
    password: patient.password,
  };
}

export async function upsertPatientRecord(
  executor: RawExecutor,
  data: UpsertPatientInput,
): Promise<void> {
  await executor.$executeRaw`
    INSERT INTO "patients" (rut, nombre, apellido_paterno, apellido_materno, correo, telefono, password)
    VALUES (${data.rut}, ${data.nombre}, ${data.apellidoPaterno}, ${data.apellidoMaterno ?? null}, ${data.correo}, ${data.telefono ?? null}, ${data.password ?? 'demo123'})
    ON CONFLICT (rut)
    DO UPDATE SET
      nombre = EXCLUDED.nombre,
      apellido_paterno = EXCLUDED.apellido_paterno,
      apellido_materno = EXCLUDED.apellido_materno,
      correo = EXCLUDED.correo,
      telefono = EXCLUDED.telefono,
      updated_at = CURRENT_TIMESTAMP
  `;
}

