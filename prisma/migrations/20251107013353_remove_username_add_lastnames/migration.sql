/*
  Warnings:

  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."users_username_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "lastName",
ADD COLUMN     "last_name_materno" TEXT,
ADD COLUMN     "last_name_paterno" TEXT,
ALTER COLUMN "username" DROP NOT NULL;
