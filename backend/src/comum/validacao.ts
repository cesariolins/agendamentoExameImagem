import { ParseIntPipe, ValidationPipe, applyDecorators } from '@nestjs/common';
import { IsISO8601, Matches } from 'class-validator';
import { ErroDeNegocio } from './erros.js';

/** ValidationPipe global: converte tipos, descarta campos desconhecidos e responde no formato padrão. */
export function criarValidationPipe() {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (erros) =>
      new ErroDeNegocio(
        'DADOS_INVALIDOS',
        erros.map((erro) => ({
          campo: erro.property,
          mensagens: Object.values(erro.constraints ?? {}),
        })),
      ),
  });
}

/** `:id` numérico na rota, com erro no formato padrão. */
export const ID_DA_ROTA = new ParseIntPipe({
  exceptionFactory: () =>
    new ErroDeNegocio('DADOS_INVALIDOS', [
      { campo: 'id', mensagens: ['id deve ser um número inteiro.'] },
    ]),
});

/** Data de calendário real no formato YYYY-MM-DD (recusa 2026-02-30 e 03/11/2026). */
export function IsData() {
  const message = '$property deve ser uma data válida no formato AAAA-MM-DD.';
  return applyDecorators(
    Matches(/^\d{4}-\d{2}-\d{2}$/, { message }),
    IsISO8601({ strict: true }, { message }),
  );
}

/** Data e hora ISO 8601 com fuso explícito, para não haver ambiguidade sobre o instante. */
export function IsDataHoraComFuso() {
  const message =
    '$property deve ser data e hora ISO 8601 com fuso, por exemplo 2026-11-03T08:40:00-03:00.';
  return applyDecorators(
    Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/, {
      message,
    }),
    IsISO8601({ strict: true }, { message }),
  );
}
