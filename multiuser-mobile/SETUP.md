# 📱 Guía de Configuración - Multiuser Mobile

## 🚀 Instalación

### Requisitos previos

- Node.js 18 o superior
- npm o yarn
- Expo CLI (se instalará automáticamente)
- Para Android: Android Studio con emulador o dispositivo físico
- Para iOS: Xcode (solo en Mac) o dispositivo físico

### Paso 1: Instalar dependencias

```bash
cd multiuser-mobile
npm install
```

### Paso 2: Configurar la URL del backend

Edita el archivo `src/services/api.ts` y ajusta la `baseURL`:

```typescript
const defaultConfig: ApiConfig = {
  baseURL: 'http://TU_IP:3000/api', // Cambia esto
  timeout: 10000,
};
```

**Opciones de URL según tu entorno:**

- **Android Emulator**: `http://10.0.2.2:3000/api`
- **iOS Simulator**: `http://localhost:3000/api`
- **Dispositivo Físico**: `http://TU_IP_LOCAL:3000/api` (ejemplo: `http://192.168.1.10:3000/api`)

Para obtener tu IP local:
- **Windows**: `ipconfig` en CMD
- **Mac/Linux**: `ifconfig` en Terminal

### Paso 3: Iniciar el proyecto

```bash
npm start
```

Esto abrirá Expo DevTools en tu navegador.

### Paso 4: Ejecutar en dispositivo/emulador

**Opción A: Escanear código QR (recomendado para pruebas)**
1. Instala "Expo Go" en tu teléfono (iOS o Android)
2. Escanea el código QR que aparece en la terminal

**Opción B: Android Emulator**
```bash
npm run android
```

**Opción C: iOS Simulator (solo Mac)**
```bash
npm run ios
```

## 🔧 Configuración del Backend

Asegúrate de que tu backend esté corriendo en `http://localhost:3000` (o la URL que configuraste).

Para verificar la conexión:
1. Abre la app
2. Ve al Dashboard
3. Si ves "API Conectada" con un punto verde, todo está bien

## 📝 Estructura del Proyecto

```
multiuser-mobile/
├── App.tsx                 # Punto de entrada
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── constants/         # Constantes (colores, etc.)
│   ├── navigation/        # Configuración de navegación
│   ├── screens/           # Pantallas de la app
│   ├── services/          # Servicios API
│   └── types/             # Tipos TypeScript
├── assets/                # Imágenes y recursos
└── package.json
```

## 🎨 Personalización

### Cambiar colores

Edita `src/constants/colors.ts`:

```typescript
export const Colors = {
  primary: {
    500: '#3B82F6', // Cambia este color
    // ...
  },
  // ...
};
```

### Cambiar nombre de la app

Edita `app.json`:

```json
{
  "expo": {
    "name": "Tu App",
    "slug": "tu-app",
    // ...
  }
}
```

## 🐛 Solución de Problemas

### Error de conexión al backend

1. Verifica que el backend esté corriendo
2. Comprueba la URL en `src/services/api.ts`
3. Si usas dispositivo físico, asegúrate de estar en la misma red WiFi

### La app no se actualiza

Presiona `r` en la terminal de Expo para recargar, o agita el dispositivo y selecciona "Reload"

### Error al instalar dependencias

```bash
# Limpia cache y reinstala
rm -rf node_modules
npm cache clean --force
npm install
```

## 📦 Build para Producción

### Android APK

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Configurar build
eas build:configure

# Crear build
eas build -p android --profile preview
```

### iOS (requiere cuenta de Apple Developer)

```bash
eas build -p ios --profile preview
```

## 🔐 Seguridad

**IMPORTANTE**: Antes de publicar en producción:

1. Cambia la URL del backend a tu servidor de producción
2. Implementa autenticación JWT
3. Agrega manejo de tokens de sesión
4. No expongas credenciales en el código

## 📱 Características de la App

- ✅ Dashboard con estadísticas
- ✅ Gestión de grupos familiares
- ✅ Gestión de líderes
- ✅ Módulo centro médico
- ✅ Navegación con tabs
- ✅ Pull to refresh
- ✅ Estados de carga y error
- ✅ Validación de formularios
- ✅ UI moderna y responsive

## 🆘 Ayuda

- [Documentación de Expo](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)

## 📄 Licencia

Este proyecto es parte del sistema Multiuser.

