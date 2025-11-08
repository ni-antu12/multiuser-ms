# 🏥 Microservicio Multiusuario - Centro Médico

Un sistema completo para gestión de usuarios y grupos familiares diseñado específicamente para centros médicos. Integra la base de datos existente del centro médico para crear grupos familiares de pacientes con backend NestJS y frontend móvil React Native.

## 📱 Nuevo: Frontend Móvil Disponible

Este proyecto ahora incluye una **aplicación móvil completa** desarrollada con React Native + Expo.

- 📂 **Ubicación**: `mobile-app/`
- 📖 **Documentación**: [MOBILE_APP_SUMMARY.md](MOBILE_APP_SUMMARY.md)
- 🚀 **Inicio Rápido**: [mobile-app/QUICK_START.md](mobile-app/QUICK_START.md)
- 🔗 **Integración**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

## 🏥 **MODELO CENTRO MÉDICO**

### **Características Específicas para Centros Médicos**

Este microservicio está diseñado específicamente para centros médicos con las siguientes características:

#### 🔐 **Autenticación Integrada**
- Los pacientes se autentican contra la **BD existente del centro médico**
- No requiere registro manual de usuarios
- Sincronización automática de datos del paciente

#### 👨‍⚕️ **Flujo de Creación de Grupos Familiares**
1. **Paciente autenticado** hace clic en "Crear Mi Grupo Familiar"
2. Sistema **valida automáticamente**:
   - ✅ Paciente existe en BD del centro médico
   - ✅ Es mayor de 18 años
   - ✅ No pertenece a otro grupo familiar
   - ✅ No tiene ya un grupo como líder
3. Sistema **crea automáticamente**:
   - ✅ Usuario líder en el sistema
   - ✅ Grupo familiar
   - ✅ **Asocia al líder como miembro #1 del grupo**
4. Líder puede **invitar familiares** desde la BD del centro médico

#### 📋 **Ventajas del Modelo**
- ✅ **Sin registro manual**: Datos obtenidos de BD del centro médico
- ✅ **1 Líder = 1 Grupo**: Un paciente solo puede crear un grupo
- ✅ **Líder es miembro**: El líder cuenta como primer miembro del grupo
- ✅ **Validación de edad**: Solo mayores de 18 años pueden crear grupos
- ✅ **Integridad de datos**: Un paciente solo puede estar en un grupo a la vez

---

## 🚀 Características Generales

### Backend (NestJS)
- **🏥 Endpoint Específico Centro Médico**: `POST /multiuser/my-family-group`
- **Gestión de Usuarios**: CRUD completo con validaciones robustas
- **Gestión de Líderes**: Sistema de roles y permisos
- **Grupos Familiares**: Sistema de grupos con límite de miembros (máx. 8)
- **UUIDs Cortos**: Identificadores únicos de 8 caracteres alfanuméricos
- **Validaciones Automáticas**: Generación automática de UUIDs cuando no se proporcionan
- **Integración con Microservicios**: Comunicación con servicios de formularios dinámicos (BD Centro Médico)
- **Documentación API**: Swagger/OpenAPI integrado
- **Seguridad**: Encriptación de contraseñas con bcrypt
- **Validación de Edad**: Control automático de edad mínima (18 años)

### Frontend Móvil (React Native + Expo)
- **Autenticación**: Login y registro de usuarios/líderes
- **Dashboard**: Estadísticas y visualización en tiempo real
- **Gestión de Grupos**: Ver, crear y administrar grupos familiares
- **Gestión de Usuarios**: CRUD completo desde la app
- **UI Moderna**: Diseño profesional optimizado para móviles
- **Cross-Platform**: iOS, Android y Web

## Manejo de UUIDs

### Enfoque Actual
- **Decoradores de class-validator**: Uso de `@Length()` y `@Matches()` para validación
- **UUIDs proporcionados por el usuario**: Los UUIDs deben ser proporcionados en las peticiones
- **Validaciones robustas**: Patrón de 8 caracteres alfanuméricos (A-Z, a-z, 0-9)
- **Sin generación automática**: Enfoque más simple y directo

## 📂 Estructura del Proyecto

