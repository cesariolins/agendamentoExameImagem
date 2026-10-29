import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiResponse } from '@nestjs/swagger';
import { CATALOGO_DE_ERROS, type CodigoDeErro } from './erros.js';

export class DetalheDeCampoResposta {
  @ApiProperty({ example: 'pacienteNome' })
  campo: string;

  @ApiProperty({ example: ['pacienteNome deve ter entre 3 e 120 caracteres.'] })
  mensagens: string[];
}

export class RespostaDeErro {
  @ApiProperty({ example: 422 })
  statusCode: number;

  @ApiProperty({
    description: 'Código estável para tratamento no cliente',
    example: 'FORA_DO_EXPEDIENTE',
  })
  codigo: string;

  @ApiProperty({ description: 'Mensagem pronta para exibir ao usuário' })
  mensagem: string;

  @ApiPropertyOptional({
    description: 'Erros por campo, quando a validação falha',
    type: [DetalheDeCampoResposta],
  })
  detalhes?: DetalheDeCampoResposta[];
}

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
