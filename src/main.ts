import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Opcional: prefijo global para todos los endpoints (ej: /api)
  app.setGlobalPrefix('api');

  // Opcional: habilitar CORS
  app.enableCors();

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Multi-User Microservice API')
    .setDescription('API para gestión de grupos familiares con límite de 8 miembros')
    .setVersion('1.0')
    .addTag('multiuser', '🎯 Gestión completa de usuarios y grupos familiares')
    .addTag('utils', '🛠️ Utilidades como generación de UUIDs')
    .addServer('http://localhost:3000', 'Servidor de desarrollo')
    .addServer('https://multiuser-ms-759723220385.southamerica-west1.run.app', 'Cloud Run (producción)')

    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Puerto en el que escuchará la app
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 NestJS corriendo en: http://localhost:${port}/api`);
  console.log(`📱 Acceso móvil: http://172.29.48.1:${port}/api`);
  console.log(`📚 Swagger UI disponible en: http://localhost:${port}/api/docs`);
}
bootstrap();
