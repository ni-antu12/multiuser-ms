import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface LeaderValidationResponse {
  exists: boolean;
  isLeader: boolean;
  userData?: {
    uuid: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
}

export interface PatientDataResponse {
  rut: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  birthDate: string;
  isActive: boolean;
}

@Injectable()
export class FormsMicroserviceService {
  constructor(private readonly httpService: HttpService) {}

  private readonly formsMicroserviceUrl = process.env.FORMS_MICROSERVICE_URL || 'http://localhost:3001';
  private readonly cloudRunTimeout = 30000; // 30 segundos para Cloud Run

  /**
   * Obtiene los headers necesarios para las peticiones a Cloud Run
   * @returns Headers configurados
   */
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'multiuser-ms/1.0.0'
    };
  }

  /**
   * Valida si un usuario líder existe en el microservicio de formularios dinámicos
   * @param leaderUuid UUID del usuario líder a validar
   * @returns Información del líder si existe
   */
  async validateLeader(leaderUuid: string): Promise<LeaderValidationResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.formsMicroserviceUrl}/api/users/leader/${leaderUuid}`)
      );

      return {
        exists: true,
        isLeader: response.data.isLeader || false,
        userData: response.data.userData
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          exists: false,
          isLeader: false
        };
      }

      // Si hay un error de conexión, lanzar una excepción
      throw new HttpException(
        'Error al conectar con el microservicio de formularios dinámicos',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Obtiene información detallada de un usuario líder desde el microservicio de formularios
   * @param leaderUuid UUID del usuario líder
   * @returns Datos completos del usuario líder
   */
  async getLeaderInfo(leaderUuid: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.formsMicroserviceUrl}/api/users/${leaderUuid}`)
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException(
          'Usuario líder no encontrado en el sistema de formularios dinámicos',
          HttpStatus.NOT_FOUND
        );
      }

      throw new HttpException(
        'Error al obtener información del usuario líder',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Verifica si el microservicio de formularios está disponible
   * @returns true si está disponible, false en caso contrario
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.formsMicroserviceUrl}/health`)
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene la URL del microservicio configurada
   * @returns URL del microservicio
   */
  getServiceUrl(): string {
    return this.formsMicroserviceUrl;
  }

  /**
   * Verifica si está configurado para Cloud Run
   * @returns true si es una URL de Cloud Run
   */
  isCloudRunConfigured(): boolean {
    return this.formsMicroserviceUrl.includes('run.app') || this.formsMicroserviceUrl.includes('googleapis.com');
  }

  /**
   * Registra un nuevo líder en el microservicio de formularios dinámicos
   * @param leaderUuid UUID del líder
   * @param leaderData Datos del líder
   * @returns Respuesta del registro
   */
  async registerLeader(leaderUuid: string, leaderData: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.formsMicroserviceUrl}/api/leaders`,
          {
            uuid: leaderUuid,
            ...leaderData
          },
          {
            headers: this.getHeaders(),
            timeout: this.cloudRunTimeout
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error al registrar líder en Cloud Run:', error.message);
      throw new HttpException(
        `Error al registrar líder en el microservicio de formularios dinámicos: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Actualiza un líder en el microservicio de formularios dinámicos
   * @param leaderUuid UUID del líder
   * @param leaderData Datos actualizados del líder
   * @returns Respuesta de la actualización
   */
  async updateLeader(leaderUuid: string, leaderData: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.formsMicroserviceUrl}/api/leaders/${leaderUuid}`,
          leaderData,
          {
            headers: this.getHeaders(),
            timeout: this.cloudRunTimeout
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error al actualizar líder en Cloud Run:', error.message);
      throw new HttpException(
        `Error al actualizar líder en el microservicio de formularios dinámicos: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Elimina un líder del microservicio de formularios dinámicos
   * @param leaderUuid UUID del líder
   * @returns Respuesta de la eliminación
   */
  async deleteLeader(leaderUuid: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(
          `${this.formsMicroserviceUrl}/api/leaders/${leaderUuid}`,
          {
            headers: this.getHeaders(),
            timeout: this.cloudRunTimeout
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error al eliminar líder en Cloud Run:', error.message);
      throw new HttpException(
        `Error al eliminar líder del microservicio de formularios dinámicos: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Obtiene los datos de un paciente desde la BD del centro médico por RUT
   * @param rut RUT del paciente
   * @returns Datos del paciente
   */
  async getPatientByRut(rut: string): Promise<PatientDataResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.formsMicroserviceUrl}/api/patients/${rut}`,
          {
            headers: this.getHeaders(),
            timeout: this.cloudRunTimeout
          }
        )
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException(
          'Paciente no encontrado en el sistema del centro médico',
          HttpStatus.NOT_FOUND
        );
      }

      console.error('Error al obtener datos del paciente:', error.message);
      throw new HttpException(
        `Error al obtener datos del paciente: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