```
multiuser-ms/
├── src/                        # Backend (NestJS)
│   ├── multiuser/
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── multiuser.controller.ts
│   │   ├── multiuser.service.ts
│   │   └── forms-microservice.service.ts
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
│
├── mobile-app/                 # 🆕 Frontend Móvil (React Native)
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── context/           # Estado global (Auth)
│   │   ├── navigation/        # Navegación
│   │   ├── screens/           # Pantallas (9 pantallas)
│   │   ├── services/          # Cliente API
│   │   ├── theme/             # Colores y estilos
│   │   └── types/             # TypeScript types
│   ├── App.tsx
│   ├── package.json
│   └── README.md
│
├── prisma/                     # Database
│   ├── schema.prisma
│   └── migrations/
│
└── 📚 Documentación
    ├── README.md               # Este archivo
    ├── MOBILE_APP_SUMMARY.md   # Resumen del frontend
    ├── INTEGRATION_GUIDE.md    # Guía de integración
    └── mobile-app/
        ├── README.md           # Docs del frontend
        ├── QUICK_START.md      # Inicio rápido
        ├── SETUP.md            # Instalación detallada
        └── FEATURES.md         # Características
```

## 🌐 API Endpoints

### 🏥 **Centro Médico (Recomendado)**

#### **Crear Mi Grupo Familiar**
```http
POST /multiuser/my-family-group
Headers:
  X-User-RUT: "12345678-9"  ← RUT del paciente autenticado
Body (opcional):
{
  "tokenApp": "mi_token_personalizado"  // Opcional, se genera automáticamente
}
```

**Respuesta exitosa (201):**
```json
{
  "familyGroup": {
    "uuid": "aB3x9K2m",
    "leader": "nP7vQ8rT",
    "tokenApp": "token123",
    "maxMembers": 8,
    "createdAt": "2025-10-21T...",
    "updatedAt": "2025-10-21T..."
  },
  "user": {
    "uuid": "nP7vQ8rT",
    "rut": "12345678-9",
    "familyGroupsUuid": "aB3x9K2m",
    "email": "paciente@email.com",
    "username": "patient_12345678",
    "firstName": "Juan",
    "lastName": "Pérez",
    "isActive": true,
    "isLeader": true
  },
  "message": "Grupo familiar creado exitosamente"
}
```

**Validaciones automáticas:**
- ✅ Paciente existe en BD del centro médico
- ✅ Mayor de 18 años
- ✅ No pertenece a otro grupo
- ✅ No tiene ya un grupo como líder
- ✅ Líder se asocia automáticamente como miembro #1

---

### Usuarios Líderes (Administración)
- `POST /multiuser/leaders` - Crear usuario líder manualmente
- `GET /multiuser/leaders` - Listar todos los líderes
- `PATCH /multiuser/leaders/:uuid` - Actualizar líder
- `DELETE /multiuser/leaders/:uuid` - Eliminar líder

### Usuarios (Administración)
- `POST /multiuser/users` - Crear usuario (UUID opcional)
- `GET /multiuser/users` - Listar todos los usuarios
- `PATCH /multiuser/users/:uuid` - Actualizar usuario
- `DELETE /multiuser/users/:uuid` - Eliminar usuario

### Grupos Familiares (Administración)
- `POST /multiuser/family-groups` - Crear grupo familiar manualmente (UUID opcional)
- `GET /multiuser/family-groups` - Listar todos los grupos
- `GET /multiuser/family-groups/:uuid` - Buscar grupo por UUID
- `GET /multiuser/family-groups/token/:tokenApp` - Buscar por token
- `GET /multiuser/family-groups/:uuid/users` - Usuarios del grupo
- `GET /multiuser/family-groups/:uuid/members-info` - Info detallada de miembros
- `PATCH /multiuser/family-groups/:uuid` - Actualizar grupo (solo líder)
- `DELETE /multiuser/family-groups/:uuid` - Eliminar grupo (solo líder)

### Utilidades
- `GET /multiuser/health` - Health check
- `GET /multiuser/cloud-run-status` - Estado del servicio de formularios

## Validaciones de UUID

### Decoradores de class-validator
```typescript
@IsString()
@Length(8, 8)
@Matches(/^[A-Za-z0-9]+$/, { message: 'UUID debe contener solo letras y números' })
uuid?: string;
```

