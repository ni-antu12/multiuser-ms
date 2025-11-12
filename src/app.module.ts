import { Module } from '@nestjs/common';
import { MultiuserController } from './multiuser/multiuser.controller';
import { MultiuserService } from './multiuser/multiuser.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  controllers: [MultiuserController],
  providers: [MultiuserService, PrismaService],
})
export class AppModule {}
