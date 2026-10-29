import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { IsData, IsDataHoraComFuso } from '../comum/validacao.js';
import { ExameResposta } from '../exames/exames.dto.js';

const STATUS = ['ATIVO', 'CANCELADO'] as const;
type Status = (typeof STATUS)[number];

export class CriarAgendamentoDto {
  @ApiProperty({
    description: 'Nome do paciente (espaços extras são removidos)',
    example: 'Maria da Silva',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value))
  @IsString({ message: 'pacienteNome deve ser um texto.' })
  @Length(3, 120, { message: 'pacienteNome deve ter entre 3 e 120 caracteres.' })
  pacienteNome: string;

  @ApiProperty({ example: 7 })
  @IsInt({ message: 'exameId deve ser um número inteiro.' })
  @Min(1, { message: 'exameId deve ser maior que zero.' })
  exameId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'medicoId deve ser um número inteiro.' })
  @Min(1, { message: 'medicoId deve ser maior que zero.' })
  medicoId: number;

  @ApiProperty({
    description:
      'Início do exame: precisa ser um dos horários devolvidos por GET /medicos/:id/horarios. ' +
      'O fuso é obrigatório; o término é calculado pela API.',
    example: '2026-11-03T08:40:00-03:00',
  })
  @IsDataHoraComFuso()
  inicio: string;
}

export class FiltroDeAgendamentosDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'medicoId deve ser um número inteiro.' })
  @Min(1, { message: 'medicoId deve ser maior que zero.' })
  medicoId?: number;

  @ApiPropertyOptional({ description: 'Dia do início, no fuso da clínica', example: '2026-11-03' })
  @IsOptional()
  @IsData()
  data?: string;

  @ApiPropertyOptional({ enum: STATUS })
  @IsOptional()
  @IsIn(STATUS, { message: 'status deve ser ATIVO ou CANCELADO.' })
  status?: Status;
}

export class MedicoResumo {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Dra. Helena Marques' })
  nome: string;

  @ApiProperty({ example: 'CRM-MG 11111' })
  crm: string;
}

export class AgendamentoResposta {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Maria da Silva' })
  pacienteNome: string;

  @ApiProperty({ enum: STATUS, example: 'ATIVO' })
  status: Status;

  @ApiProperty({ example: '2026-11-03T08:40:00-03:00' })
  inicio: string;

  @ApiProperty({
    description: 'Derivado: início + duração do exame',
    example: '2026-11-03T09:20:00-03:00',
  })
  fim: string;

  @ApiProperty({ example: '2026-10-29T15:12:09-03:00' })
  criadoEm: string;

  @ApiProperty({ type: String, nullable: true, example: null })
  canceladoEm: string | null;

  exame: ExameResposta;

  medico: MedicoResumo;
}
