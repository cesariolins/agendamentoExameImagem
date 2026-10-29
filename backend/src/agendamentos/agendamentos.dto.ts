import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { IsData, IsDataHoraComFuso } from '../comum/validacao.js';
import { ExameResposta } from '../exames/exames.dto.js';

const STATUS = ['ATIVO', 'CANCELADO'] as const;
type Status = (typeof STATUS)[number];

export class CriarAgendamentoDto {
  /**
   * Nome do paciente (espaços extras são removidos)
   * @example "Maria da Silva"
   */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value))
  @IsString({ message: 'pacienteNome deve ser um texto.' })
  @Length(3, 120, { message: 'pacienteNome deve ter entre 3 e 120 caracteres.' })
  pacienteNome: string;

  /** @example 7 */
  @IsInt({ message: 'exameId deve ser um número inteiro.' })
  @Min(1, { message: 'exameId deve ser maior que zero.' })
  exameId: number;

  /** @example 1 */
  @IsInt({ message: 'medicoId deve ser um número inteiro.' })
  @Min(1, { message: 'medicoId deve ser maior que zero.' })
  medicoId: number;

  /**
   * Início do exame: precisa ser um dos horários devolvidos por GET /medicos/:id/horarios.
   * O fuso é obrigatório; o término é calculado pela API.
   * @example "2026-11-03T08:40:00-03:00"
   */
  @IsDataHoraComFuso()
  inicio: string;
}

export class FiltroDeAgendamentosDto {
  /** @example 1 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'medicoId deve ser um número inteiro.' })
  @Min(1, { message: 'medicoId deve ser maior que zero.' })
  medicoId?: number;

  /**
   * Dia do início, no fuso da clínica
   * @example "2026-11-03"
   */
  @IsOptional()
  @IsData()
  data?: string;

  @IsOptional()
  @IsIn(STATUS, { message: 'status deve ser ATIVO ou CANCELADO.' })
  status?: Status;
}

export class MedicoResumo {
  /** @example 1 */
  id: number;
  /** @example "Dra. Helena Marques" */
  nome: string;
  /** @example "CRM-MG 11111" */
  crm: string;
}

export class AgendamentoResposta {
  /** @example 1 */
  id: number;
  /** @example "Maria da Silva" */
  pacienteNome: string;
  status: Status;
  /** @example "2026-11-03T08:40:00-03:00" */
  inicio: string;
  /**
   * Derivado: início + duração do exame
   * @example "2026-11-03T09:20:00-03:00"
   */
  fim: string;
  /** @example "2026-10-29T15:12:09-03:00" */
  criadoEm: string;
  /** @example null */
  canceladoEm: string | null;
  exame: ExameResposta;
  medico: MedicoResumo;
}
