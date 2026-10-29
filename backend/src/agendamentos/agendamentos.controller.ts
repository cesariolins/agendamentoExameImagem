import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RespostasDeErro } from '../comum/respostas-de-erro.dto.js';
import { ID_DA_ROTA } from '../comum/validacao.js';
import {
  type AgendamentoResposta,
  CriarAgendamentoDto,
  FiltroDeAgendamentosDto,
} from './agendamentos.dto.js';
import { AgendamentosService } from './agendamentos.service.js';

@ApiTags('Agendamentos')
@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly agendamentos: AgendamentosService) {}

  @Post()
  @ApiOperation({
    summary: 'Agenda um exame',
    description:
      'O início precisa ser um horário livre da grade do médico para aquele exame. ' +
      'Pedidos simultâneos para horários que se cruzam: só um é aceito; os demais recebem 409.',
  })
  @RespostasDeErro(
    'DADOS_INVALIDOS',
    'MEDICO_NAO_ENCONTRADO',
    'EXAME_NAO_ENCONTRADO',
    'CONFLITO_DE_HORARIO',
    'HORARIO_NO_PASSADO',
    'FORA_DO_EXPEDIENTE',
    'HORARIO_FORA_DA_GRADE',
  )
  criar(@Body() dto: CriarAgendamentoDto): Promise<AgendamentoResposta> {
    return this.agendamentos.criar(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista agendamentos, ordenados pelo início' })
  @RespostasDeErro('DADOS_INVALIDOS')
  listar(@Query() filtro: FiltroDeAgendamentosDto): Promise<AgendamentoResposta[]> {
    return this.agendamentos.listar(filtro);
  }

  @Patch(':id/cancelar')
  @ApiOperation({
    summary: 'Cancela um agendamento',
    description: 'Cancelamento lógico que libera o horário. Idempotente.',
  })
  @RespostasDeErro('DADOS_INVALIDOS', 'AGENDAMENTO_NAO_ENCONTRADO', 'AGENDAMENTO_JA_INICIADO')
  cancelar(@Param('id', ID_DA_ROTA) id: number): Promise<AgendamentoResposta> {
    return this.agendamentos.cancelar(id);
  }
}
