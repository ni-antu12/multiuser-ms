DROP TABLE IF EXISTS pacientes;

CREATE TABLE pacientes (
  id SERIAL PRIMARY KEY,
  rut VARCHAR(12) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100),
  correo VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(30),
  password VARCHAR(100) NOT NULL
);

INSERT INTO pacientes (rut, nombre, apellido_paterno, apellido_materno, correo, telefono, password) VALUES
  ('20392017-2', 'Nicolás', 'Godoy', 'Fernández', 'ni.antugb@gmail.com', '+56930155047', 'demo123'),
  ('98765432-1', 'María', 'Gutiérrez', 'Soto', 'maria.gutierrez@example.com', '+56922222222', 'demo123'),
  ('11222333-4', 'Pedro', 'Ramírez', 'López', 'pedro.ramirez@example.com', '+56933333333', 'demo123'),
  ('55667788-5', 'Ana', 'Fernández', 'Mora', 'ana.fernandez@example.com', '+56944444444', 'demo123');
