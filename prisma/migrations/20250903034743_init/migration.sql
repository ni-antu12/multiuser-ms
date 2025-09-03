-- CreateTable
CREATE TABLE "family_groups" (
    "id" TEXT NOT NULL,
    "uuid" VARCHAR(8) NOT NULL,
    "leader" VARCHAR(8) NOT NULL,
    "token_app" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "uuid" VARCHAR(8) NOT NULL,
    "rut" TEXT NOT NULL,
    "family_groups_uuid" VARCHAR(8),
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "is_leader" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_groups_uuid_key" ON "family_groups"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_rut_key" ON "users"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_family_groups_uuid_fkey" FOREIGN KEY ("family_groups_uuid") REFERENCES "family_groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
