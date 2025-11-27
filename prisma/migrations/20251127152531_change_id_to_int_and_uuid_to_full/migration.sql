-- Migración para cambiar id a INT autoincremental y uuid a UUID completo
-- Esta migración preserva los datos existentes generando nuevos UUIDs completos

-- ===== PASO 0: Eliminar tabla patients (ya no se usa) =====
DROP TABLE IF EXISTS "patients" CASCADE;

-- ===== PASO 1: Crear mapeos de UUIDs ANTES de modificar tablas =====

-- Mapeo de usuarios: UUID corto -> UUID completo
CREATE TEMP TABLE user_uuid_mapping AS
SELECT 
    uuid as old_uuid,
    gen_random_uuid() as new_uuid
FROM "users";

-- Mapeo de grupos: UUID corto -> UUID completo (guardamos antes de modificar)
CREATE TEMP TABLE group_uuid_mapping AS
SELECT 
    uuid as old_uuid,
    gen_random_uuid() as new_uuid
FROM "family_groups";

-- ===== PASO 2: FAMILY_GROUPS TABLE =====

-- Crear nuevas columnas temporales
ALTER TABLE "family_groups" ADD COLUMN "id_new" SERIAL;
ALTER TABLE "family_groups" ADD COLUMN "uuid_new" UUID;
ALTER TABLE "family_groups" ADD COLUMN "leader_new" UUID;

-- Actualizar uuid_new usando el mapeo
UPDATE "family_groups" fg
SET uuid_new = gum.new_uuid
FROM group_uuid_mapping gum
WHERE fg.uuid = gum.old_uuid;

-- Actualizar leader_new con los nuevos UUIDs de usuarios
UPDATE "family_groups" fg
SET leader_new = um.new_uuid
FROM user_uuid_mapping um
WHERE fg.leader = um.old_uuid;

-- Eliminar restricciones y columnas viejas
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_family_groups_uuid_fkey";
DROP INDEX IF EXISTS "family_groups_uuid_key";
DROP INDEX IF EXISTS "users_uuid_key";

ALTER TABLE "family_groups" DROP CONSTRAINT IF EXISTS "family_groups_pkey";
ALTER TABLE "family_groups" DROP COLUMN "id";
ALTER TABLE "family_groups" DROP COLUMN "uuid";
ALTER TABLE "family_groups" DROP COLUMN "leader";

-- Renombrar columnas nuevas
ALTER TABLE "family_groups" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "family_groups" RENAME COLUMN "uuid_new" TO "uuid";
ALTER TABLE "family_groups" RENAME COLUMN "leader_new" TO "leader";

-- Agregar restricciones
ALTER TABLE "family_groups" ADD CONSTRAINT "family_groups_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "family_groups_uuid_key" ON "family_groups"("uuid");
CREATE UNIQUE INDEX "family_groups_leader_key" ON "family_groups"("leader");

-- ===== PASO 3: USERS TABLE =====

-- Crear nuevas columnas temporales en users
ALTER TABLE "users" ADD COLUMN "id_new" SERIAL;
ALTER TABLE "users" ADD COLUMN "uuid_new" UUID;
ALTER TABLE "users" ADD COLUMN "family_groups_uuid_new" UUID;

-- Actualizar uuid_new usando el mapeo
UPDATE "users" u
SET uuid_new = um.new_uuid
FROM user_uuid_mapping um
WHERE u.uuid = um.old_uuid;

-- Actualizar family_groups_uuid_new usando el mapeo de grupos
UPDATE "users" u
SET family_groups_uuid_new = gum.new_uuid
FROM group_uuid_mapping gum
WHERE u.family_groups_uuid = gum.old_uuid;

-- Eliminar restricciones y columnas viejas de users
DROP INDEX IF EXISTS "users_rut_key";
DROP INDEX IF EXISTS "users_email_key";
DROP INDEX IF EXISTS "users_username_key";

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_pkey";
ALTER TABLE "users" DROP COLUMN "id";
ALTER TABLE "users" DROP COLUMN "uuid";
ALTER TABLE "users" DROP COLUMN "family_groups_uuid";

-- Renombrar columnas nuevas en users
ALTER TABLE "users" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "users" RENAME COLUMN "uuid_new" TO "uuid";
ALTER TABLE "users" RENAME COLUMN "family_groups_uuid_new" TO "family_groups_uuid";

-- Agregar restricciones a users
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");
CREATE UNIQUE INDEX "users_rut_key" ON "users"("rut");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username") WHERE "username" IS NOT NULL;

-- Restaurar foreign key
ALTER TABLE "users" ADD CONSTRAINT "users_family_groups_uuid_fkey" 
    FOREIGN KEY ("family_groups_uuid") REFERENCES "family_groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- Limpiar tablas temporales
DROP TABLE IF EXISTS user_uuid_mapping;
DROP TABLE IF EXISTS group_uuid_mapping;
