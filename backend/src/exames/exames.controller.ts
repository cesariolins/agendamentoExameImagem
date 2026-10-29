import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RespostasDeErro } from '../comum/respostas-de-erro.dto.js';
import { BuscaDeExamesDto, type ExameResposta } from './exames.dto.js';
import { ExamesService } from './exames.service.js';

@ApiTags('Exames')
@Controller('exames')
export class ExamesController {
  constructor(private readonly exames: ExamesService) {}

  @Get()
  @ApiOperation({ summary: 'Busca exames por nome' })
  @RespostasDeErro('DADOS_INVALIDOS')
  buscar(@Query() { busca }: BuscaDeExamesDto): Promise<ExameResposta[]> {
    return this.exames.buscar(busca);
  }
}
