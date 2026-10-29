import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { IsData } from '../comum/validacao.js';

export class ConsultaDeHorariosDto {
  @ApiProperty({
    description: 'Data no fuso da clínica (America/Sao_Paulo)',
    example: '2026-11-03',
  })
  @IsData()
  data: string;

  @ApiProperty({ description: 'Exame cuja duração define a grade de horários', example: 7 })
  @Type(() => Number)
  @IsInt({ message: 'exameId deve ser um número inteiro.' })
  @Min(1, { message: 'exameId deve ser maior que zero.' })
  exameId: number;
}

export class TurnoResposta {
  @ApiProperty({ description: '0 = domingo … 6 = sábado', example: 1 })
  diaSemana: number;

  @ApiProperty({ example: '08:00' })
  inicio: string;

  @ApiProperty({ example: '12:00' })
  fim: string;
}

export class MedicoResposta {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Dra. Helena Marques' })
  nome: string;

  @ApiProperty({ example: 'CRM-MG 11111' })
  crm: string;

  turnos: TurnoResposta[];
}

export class HorarioResposta {
  @ApiProperty({ example: '2026-11-03T08:00:00-03:00' })
  inicio: string;

  @ApiProperty({ example: '2026-11-03T08:40:00-03:00' })
  fim: string;
}

export class HorariosResposta {
  @ApiProperty({ example: 1 })
  medicoId: number;

  @ApiProperty({ example: 7 })
  exameId: number;

  @ApiProperty({ example: '2026-11-03' })
  data: string;

  @ApiProperty({ example: 40 })
  duracaoMinutos: number;

  @ApiProperty({
    description:
      'Se o médico tem turno nesse dia da semana (distingue "não atende" de "sem vagas")',
  })
  atendeNoDia: boolean;

  horarios: HorarioResposta[];
}
