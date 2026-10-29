import { Module } from '@nestjs/common';
import { ExamesModule } from './exames/exames.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, ExamesModule],
})
export class AppModule {}