### Características
- **Longitud**: Exactamente 8 caracteres
- **Caracteres**: Solo letras (A-Z, a-z) y números (0-9)
- **Opcional**: Los UUIDs son opcionales en los DTOs
- **Validación**: Patrón regex para asegurar formato correcto

### Ejemplos de UUIDs Válidos
- `aB3x9K2m`
- `nP7vQ8rT`
- `kL5mN9pQ`
- `12345678` (numérico)

## 🛠️ Instalación y Uso

### Backend (NestJS)

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd multiuser-ms
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar base de datos**
```bash
# Crear archivo .env con DATABASE_URL
npx prisma migrate dev
```

4. **Ejecutar en desarrollo**
```bash
npm run start:dev
```

El backend estará disponible en `http://localhost:3000`

5. **Acceder a Swagger**
```bash
# Abre en tu navegador
http://localhost:3000/api
```

### Frontend Móvil (React Native)

1. **Ir a la carpeta del frontend**
```bash
cd mobile-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar URL del backend**
```typescript
// Edita mobile-app/src/services/api.ts
const API_URL = 'http://TU_IP:3000/multiuser';
```

4. **Iniciar la app**
```bash
npm start
```

5. **Escanear QR con Expo Go**
- Instala Expo Go en tu smartphone
- Escanea el QR que aparece en la terminal

📖 **Guía completa**: [mobile-app/QUICK_START.md](mobile-app/QUICK_START.md)

## Docker

```bash
# Construir imagen
docker build -t multiuser-ms .

# Ejecutar con docker-compose
docker-compose up -d
```

## ☁️ Despliegue en Cloud Run con Cloud Build

1. **Crear repositorio en Artifact Registry**
   - `gcloud artifacts repositories create <repo-name> --repository-format=docker --location=southamerica-west1`
   - Actualiza `_AR_HOST` y `_AR_REPOSITORY` en `cloudbuild.yaml` si usas otra ubicación o nombre.
2. **Configurar secretos (opcional pero recomendado)**
   - `gcloud secrets create DATABASE_URL --replication-policy=automatic`
   - `echo -n "<cadena-de-conexion>" | gcloud secrets versions add DATABASE_URL --data-file=-`
   - Quita el comentario de `_SECRET_DATABASE_URL` y `--set-secrets` en `cloudbuild.yaml`.
3. **Crear el servicio de Cloud Run (solo la primera vez)**
   - `gcloud run deploy multiuser-ms --image=gcr.io/cloudrun/placeholder --region=southamerica-west1 --platform=managed --allow-unauthenticated --port=8080`
   - Después, Cloud Build lo actualizará automáticamente.
4. **Conectar el repositorio de GitHub en Cloud Build**
   - En Google Cloud Console → Cloud Build → *Repositorios conectados* → *Conectar repositorio*.
   - Selecciona GitHub y autoriza el acceso al repositorio donde vive este código.
5. **Crear un disparador (trigger) de Cloud Build**
   - Tipo: *Repositorio conectado*.
   - Rama: por ejemplo `main` (despliegue automático al hacer push).
   - Archivo de configuración: `cloudbuild.yaml`.
   - Variables de sustitución opcionales:
     - `_SERVICE_NAME` (nombre del servicio en Cloud Run).
     - `_REGION` (región de despliegue, e.g. `southamerica-west1`).
     - `_AR_HOST` y `_AR_REPOSITORY` si cambiaste la ubicación del repositorio de imágenes.
6. **Probar el pipeline**
   - Haz un commit y push a la rama monitoreada.
   - Revisa Cloud Build → *Historial de compilaciones* para verificar el despliegue.

> El archivo `cloudbuild.yaml` en la raíz ya contiene los pasos para construir la imagen, subirla a Artifact Registry y desplegarla en Cloud Run.

## 🔧 Tecnologías Utilizadas

### Backend
- **NestJS** - Framework de Node.js
- **Prisma** - ORM para base de datos
- **PostgreSQL** - Base de datos
- **TypeScript** - Tipado estático
- **class-validator** - Validaciones de DTOs
- **bcryptjs** - Encriptación de contraseñas
- **@nestjs/swagger** - Documentación API
- **Axios** - Cliente HTTP para microservicios

### Frontend Móvil
- **React Native** - Framework móvil
- **Expo** - Plataforma de desarrollo
- **TypeScript** - Tipado estático
- **React Navigation** - Navegación
- **Axios** - Cliente HTTP
- **AsyncStorage** - Almacenamiento local
- **Context API** - Estado global

## 🚀 Inicio Rápido (Full Stack)

### Opción 1: Solo Backend
```bash
npm install
npm run start:dev
# Backend en http://localhost:3000
```

### Opción 2: Backend + Frontend
```bash
# Terminal 1: Backend
npm install
npm run start:dev

