CREATE TABLE IF NOT EXISTS pacientes (
  id SERIAL PRIMARY KEY,
  rut VARCHAR(12) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100),
  correo VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(30)
);

INSERT INTO pacientes (rut, nombre, apellido_paterno, apellido_materno, correo, telefono) VALUES
  ('12345678-9', 'Juan', 'Pérez', 'González', 'juan.perez@example.com', '+56911111111'),
  ('98765432-1', 'María', 'Gutiérrez', 'Soto', 'maria.gutierrez@example.com', '+56922222222'),
  ('11222333-4', 'Pedro', 'Ramírez', 'López', 'pedro.ramirez@example.com', '+56933333333'),
  ('55667788-5', 'Ana', 'Fernández', 'Mora', 'ana.fernandez@example.com', '+56944444444')
ON CONFLICT (rut) DO NOTHING;

