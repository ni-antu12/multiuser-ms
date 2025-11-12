import { Prisma } from '@prisma/client';

// Selección base para exponer datos públicos de un usuario.
// Evita repetir manualmente la lista de campos cada vez que hacemos un `select`.
export const BASIC_USER_SELECT = {
  id: true,
  uuid: true,
  rut: true,
  email: true,
  firstName: true,
  lastNamePaterno: true,
  lastNameMaterno: true,
  isActive: true,
  isLeader: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

// Extiende la selección base incluyendo el campo del grupo familiar.
// Útil para endpoints que necesitan saber a qué grupo pertenece cada usuario.
export const USER_WITH_GROUP_SELECT = {
  ...BASIC_USER_SELECT,
  familyGroupsUuid: true,
} satisfies Prisma.UserSelect;

// Configuración `include` estándar para traer un grupo familiar y sus usuarios.
// Centraliza la estructura de respuesta del grupo para mantener consistencia entre consultas.
export const FAMILY_GROUP_WITH_USERS_INCLUDE = {
  users: {
    select: BASIC_USER_SELECT,
  },
} satisfies Prisma.FamilyGroupInclude;

// Variante que, además de los usuarios, agrega el conteo total.
// Se usa en listados donde queremos mostrar el número de integrantes por grupo.
export const FAMILY_GROUP_WITH_USERS_AND_COUNT_INCLUDE = {
  ...FAMILY_GROUP_WITH_USERS_INCLUDE,
  _count: {
    select: { users: true },
  },
} satisfies Prisma.FamilyGroupInclude;

