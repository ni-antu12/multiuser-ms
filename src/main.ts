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
  const publicBaseUrl =
    process.env.PUBLIC_BASE_URL ||
    'https://multiuser-ms-759723220385.southamerica-west1.run.app';

  const config = new DocumentBuilder()
    .setTitle('Multi-User Microservice API')
    .setDescription('API para gestión de grupos familiares con límite de 8 miembros')
    .setVersion('1.0')
    .addTag('multiuser', '🎯 Gestión completa de usuarios y grupos familiares')
    .addTag('utils', '🛠️ Utilidades como generación de UUIDs')
    .addServer(publicBaseUrl, 'Cloud Run')

    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Puerto en el que escuchará la app
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Servicio desplegado escuchando en el puerto ${port}`);
  console.log(`📚 Swagger UI disponible en: ${publicBaseUrl}/api/docs`);
}
bootstrap();
