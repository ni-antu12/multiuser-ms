# Configuración para Cloud Run

Este documento explica cómo configurar el microservicio multiusuario para conectarse a un microservicio de formularios dinámicos que está ejecutándose en Google Cloud Run.

## Variables de Entorno

### Variables Requeridas

```bash
# URL del microservicio de formularios en Cloud Run
FORMS_MICROSERVICE_URL=https://your-forms-microservice-url.run.app
```

### Variables Opcionales

```bash
# Timeout para las peticiones a Cloud Run (en milisegundos)
CLOUD_RUN_TIMEOUT=10000

# API Key para autenticación con Cloud Run (si es necesario)
CLOUD_RUN_API_KEY=your-api-key-here

# Región de Cloud Run
CLOUD_RUN_REGION=us-central1

# ID del proyecto de Google Cloud
CLOUD_RUN_PROJECT_ID=your-project-id
```

## Configuración Local

### 1. Crear archivo .env

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Configuración de la base de datos
DATABASE_URL="postgresql://postgres:password@localhost:5433/multiuser_db?schema=public"

# Configuración del microservicio de formularios en Cloud Run
FORMS_MICROSERVICE_URL="https://your-forms-microservice-url.run.app"
CLOUD_RUN_TIMEOUT=10000
CLOUD_RUN_API_KEY="your-api-key-here"
CLOUD_RUN_REGION="us-central1"
CLOUD_RUN_PROJECT_ID="your-project-id"

# Puerto del servidor
PORT=3000
```

### 2. Ejecutar con Docker Compose

```bash
# Ejecutar con las variables de entorno
docker-compose up --build
```

## Configuración en Producción

### 1. Variables de Entorno en el Servidor

Asegúrate de que las siguientes variables estén configuradas en tu servidor de producción:

```bash
export FORMS_MICROSERVICE_URL="https://your-forms-microservice-url.run.app"
export CLOUD_RUN_TIMEOUT="10000"
export CLOUD_RUN_API_KEY="your-api-key-here"
```

### 2. Configuración en Google Cloud Run

Si tu microservicio multiusuario también se ejecuta en Cloud Run, puedes configurar las variables de entorno en la consola de Google Cloud:

1. Ve a Cloud Run en la consola de Google Cloud
2. Selecciona tu servicio
3. Ve a la pestaña "Variables y secretos"
4. Agrega las variables de entorno necesarias

## Endpoints del Microservicio de Formularios

El microservicio de formularios debe exponer los siguientes endpoints:

### 1. Health Check
```
GET /health
```

### 2. Validación de Líder
```
GET /api/users/leader/{leaderUuid}
```

**Respuesta esperada:**
```json
{
  "isLeader": true,
  "userData": {
    "uuid": "nP7vQ8rT",
    "email": "leader@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "isActive": true
  }
}
```

### 3. Información de Usuario
```
GET /api/users/{userUuid}
```

## Autenticación

### Con API Key

Si tu microservicio de formularios requiere autenticación, puedes configurar una API key:

```bash
export CLOUD_RUN_API_KEY="your-api-key-here"
```

El servicio automáticamente incluirá el header de autorización:

```
Authorization: Bearer your-api-key-here
```

### Con Google Cloud IAM

Para una autenticación más robusta, puedes usar Google Cloud IAM:

1. Configura el servicio para usar una cuenta de servicio
2. Asigna los permisos necesarios
3. El servicio usará la autenticación automática de Google Cloud

## Monitoreo y Logs

El servicio incluye logs detallados para monitorear la conexión con Cloud Run:

- Errores de conexión
- Timeouts
- Respuestas del microservicio de formularios
- Health check failures

## Troubleshooting

### Error: "Error al conectar con el microservicio de formularios dinámicos en Cloud Run"

1. Verifica que la URL del microservicio sea correcta
2. Asegúrate de que el microservicio esté ejecutándose en Cloud Run
3. Verifica que el endpoint `/health` esté disponible
4. Revisa los logs del microservicio de formularios

### Error: "Timeout"

1. Aumenta el valor de `CLOUD_RUN_TIMEOUT`
2. Verifica la latencia de red
3. Considera usar una región más cercana

### Error: "Unauthorized"

1. Verifica que la API key sea correcta
2. Asegúrate de que el microservicio de formularios esté configurado para aceptar la autenticación
3. Revisa los permisos de IAM si usas autenticación de Google Cloud

## Ejemplo de Configuración Completa

```bash
# .env
DATABASE_URL="postgresql://postgres:password@localhost:5433/multiuser_db?schema=public"
FORMS_MICROSERVICE_URL="https://forms-microservice-abc123.run.app"
CLOUD_RUN_TIMEOUT=15000
CLOUD_RUN_API_KEY="AIzaSyC..."
CLOUD_RUN_REGION="us-central1"
CLOUD_RUN_PROJECT_ID="my-project-123"
PORT=3000
```

## Verificación

Para verificar que la configuración funciona correctamente:

1. Ejecuta el health check:
```bash
curl -X GET "http://localhost:3000/multiuser/health"
```

2. Intenta crear un grupo familiar (esto validará la conexión con Cloud Run):
```bash
curl -X POST "http://localhost:3000/multiuser/family-groups" \
  -H "Content-Type: application/json" \
  -H "X-User-UUID: nP7vQ8rT" \
  -d '{
    "uuid": "aB3x9K2m",
    "leader": "nP7vQ8rT",
    "tokenApp": "token123"
  }'
```
