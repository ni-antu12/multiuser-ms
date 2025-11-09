import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MultiuserController } from './multiuser/multiuser.controller';
import { MultiuserService } from './multiuser/multiuser.service';
import { FormsMicroserviceService } from './multiuser/forms-microservice.service';
import { PatientsService } from './multiuser/patients.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [MultiuserController],
  providers: [MultiuserService, FormsMicroserviceService, PatientsService, PrismaService],
})
export class AppModule {}
