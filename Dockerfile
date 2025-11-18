# Imagen base de Node
FROM node:20

# Directorio de trabajo
WORKDIR /usr/src/app

# Copia de archivos de dependencias
COPY package*.json ./

# Instalación de dependencias (incluye dev para compilar)
RUN npm install

# Copiamos el código fuente
COPY . .

# Genera Prisma Client y compila NestJS
RUN npx prisma generate
RUN npm run build

# Variables de entorno recomendadas
ENV NODE_ENV=production
ENV PORT=8080

# Exponemos el puerto que Cloud Run utilizará
EXPOSE 8080

# Verificar que el build fue exitoso
RUN test -f dist/src/main.js || (echo "Error: dist/src/main.js no existe" && exit 1)

# Ejecutamos la versión compilada directamente (más rápido que npm run)
CMD ["node", "dist/src/main.js"] 