import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  FamilyGroup,
  Leader,
  User,
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
  CreateLeaderDto,
  UpdateLeaderDto,
  CreateMyFamilyGroupDto,
  FamilyGroupWithLeader,
  MyFamilyGroupResponse,
  ApiConfig
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor(config: ApiConfig) {
    this.api = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para manejar errores
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ===== GRUPOS FAMILIARES =====
  
  /**
   * Crear grupo familiar (flujo manual)
   */
  async createFamilyGroup(data: CreateFamilyGroupDto): Promise<FamilyGroupWithLeader> {
    const response: AxiosResponse<FamilyGroupWithLeader> = await this.api.post(
      '/multiuser/family-groups',
      data
    );
    return response.data;
  }

  /**
   * Crear mi grupo familiar (flujo centro médico)
   */
  async createMyFamilyGroup(userRut: string, data?: CreateMyFamilyGroupDto): Promise<MyFamilyGroupResponse> {
    console.log('🌐 Mobile: Llamando a /multiuser/my-family-group con RUT:', userRut);
    const response: AxiosResponse<MyFamilyGroupResponse> = await this.api.post(
      '/multiuser/my-family-group',
      data,
      {
        headers: {
          'X-User-RUT': userRut,
          'x-user-rut': userRut,
        },
      }
    );
    console.log('🌐 Mobile: Respuesta recibida:', response.data);
    return response.data;
  }

  /**
   * Obtener todos los grupos familiares
   */
  async getAllFamilyGroups(): Promise<FamilyGroup[]> {
    const response: AxiosResponse<FamilyGroup[]> = await this.api.get('/multiuser/family-groups');
    return response.data;
  }

  /**
   * Obtener grupo familiar por UUID
   */
  async getFamilyGroupByUuid(uuid: string): Promise<FamilyGroup> {
    const response: AxiosResponse<FamilyGroup> = await this.api.get(`/multiuser/family-groups/${uuid}`);
    return response.data;
  }

  /**
   * Obtener grupo familiar por UUID (alias)
   */
  async findFamilyGroupByUuid(uuid: string): Promise<FamilyGroup> {
    return this.getFamilyGroupByUuid(uuid);
  }

  /**
   * Obtener grupo familiar por token
   */
  async getFamilyGroupByToken(tokenApp: string): Promise<FamilyGroup> {
    const response: AxiosResponse<FamilyGroup> = await this.api.get(`/multiuser/family-groups/token/${tokenApp}`);
    return response.data;
  }

  /**
   * Obtener miembros de un grupo familiar
   */
  async getFamilyGroupMembers(uuid: string): Promise<User[]> {
    const response: AxiosResponse<User[]> = await this.api.get(`/multiuser/family-groups/${uuid}/users`);
    return response.data;
  }

  /**
   * Agregar miembro a un grupo familiar
   */
  async addMemberToFamilyGroup(uuid: string, memberData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/multiuser/family-groups/${uuid}/members`, memberData);
    return response.data;
  }

  /**
   * Actualizar grupo familiar
   */
  async updateFamilyGroup(uuid: string, data: UpdateFamilyGroupDto, leaderUuid?: string): Promise<FamilyGroup> {
    const headers = leaderUuid ? { 'X-Leader-UUID': leaderUuid } : {};
    const response: AxiosResponse<FamilyGroup> = await this.api.patch(
      `/multiuser/family-groups/${uuid}`,
      data,
      { headers }
    );
    return response.data;
  }

  /**
   * Eliminar grupo familiar
   */
  async deleteFamilyGroup(uuid: string, leaderUuid?: string): Promise<{ message: string }> {
    const headers = leaderUuid ? { 'X-Leader-UUID': leaderUuid } : {};
    const response: AxiosResponse<{ message: string }> = await this.api.delete(
      `/multiuser/family-groups/${uuid}`,
      { headers }
    );
    return response.data;
  }

  // ===== LÍDERES =====

  /**
   * Crear líder
   */
  async createLeader(data: CreateLeaderDto): Promise<Leader> {
    const response: AxiosResponse<Leader> = await this.api.post('/multiuser/leaders', data);
    return response.data;
  }

  /**
   * Obtener todos los líderes
   */
  async getAllLeaders(query?: string): Promise<Leader[]> {
    const response: AxiosResponse<Leader[]> = await this.api.get('/multiuser/leaders', {
      params: query ? { query } : {}
    });
    return response.data;
  }

  /**
   * Actualizar líder
   */
  async updateLeader(uuid: string, data: UpdateLeaderDto): Promise<Leader> {
    const response: AxiosResponse<Leader> = await this.api.patch(`/multiuser/leaders/${uuid}`, data);
    return response.data;
  }

  /**
   * Eliminar líder
   */
  async deleteLeader(uuid: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/multiuser/leaders/${uuid}`);
    return response.data;
  }
}

// Configuración por defecto
// NOTA: Para desarrollo local en Android, usa 10.0.2.2 en lugar de localhost
// Para iOS, puedes usar localhost o la IP de tu máquina
const defaultConfig: ApiConfig = {
  baseURL: 'http://192.168.1.10:3000/api', // Dispositivo físico en WiFi
  // baseURL: 'http://172.29.48.1:3000/api', // WSL/VPN
  // baseURL: 'http://localhost:3000/api', // iOS simulator
  timeout: 10000,
};

// Instancia singleton
export const apiService = new ApiService(defaultConfig);

// Función para actualizar la configuración
export const updateApiConfig = (newConfig: Partial<ApiConfig>) => {
  const config = { ...defaultConfig, ...newConfig };
  return new ApiService(config);
};

export default apiService;

