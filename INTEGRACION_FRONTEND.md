# Guía de Integración Frontend - App Móvil

## Flujo de Autenticación y Grupo Familiar

### 1. Login en el Servicio de Autenticación

La app móvil primero debe autenticar al usuario en el servicio de autenticación (no en este microservicio).

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

### 2. Inicializar Sesión en Multiuser MS

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

### 3. Guardar Información Localmente

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

### 4. Peticiones Subsecuentes

Para todas las peticiones posteriores al microservicio, solo necesitas enviar el RUT en el header `X-User-RUT`. El interceptor automáticamente garantizará que el usuario tenga grupo familiar.

```javascript
// Ejemplo: Obtener mi grupo familiar
const myGroupResponse = await fetch(
  'https://multiuser-ms-695418284847.southamerica-west1.run.app/api/v1/multiuser/my-family-group',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-RUT': user.rut  // RUT guardado localmente
    }
  }
);
```

## Endpoints Principales

### POST `/api/v1/multiuser/session/init`
**Uso**: Llamar después del login para inicializar sesión y garantizar grupo familiar.

**Headers requeridos**:
- `X-User-RUT`: RUT del usuario

**Body opcional** (si quieres enviar datos adicionales):
```json
{
  "rut": "12345678-9",
  "email": "usuario@ejemplo.com",
  "firstName": "Juan",
  "lastNamePaterno": "Pérez",
  "lastNameMaterno": "González"
}
```

**Respuesta**:
```json
{
  "user": {
    "uuid": "nP7vQ8rT",
    "rut": "12345678-9",
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "lastNamePaterno": "Pérez",
    "isLeader": true,
    "familyGroupsUuid": "aB3x9K2m"
  },
  "familyGroup": {
    "uuid": "aB3x9K2m",
    "leader": "nP7vQ8rT",
    "tokenApp": "token123",
    "maxMembers": 8
  },
  "createdUser": false,
  "createdGroup": false,
  "message": "El usuario ya contaba con un grupo familiar"
}
```

### POST `/api/v1/multiuser/my-family-group`
**Uso**: Obtener información de mi grupo familiar.

**Headers requeridos**:
- `X-User-RUT`: RUT del usuario

### GET `/api/v1/multiuser/family-groups/{uuid}`
**Uso**: Obtener información detallada de un grupo familiar.

**Headers requeridos**:
- `X-User-RUT`: RUT del usuario

## Notas Importantes

1. **El interceptor es automático**: No necesitas llamar a `session/init` en cada petición. El interceptor garantiza automáticamente el grupo familiar en cada request autenticado.

2. **RUT es la identificación**: El RUT es lo único que necesitas para identificar al usuario. No hay tokens JWT en este microservicio.

3. **Primera vez**: Si es la primera vez que el usuario se loguea, `createdUser` y `createdGroup` serán `true` en la respuesta de `session/init`.

4. **Endpoints públicos**: Solo el endpoint `/multiuser/health` es público. Todos los demás requieren el header `X-User-RUT`.

## Ejemplo Completo de Flujo

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

