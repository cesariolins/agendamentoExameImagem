import type { INestApplication } from '@nestjs/common';
import { FiltroDeErros } from './comum/filtro-de-erros.js';
import { criarValidationPipe } from './comum/validacao.js';

export function configurarApp<T extends INestApplication>(app: T): T {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(criarValidationPipe());
  app.useGlobalFilters(new FiltroDeErros());
  return app;
}
