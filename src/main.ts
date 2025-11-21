import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';

// Cargar DATABASE_URL desde el secreto JSON montado por Cloud Run
if (!process.env.DATABASE_URL) {
  try {
    const secrets = JSON.parse(fs.readFileSync('/secrets/multiuser-secrets.json', 'utf8'));
    if (secrets.DATABASE_URL) {
      process.env.DATABASE_URL = secrets.DATABASE_URL;
    }
  } catch (error) {
    // El archivo no existe o hay error, usar variables de entorno existentes
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global siguiendo el patrón del gateway: /api/v1
  app.setGlobalPrefix('api/v1');

  // Opcional: habilitar CORS
  app.enableCors();

  // Configuración de Swagger siguiendo el patrón del gateway
  const publicBaseUrl =
    process.env.PUBLIC_BASE_URL ||
    'https://multiuser-ms-695418284847.southamerica-west1.run.app';

  const config = new DocumentBuilder()
    .setTitle('Multi-User Microservice API')
    .setDescription('API para gestión de grupos familiares con límite de 8 miembros')
    .setVersion('1.0.0')
    .addServer(publicBaseUrl, 'Cloud Run')
    .addServer(`${publicBaseUrl}/api/v1`, 'Gateway Path')
    .addTag('multiuser', '🎯 Gestión completa de usuarios y grupos familiares')
    .addTag('utils', '🛠️ Utilidades como generación de UUIDs')
    // Configuración de seguridad X-API-Key como en el gateway
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key para autenticación del gateway',
      },
      'api_key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Aplicar seguridad globalmente a todos los endpoints
  // Esto hace que todos los endpoints requieran X-API-Key por defecto
  Object.values(document.paths || {}).forEach((path: any) => {
    Object.values(path || {}).forEach((method: any) => {
      if (method && typeof method === 'object' && !method.security) {
        method.security = [{ api_key: [] }];
      }
    });
  });

  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Puerto en el que escuchará la app
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Servicio desplegado escuchando en el puerto ${port}`);
  console.log(`📚 Swagger UI disponible en: ${publicBaseUrl}/api/v1/docs`);
}
bootstrap();
