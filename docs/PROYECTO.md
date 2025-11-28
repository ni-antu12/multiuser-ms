# Documentación del Proyecto

Documentación completa sobre el microservicio multiuser-ms: arquitectura, funcionalidades, reglas de negocio, seguridad y diseño.

---

## 📋 Índice

- [Resumen](#resumen)
- [Arquitectura](#arquitectura)
- [Reglas de Negocio](#reglas-de-negocio)
- [Funcionalidades](#funcionalidades)
- [Autenticación y Seguridad](#autenticación-y-seguridad)
- [Base de Datos](#base-de-datos)
- [API Endpoints](#api-endpoints)
- [Flujo de Datos](#flujo-de-datos)
- [Configuraciones](#configuraciones)

---

## 🎯 Resumen

**multiuser-ms** es un microservicio desarrollado con **NestJS** que gestiona usuarios y grupos familiares. Está diseñado para ser consumido por una aplicación móvil que ya maneja autenticación externa. El servicio garantiza que cada usuario autenticado tenga un grupo familiar propio y sea líder del mismo.

### Características Principales

- ✅ Gestión automática de grupos familiares
- ✅ Autenticación basada en RUT (no JWT)
- ✅ Límite de 8 miembros por grupo familiar
- ✅ Creación automática de usuarios y grupos al primer acceso
- ✅ Interceptor automático que garantiza grupo familiar en cada request

---

## 🏗️ Arquitectura

### Stack Tecnológico

- **Framework**: NestJS (Node.js/TypeScript)
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Documentación**: Swagger/OpenAPI
- **Validación**: class-validator, class-transformer
- **Encriptación**: bcryptjs

### Estructura del Proyecto

```
src/
├── auth/                          # Autenticación y autorización
│   ├── guards/                    # Guards de autenticación
│   │   └── rut-auth.guard.ts     # Guard basado en RUT
│   ├── interceptors/              # Interceptores
│   │   └── ensure-family-group-from-rut.interceptor.ts
│   └── decorators/                # Decoradores personalizados
│       ├── public.decorator.ts   # Marca endpoints como públicos
│       └── user.decorator.ts     # Extrae usuario del request
├── multiuser/                     # Módulo principal
│   ├── dto/                       # Data Transfer Objects
│   ├── multiuser.controller.ts   # Controlador REST
│   └── multiuser.service.ts      # Lógica de negocio
├── prisma/                        # Servicio de Prisma
│   └── prisma.service.ts
├── utils/                         # Utilidades
│   └── identifiers.ts            # Generación de UUIDs
└── main.ts                        # Bootstrap de la aplicación
```

### Patrones de Diseño

1. **MVC (Model-View-Controller)**: Separación clara entre controladores y servicios
2. **Guards e Interceptors**: Para autenticación y lógica transversal
3. **DTOs (Data Transfer Objects)**: Validación de entrada con class-validator
4. **Dependency Injection**: Gestión de dependencias por NestJS

---

## 📜 Reglas de Negocio

### Grupos Familiares

1. **Un usuario = Un grupo familiar**
   - Cada usuario autenticado automáticamente tiene su grupo familiar
   - El usuario es automáticamente líder de su grupo

2. **Límite de miembros**
   - Máximo **8 miembros** por grupo familiar
   - El líder cuenta como miembro #1

3. **Líder único**
   - Solo puede haber un líder por grupo familiar
   - El líder es identificado por el campo `leader` en `FamilyGroup`
   - Un usuario solo puede ser líder de un grupo (constraint único)

4. **Creación automática**
   - Si un usuario no tiene grupo familiar, se crea automáticamente
   - Si un usuario no existe, se crea automáticamente con datos mínimos

5. **Restricciones**
   - Un usuario solo puede pertenecer a un grupo familiar a la vez
   - Si un usuario ya pertenece a un grupo, no puede ser agregado a otro
   - El líder no puede abandonar su grupo sin transferir el liderazgo

### Usuarios

1. **Identificación por RUT**
   - El RUT es único e identificador principal
   - Formato validado: `^\d{1,8}-[\dkK]$`

2. **Campos obligatorios**
   - `rut`: Identificador único
   - `email`: Email único
   - `password`: Contraseña encriptada (bcrypt)

3. **Campos opcionales**
   - `firstName`, `lastNamePaterno`, `lastNameMaterno`
   - Si no se proporcionan, se usan valores por defecto

4. **Estados**
   - `isActive`: Usuario activo o inactivo (default: true)
   - `isLeader`: Indica si es líder de un grupo (default: false)

### Miembros

1. **Agregar miembros**
   - Solo el líder puede agregar miembros
   - El grupo no debe estar lleno (máx. 8 miembros)
   - El RUT del miembro no debe estar en otro grupo

2. **Eliminar miembros**
   - Solo el líder puede eliminar miembros
   - El líder no puede eliminarse a sí mismo
   - Si un miembro es eliminado, se remueve su asociación al grupo

3. **Abandonar grupo**
   - Los miembros pueden abandonar su grupo
   - El líder NO puede abandonar sin transferir liderazgo o eliminar el grupo

### Validaciones de Negocio

1. **Límite de miembros**: Se verifica antes de agregar un nuevo miembro
2. **Unicidad de líder**: Un usuario solo puede ser líder de un grupo
3. **Pertenencia única**: Un usuario solo puede pertenecer a un grupo a la vez
4. **Formato RUT**: Validación estricta del formato chileno de RUT

---

## ⚙️ Funcionalidades

### 1. Gestión de Grupos Familiares

#### Crear/Obtener Grupo Familiar
- **Endpoint**: `POST /api/v1/multiuser/my-family-group`
- **Descripción**: Garantiza que el usuario tenga un grupo familiar
- **Automático**: Se crea si no existe
- **Headers requeridos**: `X-User-RUT`

#### Listar Todos los Grupos
- **Endpoint**: `GET /api/v1/multiuser/family-groups`
- **Descripción**: Obtiene todos los grupos familiares (con miembros y conteo)

#### Obtener Grupo por UUID
- **Endpoint**: `GET /api/v1/multiuser/family-groups/:uuid`
- **Descripción**: Obtiene un grupo específico con sus miembros

#### Actualizar Grupo
- **Endpoint**: `PATCH /api/v1/multiuser/family-groups/:uuid`
- **Descripción**: Actualiza propiedades del grupo (solo el líder)

#### Eliminar Grupo
- **Endpoint**: `DELETE /api/v1/multiuser/family-groups/:uuid`
- **Descripción**: Elimina un grupo familiar (solo el líder)

### 2. Gestión de Miembros

#### Agregar Miembro
- **Endpoint**: `POST /api/v1/multiuser/family-groups/:uuid/members`
- **Descripción**: Agrega un nuevo miembro al grupo
- **Restricciones**: 
  - Solo el líder puede agregar
  - Máximo 8 miembros
  - El miembro no debe estar en otro grupo

#### Eliminar Miembro
- **Endpoint**: `DELETE /api/v1/multiuser/family-groups/:uuid/members/:memberUuid`
- **Descripción**: Elimina un miembro del grupo (solo el líder)

#### Abandonar Grupo
- **Endpoint**: `POST /api/v1/multiuser/family-groups/:uuid/leave`
- **Descripción**: Permite a un miembro abandonar su grupo
- **Restricción**: El líder no puede abandonar

### 3. Gestión de Usuarios/Líderes

#### Inicializar Sesión
- **Endpoint**: `POST /api/v1/multiuser/session/init`
- **Descripción**: Inicializa la sesión del usuario y garantiza grupo familiar
- **Body opcional**: Datos del usuario (email, nombres, etc.)

#### Obtener Mi Grupo Familiar
- **Endpoint**: `GET /api/v1/multiuser/my-family-group`
- **Descripción**: Obtiene el grupo familiar del usuario autenticado

#### Obtener Usuarios por Grupo
- **Endpoint**: `GET /api/v1/multiuser/family-groups/:uuid/users`
- **Descripción**: Lista todos los usuarios de un grupo

### 4. Utilidades

#### Health Check
- **Endpoint**: `GET /api/v1/multiuser/health`
- **Descripción**: Verifica que el servicio esté funcionando
- **Público**: No requiere autenticación

---

## 🔐 Autenticación y Seguridad

### Autenticación por RUT

El servicio utiliza autenticación basada en **RUT** enviado en el header `X-User-RUT`. **No se usa JWT**.

#### RutAuthGuard

El `RutAuthGuard` se aplica globalmente a todos los endpoints (excepto los marcados como `@Public()`):

1. **Verifica el header**: `X-User-RUT`
2. **Valida el formato**: RUT chileno válido (`12345678-9`)
3. **Busca el usuario**: En la base de datos por RUT
4. **Agrega al request**: El usuario encontrado (o el RUT si no existe aún)

**Código del Guard:**
```typescript
// src/auth/guards/rut-auth.guard.ts
const rut = request.headers['x-user-rut'] || request.headers['X-User-RUT'];
if (!rut) {
  throw new BadRequestException('El header X-User-RUT es requerido');
}
// Validar formato y buscar usuario
```

### EnsureFamilyGroupFromRutInterceptor

Este interceptor se ejecuta **después** del guard y garantiza que:

1. El usuario tenga un grupo familiar
2. Si no existe, lo crea automáticamente
3. Si el usuario no existe, lo crea con datos mínimos

**Flujo:**
```
Request → RutAuthGuard → EnsureFamilyGroupFromRutInterceptor → Controller
```

### Endpoints Públicos

Los endpoints marcados con `@Public()` no requieren autenticación:

- `GET /api/v1/multiuser/health`

### Seguridad de Contraseñas

- Las contraseñas se encriptan con **bcrypt** (10 rounds)
- Las contraseñas se generan automáticamente para nuevos usuarios
- Las contraseñas no se exponen en las respuestas de la API

### Validaciones

1. **Formato RUT**: Validación estricta con regex
2. **Unicidad**: RUT y email únicos en la base de datos
3. **DTOs**: Validación de entrada con class-validator
4. **Constraints de BD**: Unicidad y foreign keys en Prisma

---

## 🗄️ Base de Datos

### Esquema de Datos

#### Tabla: `users`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Int (PK, auto-increment) | ID numérico interno |
| `uuid` | UUID (unique) | Identificador único universal |
| `rut` | String (unique) | RUT del usuario (único) |
| `email` | String (unique) | Email del usuario (único) |
| `password` | String | Contraseña encriptada (bcrypt) |
| `firstName` | String? | Nombre |
| `lastNamePaterno` | String? | Apellido paterno |
| `lastNameMaterno` | String? | Apellido materno |
| `username` | String? | Username (generado automáticamente) |
| `isActive` | Boolean | Usuario activo (default: true) |
| `isLeader` | Boolean | Es líder de grupo (default: false) |
| `familyGroupsUuid` | UUID? (FK) | UUID del grupo familiar |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de última actualización |

#### Tabla: `family_groups`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Int (PK, auto-increment) | ID numérico interno |
| `uuid` | UUID (unique) | Identificador único universal |
| `leader` | UUID (unique, FK) | UUID del usuario líder |
| `tokenApp` | String (unique) | Token de la aplicación |
| `maxMembers` | Int | Máximo de miembros (default: 8) |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de última actualización |

### Relaciones

- `User.familyGroupsUuid` → `FamilyGroup.uuid` (Many-to-One)
- `FamilyGroup.leader` → `User.uuid` (One-to-One, unique)

### Constraints

1. **Unicidad**:
   - `users.rut` es único
   - `users.email` es único
   - `users.uuid` es único
   - `family_groups.uuid` es único
   - `family_groups.leader` es único (un usuario solo puede ser líder de un grupo)
   - `family_groups.tokenApp` es único

2. **Foreign Keys**:
   - `users.familyGroupsUuid` referencia `family_groups.uuid` (CASCADE on delete)

3. **Integridad Referencial**:
   - Si se elimina un grupo, los usuarios se desasocian automáticamente

### Migraciones

Las migraciones se gestionan con Prisma y se ejecutan automáticamente en cada despliegue.

**Migración importante**: `20251127152531_change_id_to_int_and_uuid_to_full`
- Cambió `id` de String (cuid) a Int (autoincrement)
- Cambió `uuid` de VARCHAR(8) a UUID completo

---

## 🌐 API Endpoints

### Base URL

```
https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1
```

### Swagger UI

```
https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/docs
```

### Headers Requeridos

Para todos los endpoints (excepto `/health`):
```
X-User-RUT: 12345678-9
Content-Type: application/json
```

### Endpoints Principales

#### Health Check
```
GET /multiuser/health
```
✅ Público (no requiere `X-User-RUT`)

#### Sesión
```
POST /multiuser/session/init
Body: { rut, email?, firstName?, lastNamePaterno?, lastNameMaterno? }
```

#### Grupos Familiares
```
GET    /multiuser/family-groups              # Listar todos
GET    /multiuser/family-groups/:uuid        # Obtener por UUID
POST   /multiuser/my-family-group            # Crear/obtener mi grupo
GET    /multiuser/my-family-group            # Obtener mi grupo
PATCH  /multiuser/family-groups/:uuid        # Actualizar grupo
DELETE /multiuser/family-groups/:uuid        # Eliminar grupo
```

#### Miembros
```
POST   /multiuser/family-groups/:uuid/members           # Agregar miembro
DELETE /multiuser/family-groups/:uuid/members/:memberUuid  # Eliminar miembro
POST   /multiuser/family-groups/:uuid/leave             # Abandonar grupo
GET    /multiuser/family-groups/:uuid/users             # Listar usuarios
```

---

## 🔄 Flujo de Datos

### Flujo de Autenticación

```
1. App móvil envía request con header X-User-RUT
   ↓
2. RutAuthGuard valida formato y busca usuario en BD
   ↓
3. EnsureFamilyGroupFromRutInterceptor garantiza grupo familiar
   - Si usuario no existe → lo crea
   - Si grupo no existe → lo crea
   ↓
4. Controller recibe request con usuario y grupo garantizados
   ↓
5. Service ejecuta lógica de negocio
   ↓
6. Respuesta al cliente
```

### Flujo de Creación de Usuario y Grupo

```
1. Usuario nuevo envía request con X-User-RUT
   ↓
2. Guard no encuentra usuario en BD → request.user = { rut }
   ↓
3. Interceptor detecta que no hay usuario completo
   ↓
4. Service.ensureFamilyGroupForUser():
   a) Crea usuario con datos mínimos
   b) Crea grupo familiar
   c) Asocia usuario al grupo como líder
   ↓
5. Usuario y grupo listos para usar
```

### Flujo de Agregar Miembro

```
1. Líder envía POST /family-groups/:uuid/members
   Body: { rut, email, firstName, ... }
   ↓
2. Service.addMemberToFamilyGroup():
   a) Verifica que el solicitante es el líder
   b) Verifica que el grupo no está lleno (máx. 8)
   c) Verifica que el RUT no está en otro grupo
   d) Si usuario existe → lo actualiza y asocia
      Si no existe → lo crea y asocia
   ↓
3. Respuesta con usuario agregado
```

---

## ⚙️ Configuraciones

### Variables de Entorno

#### En Producción (Cloud Run)

Las variables se cargan desde Secret Manager:

```json
{
  "DATABASE_URL": "postgresql://user:password@host:port/database"
}
```

Se monta como archivo: `/secrets/multiuser-secrets.json`

#### En Desarrollo Local

Crear archivo `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/multiuser_db
PORT=8080
NODE_ENV=development
PUBLIC_BASE_URL=http://localhost:8080
```

### Configuración de NestJS

#### Prefijo Global
```typescript
app.setGlobalPrefix('api/v1');
```

#### CORS
```typescript
app.enableCors(); // Habilitado para app móvil
```

#### Swagger
- Título: "Multi-User Microservice API"
- Versión: "1.0.0"
- Base URL: Configurada desde `PUBLIC_BASE_URL`

### Configuración de Prisma

#### Generador
```prisma
generator client {
  provider = "prisma-client-js"
}
```

#### Datasource
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 🔍 Cómo Funciona

### 1. Interceptor Automático

El `EnsureFamilyGroupFromRutInterceptor` garantiza que **cada request autenticado** tenga un grupo familiar:

```typescript
async intercept(context: ExecutionContext, next: CallHandler) {
  const rut = request.user?.rut || request.headers['X-User-RUT'];
  if (rut) {
    await this.multiuserService.ensureFamilyGroupForUser({ rut, ... });
  }
  return next.handle();
}
```

**Ventaja**: No necesitas llamar a `session/init` en cada request. El grupo se garantiza automáticamente.

### 2. Creación Automática de Usuarios

Si un usuario no existe, se crea con:
- RUT (del header)
- Email generado: `{rut}@default.local` (si no se proporciona)
- Contraseña generada aleatoriamente
- `isLeader: true`
- Username generado: `leader_{rut_sin_dv}`

### 3. Transacciones de Base de Datos

Las operaciones críticas usan transacciones Prisma para garantizar consistencia:

```typescript
await this.prisma.$transaction(async (tx) => {
  // Crear usuario
  // Crear grupo
  // Asociar usuario al grupo
});
```

### 4. Validaciones en Múltiples Capas

1. **DTOs**: Validación de formato con class-validator
2. **Guards**: Validación de autenticación
3. **Services**: Validación de reglas de negocio
4. **Base de Datos**: Constraints y foreign keys

---

## 🛡️ Cómo Se Protege

### 1. Autenticación

- ✅ Header `X-User-RUT` requerido (excepto endpoints públicos)
- ✅ Validación de formato RUT
- ✅ Verificación de existencia del usuario

### 2. Autorización

- ✅ Solo el líder puede modificar/eliminar su grupo
- ✅ Solo el líder puede agregar/eliminar miembros
- ✅ Validación de permisos en cada operación

### 3. Validaciones

- ✅ DTOs con class-validator (validación de entrada)
- ✅ Constraints de base de datos (integridad)
- ✅ Validaciones de negocio en services

### 4. Seguridad de Datos

- ✅ Contraseñas encriptadas con bcrypt
- ✅ Secretos almacenados en Secret Manager
- ✅ HTTPS habilitado en Cloud Run

### 5. Prevención de Errores

- ✅ Transacciones para operaciones críticas
- ✅ Validación de límites (máx. 8 miembros)
- ✅ Manejo de conflictos (usuario ya existe, grupo lleno, etc.)

---

## 📱 Integración con App Móvil

### Flujo de Autenticación

#### 1. Login en el Servicio de Autenticación

La app móvil primero debe autenticar al usuario en el servicio de autenticación externo (no en este microservicio).

```javascript
// Ejemplo de login en el servicio de autenticación
const loginResponse = await fetch('https://auth-service.com/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rut: '12345678-9',
    password: 'password123'
  })
});

const authData = await loginResponse.json();
// authData contiene: { rut, email, nombre, apellidos, ... }
```

#### 2. Inicializar Sesión en Multiuser MS

**Después del login exitoso**, la app móvil debe llamar al endpoint de inicialización de sesión para garantizar que el usuario tenga su grupo familiar.

```javascript
// Endpoint: POST /api/v1/multiuser/session/init
const initSessionResponse = await fetch(
  'https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/multiuser/session/init',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-RUT': authData.rut  // RUT del usuario logueado
    },
    body: JSON.stringify({
      rut: authData.rut,
      email: authData.email,
      firstName: authData.nombre,
      lastNamePaterno: authData.apellidoPaterno,
      lastNameMaterno: authData.apellidoMaterno
    })
  }
);

const sessionData = await initSessionResponse.json();
// sessionData contiene:
// {
//   user: { uuid, rut, email, firstName, lastNamePaterno, isLeader, familyGroupsUuid, ... },
//   familyGroup: { uuid, leader, tokenApp, maxMembers, ... },
//   createdUser: false,
//   createdGroup: false,
//   message: "El usuario ya contaba con un grupo familiar"
// }
```

#### 3. Guardar Información Localmente

Guardar la información del usuario y su grupo familiar en el almacenamiento local de la app:

```javascript
// Guardar en AsyncStorage (React Native) o similar
await AsyncStorage.setItem('user', JSON.stringify({
  rut: sessionData.user.rut,
  uuid: sessionData.user.uuid,
  email: sessionData.user.email,
  firstName: sessionData.user.firstName,
  lastNamePaterno: sessionData.user.lastNamePaterno,
  isLeader: sessionData.user.isLeader,
  familyGroupUuid: sessionData.familyGroup.uuid,
  tokenApp: sessionData.familyGroup.tokenApp
}));
```

#### 4. Peticiones Subsecuentes

Para todas las peticiones posteriores al microservicio, solo necesitas enviar el RUT en el header `X-User-RUT`. El interceptor automáticamente garantizará que el usuario tenga grupo familiar.

```javascript
// Ejemplo: Obtener mi grupo familiar
const myGroupResponse = await fetch(
  'https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/multiuser/my-family-group',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-User-RUT': user.rut  // RUT guardado localmente
    }
  }
);
```

### Ejemplo Completo de Flujo

```javascript
// 1. Login en servicio de autenticación
const authResponse = await loginService.login(rut, password);
const userData = authResponse.user;

// 2. Inicializar sesión en multiuser-ms
const sessionResponse = await fetch(
  'https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/multiuser/session/init',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-RUT': userData.rut
    },
    body: JSON.stringify({
      rut: userData.rut,
      email: userData.email,
      firstName: userData.nombre,
      lastNamePaterno: userData.apellidoPaterno
    })
  }
);

const session = await sessionResponse.json();

// 3. Guardar localmente
await saveUserLocally({
  ...userData,
  uuid: session.user.uuid,
  familyGroupUuid: session.familyGroup.uuid
});

// 4. Usar en peticiones posteriores
const savedUser = await getUserLocally();
// En todas las peticiones, usar: savedUser.rut en el header X-User-RUT
```

### Notas Importantes para Integración

1. **El interceptor es automático**: No necesitas llamar a `session/init` en cada petición. El interceptor garantiza automáticamente el grupo familiar en cada request autenticado.

2. **RUT es la identificación**: El RUT es lo único que necesitas para identificar al usuario. No hay tokens JWT en este microservicio.

3. **Primera vez**: Si es la primera vez que el usuario se loguea, `createdUser` y `createdGroup` serán `true` en la respuesta de `session/init`.

4. **Endpoints públicos**: Solo el endpoint `/multiuser/health` es público. Todos los demás requieren el header `X-User-RUT`.

---

**Última actualización**: 2025-11-28

