# Multiuser MS

Microservicio NestJS para la gestión de grupos familiares y usuarios. El servicio corre en Google Cloud Run y persiste datos en una base PostgreSQL alojada en Neon. Actualmente el repositorio únicamente contiene el backend; cualquier referencia a frontend móvil o a microservicios externos fue eliminada del código.

## Resumen funcional

- Creación y aseguramiento de grupos familiares para pacientes autenticados (`POST /multiuser/my-family-group`, `POST /multiuser/session/login`).
- Administración manual de líderes, miembros y grupos familiares para casos administrativos.
- Selecciones y utilidades centralizadas (`src/utils`) que evitan duplicar lógica Prisma o SQL sin procesar.
- Tipos reutilizables (`src/types/multiuser.ts`) para mantener consistencia entre servicio y controladores.
- Documentación Swagger disponible en `/api/docs` tanto en el despliegue como en entornos locales.
- Pipeline de construcción y despliegue automatizado con Cloud Build (`cloudbuild.yaml`).

## Tecnologías principales

- **Runtime**: Node.js 20 / NestJS 10.
- **ORM**: Prisma 6 contra PostgreSQL (Neon).
- **Autenticación básica**: bcrypt para hash de contraseñas generadas automáticamente.
- **Documentación**: `@nestjs/swagger`.

No se utilizan librerías HTTP externas (Axios se eliminó porque ya no hay comunicación con microservicios remotos).

## Estructura relevante

```
src/
├── app.module.ts
├── main.ts                 # Bootstrap + configuración Swagger
├── multiuser/
│   ├── dto/                # DTO activos (creación/actualización de grupos, líderes, etc.)
│   ├── multiuser.controller.ts
│   └── multiuser.service.ts
├── types/
│   └── multiuser.ts        # Tipos derivados de Prisma
└── utils/
    ├── identifiers.ts      # Generación de UUID corto (8 caracteres)
    ├── patient-record.ts   # Lectura/actualización directa en tabla patients (SQL crudo)
    └── prisma-selects.ts   # Select/include compartidos para Prisma

prisma/
├── schema.prisma
└── migrations/

cloudbuild.yaml             # Pipeline Cloud Build → Cloud Run
Dockerfile                  # Imagen base para el servicio
README.md                   # Este documento
```

## Configuración de Secretos

El proyecto utiliza **Google Secret Manager** para gestionar credenciales de forma segura. El secreto `multiuser-secrets` contiene un archivo JSON con las variables de entorno sensibles.

### Estructura del secreto

El secreto `multiuser-secrets` debe contener un archivo JSON con el siguiente formato:

```json
{
  "DATABASE_URL": "postgresql://<usuario>:<password>@<host>.neon.tech/<database>?sslmode=require&channel_binding=require"
}
```

### Crear/Actualizar el secreto

1. **Desde la consola web de Google Cloud:**
   - Ve a **Secret Manager** en Google Cloud Console
   - Crea o actualiza el secreto `multiuser-secrets`
   - Sube el archivo JSON usando la opción "Upload file"

2. **Desde la línea de comandos:**
   ```bash
   # Crear el secreto
   gcloud secrets create multiuser-secrets \
     --data-file=multiuser-secrets.json \
     --project=TU_PROJECT_ID \
     --replication-policy="automatic"
   
   # O actualizar versión existente
   gcloud secrets versions add multiuser-secrets \
     --data-file=multiuser-secrets.json \
     --project=TU_PROJECT_ID
   ```

### Permisos requeridos

Asegúrate de que Cloud Build y Cloud Run tengan permisos para acceder al secreto:

```bash
# Obtener PROJECT_NUMBER
PROJECT_NUMBER=$(gcloud projects describe TU_PROJECT_ID --format="value(projectNumber)")

# Permisos para Cloud Build
gcloud secrets add-iam-policy-binding multiuser-secrets \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=TU_PROJECT_ID

# Permisos para Cloud Run
gcloud secrets add-iam-policy-binding multiuser-secrets \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=TU_PROJECT_ID
```

### Variables de entorno

- `DATABASE_URL`: Se carga automáticamente desde el secreto JSON montado en `/secrets/multiuser-secrets.json` al iniciar la aplicación.
- `PUBLIC_BASE_URL`: Se usa para registrar el servidor público en Swagger (valor por defecto: `https://multiuser-ms-695418284847.southamerica-west1.run.app`).
- `PORT`: Cloud Run fija el valor (8080); mantenla si ejecutas el servicio en local.