# Terminal 2: Frontend
cd mobile-app
npm install
npm start
# Escanea el QR con Expo Go
```

📖 **Guía completa de integración**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

## 📱 Pantallas del Frontend

El frontend incluye 9 pantallas completas:

### Autenticación
- **LoginScreen** - Inicio de sesión
- **RegisterScreen** - Registro de usuarios/líderes

### Principal
- **HomeScreen** - Dashboard con estadísticas
- **ProfileScreen** - Perfil del usuario

### Grupos Familiares
- **FamilyGroupsScreen** - Lista de grupos
- **FamilyGroupDetailScreen** - Detalle de grupo
- **CreateFamilyGroupScreen** - Crear grupo (líderes)

### Usuarios
- **UsersScreen** - Lista de usuarios
- **CreateUserScreen** - Crear usuario

📖 **Más detalles**: [MOBILE_APP_SUMMARY.md](MOBILE_APP_SUMMARY.md)

## 🎯 Datos de Prueba

### **Opción A: Flujo Centro Médico (Recomendado) 🏥**

```bash
# 1. Paciente autenticado crea su grupo familiar
curl -X POST http://localhost:3000/api/multiuser/my-family-group \
  -H "Content-Type: application/json" \
  -H "X-User-RUT: 12345678-9" \
  -d '{}'

# Respuesta: Grupo creado + Usuario líder asociado automáticamente
# El paciente ahora es líder y miembro #1 del grupo
```

**Requisitos:**
- El RUT debe existir en la BD del centro médico (microservicio forms)
- El paciente debe ser mayor de 18 años
- El paciente no debe pertenecer a otro grupo

---

### **Opción B: Flujo Manual (Administración)**

```typescript
// 1. Registrar Líder manualmente
POST /multiuser/leaders
{
  rut: "12345678-9",
  email: "lider@test.com",
  username: "lider1",
  password: "test123"
}

// 2. Crear Grupo Familiar manualmente
POST /multiuser/family-groups
{
  leader: "[UUID del líder]",
  tokenApp: "token_test_001",
  maxMembers: 8
}

// 3. Agregar Usuario familiar
POST /multiuser/users
{
  rut: "98765432-1",
  familyGroupsUuid: "[UUID del grupo]",
  email: "usuario@test.com",
  username: "usuario1",
  password: "test123"
}
```

**⚠️ Nota:** En el flujo manual, el líder NO se asocia automáticamente al grupo. Esto es solo para propósitos administrativos.

---

## 💡 Casos de Uso - Centro Médico

### **Caso 1: Paciente crea su grupo familiar**

```
📱 FRONTEND (App del Centro Médico)
├─ Usuario: Juan Pérez (RUT: 12345678-9)
├─ Edad: 35 años
├─ Estado: Autenticado
└─ Acción: Click en "Crear Mi Grupo Familiar"

↓ BACKEND valida automáticamente ↓

✅ Existe en BD Centro Médico
✅ Mayor de 18 años
✅ No pertenece a otro grupo
✅ No tiene ya un grupo

↓ BACKEND crea automáticamente ↓

