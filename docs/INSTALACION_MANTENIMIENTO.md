# Instalación y Mantenimiento

Guía completa para instalar, configurar, desarrollar y mantener el microservicio multiuser-ms.

---

## 📋 Índice

- [Requisitos Previos](#requisitos-previos)
- [Instalación Local](#instalación-local)
- [Configuración del Entorno](#configuración-del-entorno)
- [Base de Datos](#base-de-datos)
- [Desarrollo Local](#desarrollo-local)
- [Build y Producción](#build-y-producción)
- [Migraciones](#migraciones)
- [Testing](#testing)
- [Mantenimiento](#mantenimiento)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos Previos

### Software Requerido

- **Node.js**: Versión 18 o superior
- **npm**: Versión 8 o superior (incluido con Node.js)
- **PostgreSQL**: Versión 13 o superior
- **Git**: Para clonar el repositorio

### Herramientas Opcionales

- **Docker**: Para ejecutar PostgreSQL en contenedor
- **Postman** o **Insomnia**: Para probar los endpoints
- **Visual Studio Code**: Editor recomendado

### Verificar Instalaciones

```bash
# Verificar Node.js
node --version  # Debe ser >= 18.0.0

# Verificar npm
npm --version   # Debe ser >= 8.0.0

# Verificar PostgreSQL
psql --version  # Debe ser >= 13.0.0

# Verificar Git
git --version
```

---

## 🚀 Instalación Local

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd multiuser-ms
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias listadas en `package.json`:
- Dependencias de producción (NestJS, Prisma, etc.)
- Dependencias de desarrollo (TypeScript, Jest, etc.)

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/multiuser_db?schema=public"

# Aplicación
PORT=8080
NODE_ENV=development
PUBLIC_BASE_URL=http://localhost:8080
```

**Nota**: Ajusta los valores según tu configuración local de PostgreSQL.

### 4. Generar Prisma Client

```bash
npx prisma generate
```

Este comando genera el cliente de Prisma basado en el schema definido en `prisma/schema.prisma`.

### 5. Ejecutar Migraciones

```bash
npx prisma migrate dev
```

Esto:
- Aplica todas las migraciones pendientes
- Genera Prisma Client si es necesario
- Crea las tablas en la base de datos

---

## ⚙️ Configuración del Entorno

### Variables de Entorno

#### Desarrollo Local (`.env`)

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/multiuser_db?schema=public"

# Puerto de la aplicación
PORT=8080

# Entorno
NODE_ENV=development

# URL pública (usado en Swagger)
PUBLIC_BASE_URL=http://localhost:8080
```

#### Producción (Cloud Run)

Las variables se cargan desde Secret Manager. Ver [docs/GCLOUD_CONFIG.md](GCLOUD_CONFIG.md) para más detalles.

### Archivo `.env.example`

Se recomienda crear un archivo `.env.example` con valores de ejemplo (sin credenciales reales):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/multiuser_db?schema=public"
PORT=8080
NODE_ENV=development
PUBLIC_BASE_URL=http://localhost:8080
```

---

## 🗄️ Base de Datos

### Opción 1: PostgreSQL Local

#### Instalar PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Descargar desde: https://www.postgresql.org/download/windows/

#### Crear Base de Datos

```bash
# Acceder a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE multiuser_db;

# Crear usuario (opcional)
CREATE USER multiuser_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE multiuser_db TO multiuser_user;

# Salir
\q
```

### Opción 2: Docker

#### Ejecutar PostgreSQL en Docker

```bash
docker run --name multiuser-postgres \
  -e POSTGRES_USER=multiuser_user \
  -e POSTGRES_PASSWORD=tu_password \
  -e POSTGRES_DB=multiuser_db \
  -p 5432:5432 \
  -d postgres:15
```

**DATABASE_URL:**
```
postgresql://multiuser_user:tu_password@localhost:5432/multiuser_db?schema=public
```

### Opción 3: Cloud SQL (Producción)

Para producción, se recomienda usar Cloud SQL. Ver [docs/GCLOUD_CONFIG.md](GCLOUD_CONFIG.md) para configuración.

### Prisma Studio (GUI para Base de Datos)

Visualizar y editar datos directamente:

```bash
npx prisma studio
```

Abre http://localhost:5555 en el navegador.

---

## 💻 Desarrollo Local

### Modo Desarrollo

Ejecutar el servidor en modo desarrollo con hot-reload:

```bash
npm run start:dev
```

El servidor estará disponible en: `http://localhost:8080`

### Modo Debug

Ejecutar con debug habilitado:

```bash
npm run start:debug
```

Conecta el debugger en el puerto `9229` (configurable).

### Estructura de Comandos

```bash
# Desarrollo (watch mode)
npm run start:dev

# Producción compilada
npm run start:prod

# Debug
npm run start:debug

# Compilar TypeScript
npm run build

# Generar Prisma Client
npx prisma generate
```

### Hot Reload

El modo desarrollo usa `nest start --watch` que:
- Detecta cambios en archivos `.ts`
- Recompila automáticamente
- Reinicia el servidor

---

## 🏗️ Build y Producción

### Compilar el Proyecto

```bash
npm run build
```

Esto:
- Compila TypeScript a JavaScript
- Genera Prisma Client
- Crea la carpeta `dist/` con el código compilado

### Verificar el Build

```bash
# Verificar que dist/src/main.js existe
ls -la dist/src/main.js

# Ejecutar versión compilada
node dist/src/main.js
```

### Dockerfile

El proyecto incluye un `Dockerfile` para construir la imagen:

```dockerfile
FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/src/main.js"]
```

#### Construir Imagen Docker

```bash
docker build -t multiuser-ms:latest .
```

#### Ejecutar Contenedor

```bash
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  multiuser-ms:latest
```

### Despliegue en Cloud Run

Ver [docs/GCLOUD_CONFIG.md](GCLOUD_CONFIG.md) para instrucciones completas de despliegue.

---

## 🔄 Migraciones

### Crear Nueva Migración

Cuando modifiques `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name descripcion_cambio
```

Esto:
- Crea una nueva migración en `prisma/migrations/`
- Aplica la migración a la base de datos
- Genera Prisma Client actualizado

### Aplicar Migraciones en Producción

**Opción 1: Automático (Cloud Build)**
Las migraciones se ejecutan automáticamente en cada despliegue.

**Opción 2: Manual**
```bash
npx prisma migrate deploy
```

Este comando:
- Solo aplica migraciones pendientes
- No crea nuevas migraciones
- Es seguro para producción

### Resetear Base de Datos (⚠️ Solo Desarrollo)

```bash
npx prisma migrate reset
```

**ADVERTENCIA**: Esto elimina todos los datos y vuelve a aplicar las migraciones.

### Estado de Migraciones

```bash
# Ver migraciones aplicadas
npx prisma migrate status

# Ver historial de migraciones
ls -la prisma/migrations/
```

### Resolver Conflictos de Migración

Si hay conflictos:

1. **Revisar el estado:**
   ```bash
   npx prisma migrate status
   ```

2. **Marcar migración como aplicada (si ya se aplicó manualmente):**
   ```bash
   npx prisma migrate resolve --applied nombre_migracion
   ```

3. **Marcar migración como revertida (si necesita revertirse):**
   ```bash
   npx prisma migrate resolve --rolled-back nombre_migracion
   ```

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Modo watch (re-ejecuta al cambiar archivos)
npm run test:watch

# Con cobertura
npm run test:cov
```

### Estructura de Tests

Los tests están en archivos `*.spec.ts` junto a los archivos que prueban:

```
src/
├── multiuser/
│   ├── multiuser.controller.spec.ts
│   └── multiuser.service.spec.ts
```

### Ejemplo de Test

```typescript
describe('MultiuserService', () => {
  it('should create a family group', async () => {
    // Test implementation
  });
});
```

---

## 🔧 Mantenimiento

### Actualizar Dependencias

#### Verificar Versiones Desactualizadas

```bash
npm outdated
```

#### Actualizar Dependencias

```bash
# Actualizar todas (cuidado con cambios breaking)
npm update

# Actualizar una específica
npm install paquete@latest

# Actualizar todas a última versión (puede romper cosas)
npm install paquete@latest --save
```

#### Actualizar Prisma

```bash
# Actualizar Prisma CLI
npm install -D prisma@latest

# Actualizar Prisma Client
npm install @prisma/client@latest

# Regenerar cliente
npx prisma generate
```

### Limpiar y Reconstruir

```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar build
rm -rf dist
npm run build

# Regenerar Prisma Client
npx prisma generate
```

### Logs y Monitoreo

#### Logs en Desarrollo

Los logs se muestran en la consola. Para más detalles:

```typescript
// En el código
console.log('Debug info:', data);
```

#### Logs en Producción (Cloud Run)

```bash
# Ver logs recientes
gcloud run services logs read multiuser-ms \
  --region=southamerica-west1 \
  --limit=50

# Seguir logs en tiempo real
gcloud run services logs tail multiuser-ms \
  --region=southamerica-west1
```

### Backup de Base de Datos

#### Backup Manual

```bash
# Backup completo
pg_dump -U usuario -d multiuser_db > backup_$(date +%Y%m%d).sql

# Backup solo esquema
pg_dump -U usuario -d multiuser_db --schema-only > schema_backup.sql

# Backup solo datos
pg_dump -U usuario -d multiuser_db --data-only > data_backup.sql
```

#### Restaurar Backup

```bash
psql -U usuario -d multiuser_db < backup_20251128.sql
```

### Monitoreo de Performance

#### Prisma Query Logging

En desarrollo, habilitar logs de queries:

```typescript
// prisma/prisma.service.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

#### Métricas en Cloud Run

- Requests por segundo
- Latencia (p50, p95, p99)
- Errores (4xx, 5xx)
- Utilización de CPU/Memoria

Acceder en: Cloud Console → Cloud Run → multiuser-ms → Métricas

---

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Error: "Cannot find module '@prisma/client'"

**Solución:**
```bash
npx prisma generate
npm install
```

#### 2. Error: "P3006 - Migration failed"

**Causa**: Conflicto en el schema o datos existentes.

**Solución:**
- Revisar la migración en `prisma/migrations/`
- Si es desarrollo, considerar `npx prisma migrate reset`
- Si es producción, revisar manualmente y aplicar SQL

#### 3. Error: "Connection refused" (PostgreSQL)

**Causa**: PostgreSQL no está ejecutándose o la URL es incorrecta.

**Solución:**
```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql  # Linux
brew services list                 # macOS

# Verificar la URL en .env
echo $DATABASE_URL

# Probar conexión
psql $DATABASE_URL
```

#### 4. Error: "Port 8080 already in use"

**Solución:**
```bash
# Cambiar el puerto en .env
PORT=8081

# O matar el proceso en el puerto 8080
# Linux/macOS:
lsof -ti:8080 | xargs kill -9

# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

#### 5. Error: "Module not found" después de instalar dependencias

**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 6. Error: Prisma Client desactualizado

**Solución:**
```bash
npx prisma generate
npm run build
```

#### 7. Error: "Invalid RUT format" en requests

**Causa**: El header `X-User-RUT` tiene formato incorrecto.

**Solución**: Asegurar que el RUT tenga formato `12345678-9` (con guión y dígito verificador).

### Debugging

#### Habilitar Logs Detallados

En `src/main.ts`, agregar:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log', 'debug', 'verbose'],
});
```

#### Debugging con VS Code

Crear `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "port": 9229,
      "console": "integratedTerminal"
    }
  ]
}
```

#### Inspeccionar Base de Datos

```bash
# Abrir Prisma Studio
npx prisma studio

# Conectar con psql
psql $DATABASE_URL

# Ver tablas
\dt

# Ver datos de una tabla
SELECT * FROM users LIMIT 10;
```

---

## 📚 Recursos Adicionales

- [Documentación de NestJS](https://docs.nestjs.com/)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Cloud Run](https://cloud.google.com/run/docs)
- [Documentación del Proyecto](PROYECTO.md)
- [Configuración de GCloud](GCLOUD_CONFIG.md)

---

**Última actualización**: 2025-11-28

