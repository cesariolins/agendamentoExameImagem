import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { CATALOGO_DE_ERROS, type CodigoDeErro } from './erros.js';

/** Formato de toda resposta de erro da API (documentação Swagger). */
export class RespostaDeErro {
  /** Status HTTP */
  statusCode: number;
  /** Código estável para tratamento no cliente */
  codigo: string;
  /** Mensagem pronta para exibir ao usuário */
  mensagem: string;
  /** Erros por campo, quando a validação falha */
  detalhes?: { campo: string; mensagens: string[] }[];
}

/** Documenta no Swagger os erros que uma rota pode devolver, agrupados por status HTTP. */
export function RespostasDeErro(...codigos: CodigoDeErro[]) {
  const porStatus = new Map<number, string[]>();
  for (const codigo of codigos) {
    const { status, mensagem } = CATALOGO_DE_ERROS[codigo];
    porStatus.set(status, [...(porStatus.get(status) ?? []), `\`${codigo}\`: ${mensagem}`]);
  }
  return applyDecorators(
    ...[...porStatus].map(([status, linhas]) =>
      ApiResponse({ status, description: linhas.join('<br>'), type: RespostaDeErro }),
    ),
  );
}
