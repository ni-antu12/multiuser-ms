# multiuser-ms

Microservicio para gestión de usuarios y grupos familiares desarrollado con NestJS.

---

## 📋 Descripción

**multiuser-ms** es un microservicio que gestiona usuarios y grupos familiares con un límite de 8 miembros por grupo. Está diseñado para ser consumido por una aplicación móvil que ya maneja autenticación externa. El servicio garantiza que cada usuario autenticado tenga un grupo familiar propio y sea líder del mismo.

### Características Principales

- ✅ Gestión automática de grupos familiares
- ✅ Autenticación basada en RUT
- ✅ Límite de 8 miembros por grupo familiar
- ✅ Creación automática de usuarios y grupos al primer acceso
- ✅ Desplegado en Google Cloud Run

---

## 🚀 Inicio Rápido

### Instalación Local

```bash
# Clonar el repositorio
git clone <repository-url>
cd multiuser-ms

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run start:dev
```

El servicio estará disponible en: `http://localhost:8080`

**Swagger UI**: `http://localhost:8080/api/v1/docs`

---

## 📚 Documentación

La documentación completa está organizada en 3 documentos principales:

### 📖 [Documentación del Proyecto](docs/PROYECTO.md)
**Configuraciones, funciones, lógica, reglas de negocio, arquitectura, seguridad, cómo funciona y cómo se protege.**

Incluye:
- Arquitectura y estructura del proyecto
- Reglas de negocio detalladas
- Funcionalidades y endpoints
- Autenticación y seguridad
- Base de datos y esquemas
- Flujo de datos

### ☁️ [Configuración de Google Cloud](docs/GCLOUD_CONFIG.md)
**Todas las configuraciones de Google Cloud Platform: Cloud Run, Cloud Build, Secret Manager, Artifact Registry, etc.**

Incluye:
- Configuración de Cloud Run
- Pipeline de Cloud Build
- Gestión de secretos
- Migraciones automáticas
- Comandos útiles de GCP

### 🛠️ [Instalación y Mantenimiento](docs/INSTALACION_MANTENIMIENTO.md)
**Guía completa para instalar, configurar, desarrollar y mantener el proyecto.**

Incluye:
- Requisitos previos
- Instalación local paso a paso
- Configuración de base de datos
- Desarrollo local
- Migraciones
- Testing
- Troubleshooting

---

## 🛠️ Tecnologías

- **Framework**: NestJS (Node.js/TypeScript)
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Documentación**: Swagger/OpenAPI
- **Plataforma**: Google Cloud Run

---

## 📍 URLs del Servicio

### Producción (Cloud Run)

- **Base URL**: `https://multiuser-ms-695418284847.southamerica-west1.run.app`
- **API Base**: `https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1`
- **Swagger UI**: `https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/docs`
- **Health Check**: `https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/multiuser/health`

---

## 🔐 Autenticación

El servicio utiliza autenticación basada en **RUT** enviado en el header `X-User-RUT`. No se usa JWT.

**Ejemplo de request:**
```bash
curl -X GET "https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/multiuser/my-family-group" \
  -H "X-User-RUT: 12345678-9" \
  -H "Content-Type: application/json"
```

---

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run start:dev          # Servidor con hot-reload
npm run start:debug        # Servidor con debugging

# Producción
npm run build              # Compilar TypeScript
npm run start:prod         # Ejecutar versión compilada

# Base de Datos
npx prisma generate        # Generar Prisma Client
npx prisma migrate dev     # Crear y aplicar migraciones
npx prisma studio          # GUI para base de datos

# Testing
npm test                   # Ejecutar tests
npm run test:watch         # Tests en modo watch
npm run test:cov           # Tests con cobertura
```

---

## 📁 Estructura del Proyecto

```
multiuser-ms/
├── docs/                      # Documentación
│   ├── PROYECTO.md           # Documentación del proyecto
│   ├── GCLOUD_CONFIG.md      # Configuración de GCP
│   └── INSTALACION_MANTENIMIENTO.md
├── prisma/                    # Schema y migraciones
│   ├── schema.prisma
│   └── migrations/
├── src/                       # Código fuente
│   ├── auth/                  # Autenticación
│   ├── multiuser/             # Módulo principal
│   ├── prisma/                # Servicio de Prisma
│   └── main.ts                # Bootstrap
├── Dockerfile                 # Imagen Docker
├── cloudbuild.yaml            # Pipeline de Cloud Build
└── package.json
```

---

## 🔗 Enlaces Relacionados

- [Documentación Completa](docs/)
- [Swagger UI (Producción)](https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/docs)

---

## 👥 Contribuir

Para contribuir al proyecto, consulta la documentación en:
- [Instalación y Mantenimiento](docs/INSTALACION_MANTENIMIENTO.md) - Para configurar el entorno de desarrollo

---

**Última actualización**: 2025-11-28