### Cómo funciona

1. **En Cloud Build:** El secreto se carga como variable de entorno `MULTIUSER_SECRETS_JSON` y se usa para extraer `DATABASE_URL` durante las migraciones de Prisma.
2. **En Cloud Run:** El secreto se monta como archivo en `/secrets/multiuser-secrets.json` y la aplicación lo lee al iniciar para cargar `DATABASE_URL` en `process.env`.
3. **En desarrollo local:** Usa variables de entorno directamente o crea un archivo `.env` (no se sube a Git).

## Scripts npm

| Script             | Descripción                                                                     |
|--------------------|---------------------------------------------------------------------------------|
| `npm run build`    | Compila TypeScript hacia `dist/`.                                               |
| `npm run start`    | Ejecuta la app en modo producción (`node dist/main`).                           |
| `npm run start:dev`| Útil para depuración local con recarga en caliente.                             |
| `npm run start:prod`| Alias para ejecutar directamente la versión compilada.                         |

> El flujo operativo estándar no depende de `start:dev`; lo normal es desplegar mediante Cloud Build.

## Flujo de despliegue

1. Al hacer push a `main`, Cloud Build se dispara mediante el `trigger` configurado.
2. El pipeline (`cloudbuild.yaml`):
   - Construye la imagen Docker y la sube a Artifact Registry
   - Ejecuta migraciones de Prisma usando `DATABASE_URL` extraído del secreto `multiuser-secrets`
   - Despliega la imagen en Cloud Run con el secreto montado como archivo JSON
3. Cloud Run monta el secreto `multiuser-secrets` como archivo en `/secrets/multiuser-secrets.json`
4. La aplicación lee el archivo JSON al iniciar y carga `DATABASE_URL` en `process.env`
5. Prisma se conecta a Neon usando `DATABASE_URL` desde las variables de entorno

## Consumir la API

- Base URL producción: `https://multiuser-ms-695418284847.southamerica-west1.run.app/api`
- Swagger UI: `https://multiuser-ms-695418284847.southamerica-west1.run.app/api/docs`

### Ejecución local (opcional)

Solo para depuración:

```bash
npm install
DATABASE_URL="postgresql://..." PUBLIC_BASE_URL="http://localhost:8080" npm run start:dev
# Swagger quedará disponible en http://localhost:8080/api/docs
```

Asegúrate de que Neon acepte conexiones desde tu IP o utiliza un túnel seguro.

## Cambios recientes destacados

- **Migración a Google Secret Manager:** Las credenciales ahora se gestionan mediante el secreto `multiuser-secrets` en lugar de variables de entorno directas. El secreto se monta como archivo JSON y se lee al iniciar la aplicación.
- Se eliminó el consumo de microservicios externos y el servicio `forms-microservice.service.ts`.
- Se reorganizó la lógica de selects y SQL en utilidades (`src/utils/prisma-selects.ts`, `src/utils/patient-record.ts`).
- Se depuraron DTOs y carpetas obsoletas (`components`, `hooks`, `pages`, etc.).
- Se removieron `@nestjs/axios` y `axios` de `package.json` y `package-lock.json` porque el código ya no los usa.

## Preguntas frecuentes

**¿Por qué ya no está Axios?**  
El microservicio dejó de hacer llamadas HTTP a otros servicios. Toda la información se obtiene directamente desde la base de datos Neon; mantener Axios solo agregaba dependencia innecesaria.

**¿Cómo aplico migraciones Prisma?**  
Las migraciones se ejecutan automáticamente en el pipeline de Cloud Build antes del despliegue. El pipeline extrae `DATABASE_URL` del secreto `multiuser-secrets` y lo usa para ejecutar `npx prisma migrate deploy`.

**¿Cómo funciona el secreto multiuser-secrets?**  
El secreto contiene un archivo JSON con `DATABASE_URL`. Cloud Run lo monta como archivo en `/secrets/multiuser-secrets.json` y la aplicación lo lee al iniciar para cargar las variables de entorno. Esto es más seguro que usar variables de entorno directas porque el secreto se gestiona centralmente en Google Secret Manager.

**¿Hay un frontend?**  
No dentro de este repositorio. Cualquier referencia pasada a un frontend móvil quedó obsoleta; el código actual solo contiene el backend.

## Licencia

ISC.
