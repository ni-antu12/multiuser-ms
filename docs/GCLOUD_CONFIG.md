# Configuración de Google Cloud Platform

Documentación completa sobre la configuración y despliegue del microservicio en Google Cloud Platform.

---

## 📋 Índice

- [Resumen](#resumen)
- [Servicios Utilizados](#servicios-utilizados)
- [Cloud Run](#cloud-run)
- [Cloud Build](#cloud-build)
- [Artifact Registry](#artifact-registry)
- [Secret Manager](#secret-manager)
- [Configuración de Despliegue](#configuración-de-despliegue)
- [Variables de Entorno](#variables-de-entorno)
- [Migraciones de Base de Datos](#migraciones-de-base-de-datos)

---

## 🎯 Resumen

Este microservicio está desplegado en **Google Cloud Run** en la región **southamerica-west1** y utiliza los siguientes servicios de GCP:

- **Cloud Run**: Hosting del microservicio
- **Cloud Build**: CI/CD para construcción y despliegue automático
- **Artifact Registry**: Almacenamiento de imágenes Docker
- **Secret Manager**: Gestión segura de secretos (conexión a base de datos)

**URL del Servicio Desplegado:**
```
https://multiuser-ms-695418284847.southamerica-west1.run.app
```

**Swagger UI:**
```
https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/docs
```

---

## 🛠️ Servicios Utilizados

### Cloud Run

**Configuración del Servicio:**
- **Nombre**: `multiuser-ms`
- **Región**: `southamerica-west1`
- **Plataforma**: Managed
- **Puerto**: `8080`
- **Autenticación**: Permitido sin autenticación (`--allow-unauthenticated`)
- **Timeout**: `300` segundos (5 minutos)
- **CPU**: `1`
- **Memoria**: `512Mi`
- **Instancias mínimas**: `0` (escalado a cero)
- **Instancias máximas**: `10`

**URLs del Servicio:**
- Base URL: `https://multiuser-ms-695418284847.southamerica-west1.run.app`
- API Base: `https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1`
- Health Check: `https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/multiuser/health`
- Swagger: `https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/docs`

### Cloud Build

**Archivo de Configuración**: `cloudbuild.yaml`

El archivo de Cloud Build define el pipeline de CI/CD que:

1. **Construye la imagen Docker** usando el `Dockerfile` del repositorio
2. **Publica la imagen** en Artifact Registry
3. **Ejecuta migraciones de Prisma** antes del despliegue
4. **Despliega el servicio** en Cloud Run

**Configuración de Substituciones:**
```yaml
substitutions:
  _SERVICE_NAME: multiuser-ms
  _REGION: southamerica-west1
  _AR_HOST: southamerica-west1-docker.pkg.dev
  _AR_REPOSITORY: cloud-run-source-deploy
  _SECRET_MULTIUSER_SECRETS: multiuser-secrets:latest
```

**Pasos del Pipeline:**

1. **Build de Imagen Docker**
   - Tag: `${_AR_HOST}/${PROJECT_ID}/${_AR_REPOSITORY}/${_SERVICE_NAME}:${SHORT_SHA}`
   - Usa el Dockerfile del repositorio

2. **Push a Artifact Registry**
   - Publica la imagen construida en el repositorio configurado

3. **Ejecución de Migraciones**
   - Instala dependencias Node.js
   - Carga `DATABASE_URL` desde Secret Manager
   - Ejecuta `npx prisma migrate deploy`

4. **Despliegue en Cloud Run**
   - Usa la imagen recién construida
   - Configura todos los parámetros del servicio
   - Monta el secreto como archivo en `/secrets/multiuser-secrets.json`

### Artifact Registry

**Configuración:**
- **Host**: `southamerica-west1-docker.pkg.dev`
- **Repositorio**: `cloud-run-source-deploy`
- **Formato**: Docker
- **Región**: `southamerica-west1`

**Estructura de la Imagen:**
```
${_AR_HOST}/${PROJECT_ID}/${_AR_REPOSITORY}/${_SERVICE_NAME}:${SHORT_SHA}
```

Ejemplo:
```
southamerica-west1-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/multiuser-ms:abc123
```

### Secret Manager

**Secreto Configurado**: `multiuser-secrets`

Este secreto contiene un JSON con todas las variables de entorno necesarias:

```json
{
  "DATABASE_URL": "postgresql://user:password@host:port/database?schema=public"
}
```

**Configuración en Cloud Run:**
- El secreto se monta como archivo en: `/secrets/multiuser-secrets.json`
- La aplicación lo lee en el startup (ver `src/main.ts`)

**Acceso al Secreto:**
- Versión: `projects/$PROJECT_ID/secrets/multiuser-secrets/versions/latest`
- Variable de entorno en Cloud Build: `MULTIUSER_SECRETS_JSON`

---

## ⚙️ Configuración de Despliegue

### Dockerfile

El `Dockerfile` define la construcción de la imagen:

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

**Características:**
- Base: Node.js 20
- Genera Prisma Client
- Compila TypeScript a JavaScript
- Ejecuta directamente el código compilado (más rápido)

### Cloud Build YAML

**Opciones Configuradas:**
```yaml
options:
  substitution_option: ALLOW_LOOSE
  default_logs_bucket_behavior: REGIONAL_USER_OWNED_BUCKET
```

**Secretos Disponibles:**
```yaml
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/multiuser-secrets/versions/latest
      env: 'MULTIUSER_SECRETS_JSON'
```

**Imágenes Generadas:**
```yaml
images:
  - ${_AR_HOST}/${PROJECT_ID}/${_AR_REPOSITORY}/${_SERVICE_NAME}:${SHORT_SHA}
```

---

## 🔐 Variables de Entorno

### En Cloud Run

El servicio monta el secreto como archivo JSON en `/secrets/multiuser-secrets.json`.

La aplicación carga las variables desde este archivo en el startup:

```typescript
// src/main.ts
if (!process.env.DATABASE_URL) {
  try {
    const secrets = JSON.parse(
      fs.readFileSync('/secrets/multiuser-secrets.json', 'utf8')
    );
    if (secrets.DATABASE_URL) {
      process.env.DATABASE_URL = secrets.DATABASE_URL;
    }
  } catch (error) {
    // El archivo no existe o hay error, usar variables de entorno existentes
  }
}
```

### Variables Requeridas

- **DATABASE_URL**: Connection string de PostgreSQL
- **PORT**: Puerto del servicio (default: 8080)
- **NODE_ENV**: Entorno de ejecución (default: production)
- **PUBLIC_BASE_URL**: URL pública del servicio (usado en Swagger)

---

## 🗄️ Migraciones de Base de Datos

### Ejecución Automática en Cloud Build

Las migraciones se ejecutan automáticamente en cada despliegue:

```yaml
- name: node:20
  id: run-migrations
  entrypoint: bash
  secretEnv: ['MULTIUSER_SECRETS_JSON']
  args:
    - -c
    - |
      echo "Instalando dependencias para migraciones..."
      npm install
      echo "Cargando DATABASE_URL desde JSON..."
      export DATABASE_URL=$(node -e "console.log(JSON.parse(process.env.MULTIUSER_SECRETS_JSON).DATABASE_URL)")
      echo "Ejecutando migraciones de Prisma..."
      npx prisma migrate deploy
      echo "✅ Migraciones completadas exitosamente."
```

**Comando usado**: `prisma migrate deploy`
- Solo aplica migraciones pendientes
- No crea nuevas migraciones
- Ideal para producción

### Migraciones Manuales

Para ejecutar migraciones manualmente:

```bash
# Desde local (requiere DATABASE_URL configurada)
npx prisma migrate deploy

# O crear nueva migración
npx prisma migrate dev --name nombre_migracion
```

---

## 📝 Comandos Útiles

### Cloud Run

```bash
# Ver logs del servicio
gcloud run services logs read multiuser-ms --region=southamerica-west1 --limit=50

# Ver detalles del servicio
gcloud run services describe multiuser-ms --region=southamerica-west1

# Listar revisiones
gcloud run revisions list --service=multiuser-ms --region=southamerica-west1

# Actualizar configuración
gcloud run services update multiuser-ms \
  --region=southamerica-west1 \
  --memory=1Gi \
  --cpu=2
```

### Cloud Build

```bash
# Ver historial de builds
gcloud builds list --limit=10

# Ver detalles de un build específico
gcloud builds describe BUILD_ID

# Ver logs de un build
gcloud builds log BUILD_ID

# Trigger manual de build
gcloud builds submit --config=cloudbuild.yaml
```

### Secret Manager

```bash
# Ver lista de secretos
gcloud secrets list

# Acceder al valor del secreto (requiere permisos)
gcloud secrets versions access latest --secret=multiuser-secrets

# Crear nueva versión del secreto
echo '{"DATABASE_URL":"..."}' | gcloud secrets versions add multiuser-secrets --data-file=-
```

### Artifact Registry

```bash
# Listar imágenes
gcloud artifacts docker images list \
  southamerica-west1-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy

# Eliminar imagen antigua
gcloud artifacts docker images delete \
  southamerica-west1-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/multiuser-ms:TAG
```

---

## 🔄 Flujo de Despliegue

1. **Push a repositorio** → Trigger automático de Cloud Build
2. **Cloud Build ejecuta**:
   - Construye imagen Docker
   - Publica en Artifact Registry
   - Ejecuta migraciones de Prisma
   - Despliega nueva revisión en Cloud Run
3. **Cloud Run**:
   - Crea nueva revisión
   - Ruta el tráfico a la nueva revisión
   - Termina instancias antiguas después de un período de gracia

### Push sin Activar Cloud Build

Para cambios que **no requieren despliegue** (documentación, README, etc.), puedes evitar que Cloud Build se active agregando `[skip ci]` al mensaje del commit:

```bash
# Solo agregar archivos de documentación
git add docs/ README.md

# Commit con [skip ci] para evitar Cloud Build
git commit -m "docs: actualizar documentación [skip ci]"

# Push normal
git push
```

**Opciones válidas para saltarse CI/CD**:
- `[skip ci]`
- `[ci skip]`
- `[no ci]`

**Casos de uso comunes**:
- Cambios en `docs/` (documentación)
- Cambios en `README.md`
- Actualizaciones de `.gitignore`
- Cambios en archivos de configuración que no afectan el build

**⚠️ Importante**: Si cambias código, configuraciones de build (`cloudbuild.yaml`, `Dockerfile`, etc.), o variables de entorno, **NO uses `[skip ci]`** ya que estos cambios requieren un nuevo despliegue.

### Crear Pull Request

5. **Crear Pull Request** en GitHub

Después de hacer push a tu rama, crea un Pull Request en GitHub para revisión antes de mergear a la rama principal.

---

## 🔒 Seguridad

### Secretos

- ✅ Secretos almacenados en Secret Manager (encriptados)
- ✅ Secretos montados como archivos de solo lectura en Cloud Run
- ✅ No se exponen en variables de entorno visibles

### Autenticación

- ✅ Servicio configurado como público (para acceso desde app móvil)
- ✅ Autenticación a nivel de aplicación mediante header `X-User-RUT`
- ✅ Validación de formato RUT en cada request

### Red

- ✅ HTTPS habilitado por defecto en Cloud Run
- ✅ CORS habilitado para permitir requests desde app móvil

---

## 📊 Monitoreo

### Logs

Los logs están disponibles en:
- Cloud Logging (consola de GCP)
- Comando: `gcloud run services logs read multiuser-ms`

### Métricas

Cloud Run proporciona métricas automáticas:
- Requests por segundo
- Latencia
- Errores
- Utilización de CPU/Memoria

Acceso en: **Cloud Console → Cloud Run → multiuser-ms → Métricas**

---

## 🆘 Troubleshooting

### El servicio no inicia

1. Verificar logs: `gcloud run services logs read multiuser-ms`
2. Verificar que el secreto existe y es accesible
3. Verificar que `DATABASE_URL` es correcta

### Las migraciones fallan

1. Verificar permisos de Cloud Build a Secret Manager
2. Verificar que la base de datos es accesible desde Cloud Build
3. Revisar logs del paso de migraciones en Cloud Build

### Error de conexión a base de datos

1. Verificar que `DATABASE_URL` en el secreto es correcta
2. Verificar que la IP de Cloud Run está permitida en el firewall de PostgreSQL
3. Verificar que la base de datos existe y tiene los permisos correctos

---

## 📐 Convenciones del Proyecto

### Commits

Usar formato convencional de commits:

- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bugs
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato (espacios, comas, etc.)
- `refactor:` - Refactorización de código
- `test:` - Agregar o modificar tests
- `chore:` - Tareas de mantenimiento (dependencias, config, etc.)

**Ejemplos:**
```bash
git commit -m "feat: agregar endpoint para eliminar miembros"
git commit -m "fix: corregir validación de RUT"
git commit -m "docs: actualizar guía de instalación"
```

### Nombres de Archivos

- **Archivos**: kebab-case (ej: `multiuser.service.ts`, `rut-auth.guard.ts`)
- **Componentes/Clases**: PascalCase (ej: `MultiuserController`, `RutAuthGuard`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `MAX_MEMBERS`, `DATABASE_URL`)

### Código

- Seguir las reglas de ESLint configuradas en el proyecto
- Usar TypeScript estricto
- Mantener consistencia con el estilo existente
- Documentar funciones complejas con comentarios

---

**Última actualización**: 2025-11-28

