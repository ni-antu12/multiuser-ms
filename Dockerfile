#Imagen para Node
FROM node:20

#Directorio de trabajo
WORKDIR /usr/src/app

#Instala NestJS CLI globalmente
RUN npm install -g @nestjs/cli

#Copia los archivos package.json y package-lock.json
COPY package*.json ./

#Instala las dependencias
RUN npm install

#Copia el resto del codigo
COPY . .

#Generar cliente de Prisma
RUN npx prisma generate

#Exponer el puerto 3000
EXPOSE $PORT

#Comando para ejecutar el servidor
CMD ["npm", "run", "start:dev"]