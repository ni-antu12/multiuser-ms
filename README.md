# Microservicio Multiusuario

Un microservicio robusto para gestión de usuarios y grupos familiares construido con NestJS, Prisma y PostgreSQL.

## Características

- **Gestión de Usuarios**: CRUD completo con validaciones robustas
- **Grupos Familiares**: Sistema de grupos con límite de miembros
- **UUIDs Cortos**: Identificadores únicos de 8 caracteres alfanuméricos
- **Validaciones Automáticas**: Generación automática de UUIDs cuando no se proporcionan
- **Integración con Microservicios**: Comunicación con servicios de formularios dinámicos
- **Documentación API**: Swagger/OpenAPI integrado
- **Seguridad**: Encriptación de contraseñas con bcrypt

## Manejo de UUIDs

### Enfoque Actual
- **Decoradores de class-validator**: Uso de `@Length()` y `@Matches()` para validación
- **UUIDs proporcionados por el usuario**: Los UUIDs deben ser proporcionados en las peticiones
- **Validaciones robustas**: Patrón de 8 caracteres alfanuméricos (A-Z, a-z, 0-9)
- **Sin generación automática**: Enfoque más simple y directo

## Estructura del Proyecto

```
src/
├── multiuser/
│   ├── dto/                    # Data Transfer Objects
│   │   ├── create-user.dto.ts
│   │   ├── update-user.dto.ts
│   │   ├── create-family-group.dto.ts
│   │   └── update-family-group.dto.ts
│   ├── dto/                    # Data Transfer Objects
│   ├── multiuser.controller.ts
│   ├── multiuser.service.ts
│   └── forms-microservice.service.ts
├── prisma/
│   ├── schema.prisma           # Esquema de base de datos
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
```

## API Endpoints

### Usuarios
- `POST /multiuser/users` - Crear usuario (UUID opcional)
- `GET /multiuser/users` - Listar todos los usuarios
- `GET /multiuser/users/uuid/:uuid` - Buscar usuario por UUID
- `GET /multiuser/users/rut/:rut` - Buscar usuario por RUT
- `PATCH /multiuser/users/:uuid` - Actualizar usuario
- `DELETE /multiuser/users/:uuid` - Eliminar usuario

### Grupos Familiares
- `POST /multiuser/family-groups` - Crear grupo familiar (UUID opcional)
- `GET /multiuser/family-groups` - Listar todos los grupos
- `GET /multiuser/family-groups/:uuid` - Buscar grupo por UUID
- `PATCH /multiuser/family-groups/:uuid` - Actualizar grupo
- `DELETE /multiuser/family-groups/:uuid` - Eliminar grupo

### Utilidades
- `GET /multiuser/health` - Health check

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

## Instalación y Uso

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
# Configurar DATABASE_URL en .env
npx prisma migrate dev
```

4. **Ejecutar en desarrollo**
```bash
npm run start:dev
```

5. **Construir para producción**
```bash
npm run build
```

## Docker

```bash
# Construir imagen
docker build -t multiuser-ms .

# Ejecutar con docker-compose
docker-compose up -d
```

## Dependencias Principales

- **NestJS**: Framework de Node.js
- **Prisma**: ORM para base de datos
- **class-validator**: Validaciones de DTOs
- **bcryptjs**: Encriptación de contraseñas
- **@nestjs/swagger**: Documentación API

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia ISC.
