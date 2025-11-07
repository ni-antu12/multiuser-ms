// Tipos para el microservicio multiusuario

export interface User {
  id: string;
  uuid: string;
  rut: string;
  familyGroupsUuid?: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isLeader: boolean;
  createdAt: string;
  updatedAt: string;
  familyGroup?: {
    uuid: string;
    leader: string;
    tokenApp: string;
  };
}

export interface FamilyGroup {
  id: string;
  uuid: string;
  leader: string;
  tokenApp: string;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
  users?: User[];
  _count?: {
    users: number;
  };
}

export interface Leader {
  id: string;
  uuid: string;
  rut: string;
  email: string;
  firstName?: string;
  lastNamePaterno?: string;
  lastNameMaterno?: string;
  isActive: boolean;
  isLeader: boolean;
  familyGroupsUuid?: string;
  createdAt: string;
  updatedAt: string;
}

// DTOs para crear/actualizar
export interface CreateFamilyGroupDto {
  uuid?: string;
  leader: string;
  tokenApp?: string;
  maxMembers?: number;
}

export interface UpdateFamilyGroupDto {
  leader?: string;
  tokenApp?: string;
  maxMembers?: number;
}

export interface CreateLeaderDto {
  uuid?: string;
  rut: string;
  email: string;
  password?: string;
  firstName?: string;
  lastNamePaterno?: string;
  lastNameMaterno?: string;
  isActive?: boolean;
}

export interface UpdateLeaderDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastNamePaterno?: string;
  lastNameMaterno?: string;
  isActive?: boolean;
}

export interface CreateMyFamilyGroupDto {
  tokenApp?: string;
}

export interface AddMemberDto {
  rut: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// Respuestas de la API
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface FamilyGroupWithLeader {
  familyGroup: FamilyGroup;
  leader: Leader;
  message: string;
}

export interface MyFamilyGroupResponse {
  familyGroup: FamilyGroup;
  user: User;
  message: string;
}

// Estados de la aplicación
export interface AppState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

// Configuración de la API
export interface ApiConfig {
  baseURL: string;
  timeout: number;
}
