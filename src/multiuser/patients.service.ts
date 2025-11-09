import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

export interface PatientRecord {
  id: number;
  rut: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  telefono: string | null;
}

@Injectable()
export class PatientsService implements OnModuleDestroy {
  private readonly logger = new Logger(PatientsService.name);
  private pool: Pool | null = null;

  constructor() {
    const connectionString =
      process.env.PATIENTS_DATABASE_URL ??
      'postgresql://patients_user:patients_pass@localhost:5434/pacientes_db';

    try {
      this.pool = new Pool({ connectionString });
    } catch (error) {
      this.logger.error('No se pudo inicializar el pool de pacientes', error as Error);
      this.pool = null;
    }
  }

  async onModuleDestroy() {
    await this.pool?.end().catch((error) => {
      this.logger.warn('Error cerrando la conexión a pacientes', error as Error);
    });
  }

  async findByRut(rawRut: string): Promise<PatientRecord | null> {
    if (!this.pool) {
      this.logger.warn('Pool de pacientes no disponible. Revisa PATIENTS_DATABASE_URL');
      return null;
    }

    const rut = rawRut.trim();

    try {
      const result = await this.pool.query(
        `
          SELECT
            id,
            rut,
            nombre,
            apellido_paterno AS "apellidoPaterno",
            apellido_materno AS "apellidoMaterno",
            correo,
            telefono
          FROM pacientes
          WHERE rut = $1
          LIMIT 1
        `,
        [rut]
      );

      if (result.rowCount === 0) {
        return null;
      }

      return result.rows[0] as PatientRecord;
    } catch (error) {
      this.logger.error(`Error consultando paciente ${rut}`, error as Error);
      return null;
    }
  }
}

