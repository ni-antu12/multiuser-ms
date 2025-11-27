import { FamilyGroup, Prisma } from '@prisma/client';
import {
  BASIC_USER_SELECT,
  FAMILY_GROUP_WITH_USERS_AND_COUNT_INCLUDE,
  FAMILY_GROUP_WITH_USERS_INCLUDE,
  USER_WITH_GROUP_SELECT,
} from '../utils/prisma-selects';

// Representa un usuario con los campos básicos expuestos por la API.
export type BasicUser = Prisma.UserGetPayload<{
  select: typeof BASIC_USER_SELECT;
}>;

// Usuario con la información del grupo familiar al que pertenece.
export type UserWithGroup = Prisma.UserGetPayload<{
  select: typeof USER_WITH_GROUP_SELECT;
}>;

// Grupo familiar acompañado del detalle de sus usuarios.
export type FamilyGroupWithUsers = Prisma.FamilyGroupGetPayload<{
  include: typeof FAMILY_GROUP_WITH_USERS_INCLUDE;
}>;

// Grupo familiar con usuarios y conteo de miembros (ideal para listados).
export type FamilyGroupWithUsersAndCount = Prisma.FamilyGroupGetPayload<{
  include: typeof FAMILY_GROUP_WITH_USERS_AND_COUNT_INCLUDE;
}>;

// Respuesta estándar del servicio al asegurar/grabar un grupo familiar
// para un usuario autenticado (incluye flags para saber si se creó algo nuevo).
export interface EnsureFamilyGroupResult {
  user: UserWithGroup;
  familyGroup: FamilyGroup;
  createdUser: boolean;
  createdGroup: boolean;
  message: string;
}


