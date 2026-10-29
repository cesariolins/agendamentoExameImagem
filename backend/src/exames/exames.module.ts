import { Module } from '@nestjs/common';
import { ExamesController } from './exames.controller.js';
import { ExamesService } from './exames.service.js';

@Module({
  controllers: [ExamesController],
  providers: [ExamesService],
})
export class ExamesModule {}
