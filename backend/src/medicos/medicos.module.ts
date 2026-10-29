import { Module } from '@nestjs/common';
import { MedicosController } from './medicos.controller.js';
import { MedicosService } from './medicos.service.js';

@Module({
  controllers: [MedicosController],
  providers: [MedicosService],
  exports: [MedicosService],
})
export class MedicosModule {}
