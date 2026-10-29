import { Module } from '@nestjs/common';
import { ExamesModule } from './exames/exames.module.js';
import { MedicosModule } from './medicos/medicos.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, ExamesModule, MedicosModule],
})
export class AppModule {}
