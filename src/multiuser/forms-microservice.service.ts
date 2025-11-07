import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FormsMicroserviceService {
  private readonly logger = new Logger(FormsMicroserviceService.name);
  private readonly formsMicroserviceUrl = process.env.FORMS_MICROSERVICE_URL || 'http://localhost:3001';
  private readonly cloudRunTimeout = 10000; // 10 segundos

  constructor(private readonly httpService: HttpService) {}

  /**
   * Obtiene los headers para las peticiones HTTP
   */
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'multiuser-ms/1.0.0'
    };
  }

  /**
   * Valida si un líder existe en el microservicio de formularios
   * @param leaderUuid UUID del líder
   * @returns Información de validación
   */
  async validateLeader(leaderUuid: string): Promise<{ exists: boolean; data?: any }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.formsMicroserviceUrl}/api/leaders/${leaderUuid}`,
          {
            headers: this.getHeaders(),
            timeout: this.cloudRunTimeout
          }
        )
      );
      
      return {
        exists: true,
        data: response.data
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      
      this.logger.warn(`Error al validar líder ${leaderUuid}:`, error.message);
      return { exists: false };
    }
  }
}