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

## Variables de entorno

Configura las variables directamente en Cloud Run o en el pipeline CI/CD:

```bash
DATABASE_URL="postgresql://<usuario>:<password>@<host>.neon.tech/<database>?sslmode=require"
PUBLIC_BASE_URL="https://multiuser-ms-759723220385.southamerica-west1.run.app"
PORT=8080
```

- `DATABASE_URL`: cadena de conexión Neon (requiere TLS).
- `PUBLIC_BASE_URL`: se usa para registrar el servidor público en Swagger.
- `PORT`: Cloud Run fija el valor (8080); mantenla si ejecutas el servicio en local.

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
2. El pipeline instala dependencias, ejecuta `npm run build`, construye una imagen Docker y la sube a Artifact Registry.
3. Cloud Build actualiza el servicio Cloud Run `multiuser-ms` en la región `southamerica-west1`.
4. Prisma conecta con Neon usando `DATABASE_URL`; aplica migraciones con `prisma migrate deploy` cuando corresponda.

## Consumir la API

- Base URL producción: `https://multiuser-ms-759723220385.southamerica-west1.run.app/api`
- Swagger UI: `https://multiuser-ms-759723220385.southamerica-west1.run.app/api/docs`

### Ejecución local (opcional)

Solo para depuración:

```bash
npm install
DATABASE_URL="postgresql://..." PUBLIC_BASE_URL="http://localhost:8080" npm run start:dev
# Swagger quedará disponible en http://localhost:8080/api/docs
```

Asegúrate de que Neon acepte conexiones desde tu IP o utiliza un túnel seguro.

## Cambios recientes destacados

- Se eliminó el consumo de microservicios externos y el servicio `forms-microservice.service.ts`.
- Se reorganizó la lógica de selects y SQL en utilidades (`src/utils/prisma-selects.ts`, `src/utils/patient-record.ts`).
- Se depuraron DTOs y carpetas obsoletas (`components`, `hooks`, `pages`, etc.).
- Se removieron `@nestjs/axios` y `axios` de `package.json` y `package-lock.json` porque el código ya no los usa.

## Preguntas frecuentes

**¿Por qué ya no está Axios?**  
El microservicio dejó de hacer llamadas HTTP a otros servicios. Toda la información se obtiene directamente desde la base de datos Neon; mantener Axios solo agregaba dependencia innecesaria.

**¿Cómo aplico migraciones Prisma?**  
Ejecuta `npx prisma migrate deploy` con la variable `DATABASE_URL` configurada. Esto es lo que debe correr en el pipeline antes o después del despliegue según tu estrategia.

**¿Hay un frontend?**  
No dentro de este repositorio. Cualquier referencia pasada a un frontend móvil quedó obsoleta; el código actual solo contiene el backend.

## Licencia

ISC.
