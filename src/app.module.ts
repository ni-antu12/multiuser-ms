import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MultiuserController } from './multiuser/multiuser.controller';
import { MultiuserService } from './multiuser/multiuser.service';
import { PrismaService } from './prisma/prisma.service';
import { EnsureFamilyGroupFromRutInterceptor } from './auth/interceptors/ensure-family-group-from-rut.interceptor';
import { RutAuthGuard } from './auth/guards/rut-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [MultiuserController],
  providers: [
    MultiuserService,
    PrismaService,
    EnsureFamilyGroupFromRutInterceptor,
    RutAuthGuard,
  ],
})
export class AppModule {}
