import { Module } from '@nestjs/common';
import { AgendamentosModule } from './agendamentos/agendamentos.module.js';
import { ExamesModule } from './exames/exames.module.js';
import { MedicosModule } from './medicos/medicos.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, ExamesModule, MedicosModule, AgendamentosModule],
})
export class AppModule {}
