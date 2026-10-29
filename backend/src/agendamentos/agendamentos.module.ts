import { Module } from '@nestjs/common';
import { MedicosModule } from '../medicos/medicos.module.js';
import { AgendamentosController } from './agendamentos.controller.js';
import { AgendamentosService } from './agendamentos.service.js';

@Module({
  imports: [MedicosModule],
  controllers: [AgendamentosController],
  providers: [AgendamentosService],
})
export class AgendamentosModule {}
