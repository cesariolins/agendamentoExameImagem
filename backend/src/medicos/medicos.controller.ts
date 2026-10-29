import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RespostasDeErro } from '../comum/respostas-de-erro.dto.js';
import { ID_DA_ROTA } from '../comum/validacao.js';
import {
  ConsultaDeHorariosDto,
  type HorariosResposta,
  type MedicoResposta,
} from './medicos.dto.js';
import { MedicosService } from './medicos.service.js';

@ApiTags('Médicos')
@Controller('medicos')
export class MedicosController {
  constructor(private readonly medicos: MedicosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os médicos com seus turnos semanais' })
  listar(): Promise<MedicoResposta[]> {
    return this.medicos.listar();
  }

  @Get(':id/horarios')
  @ApiOperation({
    summary: 'Horários livres de um médico numa data',
    description:
      'A grade parte do início de cada turno, em passos iguais à duração do exame. ' +
      'Ficam de fora os horários que estouram o turno, que cruzam agendamentos ativos ou que já passaram.',
  })
  @RespostasDeErro('DADOS_INVALIDOS', 'MEDICO_NAO_ENCONTRADO', 'EXAME_NAO_ENCONTRADO')
  horarios(
    @Param('id', ID_DA_ROTA) id: number,
    @Query() consulta: ConsultaDeHorariosDto,
  ): Promise<HorariosResposta> {
    return this.medicos.horariosLivres(id, consulta);
  }
}