✅ Usuario líder en sistema
✅ Grupo familiar (maxMembers: 8)
✅ Asocia líder al grupo (miembro #1)

📊 RESULTADO:
- Grupo: "Familia Pérez" (7 espacios disponibles)
- Miembros: Juan Pérez (Líder) ✓
```

---

### **Caso 2: Líder invita a su esposa**

```
📱 FRONTEND
├─ Líder: Juan Pérez
├─ Grupo: "Familia Pérez" (1/8 miembros)
└─ Acción: "Agregar Familiar"
    └─ Busca por RUT: 98765432-1 (María González)

↓ BACKEND valida ↓

✅ RUT existe en BD Centro Médico
✅ María no pertenece a otro grupo
✅ Hay espacio en el grupo (1/8)

↓ BACKEND crea usuario ↓

✅ Usuario: María González
✅ isLeader: false
✅ familyGroupsUuid: [Grupo de Juan]

📊 RESULTADO:
- Grupo: "Familia Pérez" (6 espacios disponibles)
- Miembros: 
  * Juan Pérez (Líder) ✓
  * María González (Familiar) ✓
```

---

### **Caso 3: Intento inválido - Menor de edad**

```
📱 FRONTEND
├─ Usuario: Pedro Soto (RUT: 20392017-2)
├─ Edad: 16 años
└─ Acción: Click en "Crear Mi Grupo Familiar"

↓ BACKEND valida ↓

✅ Existe en BD Centro Médico
❌ Es menor de 18 años

⚠️ RESPUESTA (403 Forbidden):
{
  "statusCode": 403,
  "message": "Debe ser mayor de 18 años para crear un grupo familiar",
  "error": "Forbidden"
}
```

---

### **Caso 4: Intento inválido - Ya tiene grupo**

```
📱 FRONTEND
├─ Usuario: Juan Pérez (RUT: 12345678-9)
├─ Ya tiene grupo: "Familia Pérez"
└─ Acción: Click en "Crear Mi Grupo Familiar"

↓ BACKEND valida ↓

✅ Existe en BD Centro Médico
✅ Mayor de 18 años
❌ Ya tiene un grupo como líder

⚠️ RESPUESTA (409 Conflict):
{
  "statusCode": 409,
  "message": "Ya tiene un grupo familiar creado",
  "error": "Conflict"
}
```

---

## 📚 Documentación Adicional

| Documento | Descripción |
|-----------|-------------|
| [MOBILE_APP_SUMMARY.md](MOBILE_APP_SUMMARY.md) | Resumen completo del frontend móvil |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Cómo integrar backend + frontend |
| [mobile-app/README.md](mobile-app/README.md) | Documentación del frontend |
| [mobile-app/QUICK_START.md](mobile-app/QUICK_START.md) | Inicio rápido (5 minutos) |
| [mobile-app/SETUP.md](mobile-app/SETUP.md) | Guía de instalación detallada |
| [mobile-app/FEATURES.md](mobile-app/FEATURES.md) | Lista de características |

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Base de datos PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/multiuser_db"

# Microservicio de Formularios (BD Centro Médico)
FORMS_MICROSERVICE_URL="http://localhost:3001"
# O para Cloud Run:
# FORMS_MICROSERVICE_URL="https://forms-microservice.run.app"

# Puerto del servidor
PORT=3000
```

### **Configuración del Microservicio de Formularios**

El endpoint `/api/patients/:rut` en el microservicio de formularios debe retornar:

```json
{
  "rut": "12345678-9",
  "email": "paciente@email.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "username": "juan_perez",
  "birthDate": "1990-05-15",
  "isActive": true
}
```

---

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Verifica la base de datos
npx prisma migrate status
npx prisma migrate dev
```

### Error: "Paciente no encontrado en el sistema"
```bash
# Verifica que el microservicio de formularios esté corriendo
curl http://localhost:3001/health

# O verifica la variable de entorno
echo $FORMS_MICROSERVICE_URL

# En desarrollo, si el microservicio no está disponible,
# el sistema busca localmente en la BD
```

### Error: "Debe ser mayor de 18 años"
```bash
# Verifica la fecha de nacimiento en la BD del centro médico
# Formato esperado: YYYY-MM-DD (ej: 1990-05-15)
```

### Frontend no se conecta al backend
```bash
# Verifica que el backend esté corriendo
curl http://localhost:3000/api/multiuser/health

# Verifica la URL en mobile-app/src/services/api.ts
# Usa tu IP local, no localhost (para dispositivos físicos)
```

📖 **Más soluciones**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

---

**Desarrollado con ❤️ para gestión de usuarios y grupos familiares**
