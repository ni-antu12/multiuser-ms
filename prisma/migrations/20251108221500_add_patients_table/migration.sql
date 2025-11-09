CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "patients" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "rut" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "apellido_paterno" TEXT NOT NULL,
  "apellido_materno" TEXT,
  "correo" TEXT NOT NULL,
  "telefono" TEXT,
  "password" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "patients_rut_key" ON "patients"("rut");
CREATE UNIQUE INDEX "patients_correo_key" ON "patients"("correo");

INSERT INTO "patients" (rut, nombre, apellido_paterno, apellido_materno, correo, telefono, password)
VALUES
  ('20392017-2', 'Nicolás', 'Godoy', 'Fernández', 'ni.antugb@gmail.com', '+56930155047', 'demo123'),
  ('98765432-1', 'María', 'Gutiérrez', 'Soto', 'maria.gutierrez@example.com', '+56922222222', 'demo123'),
  ('11222333-4', 'Pedro', 'Ramírez', 'López', 'pedro.ramirez@example.com', '+56933333333', 'demo123'),
  ('55667788-5', 'Ana', 'Fernández', 'Mora', 'ana.fernandez@example.com', '+56944444444', 'demo123')
ON CONFLICT (rut) DO NOTHING;

