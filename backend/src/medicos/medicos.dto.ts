import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { IsData } from '../comum/validacao.js';

export class ConsultaDeHorariosDto {
  /**
   * Data no fuso da clínica (America/Sao_Paulo)
   * @example "2026-11-03"
   */
  @IsData()
  data: string;

  /**
   * Exame cuja duração define a grade de horários
   * @example 7
   */
  @Type(() => Number)
  @IsInt({ message: 'exameId deve ser um número inteiro.' })
  @Min(1, { message: 'exameId deve ser maior que zero.' })
  exameId: number;
}

export class TurnoResposta {
  /**
   * 0 = domingo … 6 = sábado
   * @example 1
   */
  diaSemana: number;
  /** @example "08:00" */
  inicio: string;
  /** @example "12:00" */
  fim: string;
}

export class MedicoResposta {
  /** @example 1 */
  id: number;
  /** @example "Dra. Helena Marques" */
  nome: string;
  /** @example "CRM-MG 11111" */
  crm: string;
  turnos: TurnoResposta[];
}

export class HorarioResposta {
  /** @example "2026-11-03T08:00:00-03:00" */
  inicio: string;
  /** @example "2026-11-03T08:40:00-03:00" */
  fim: string;
}

export class HorariosResposta {
  /** @example 1 */
  medicoId: number;
  /** @example 7 */
  exameId: number;
  /** @example "2026-11-03" */
  data: string;
  /** @example 40 */
  duracaoMinutos: number;
  /** Se o médico tem turno nesse dia da semana (distingue "não atende" de "sem vagas") */
  atendeNoDia: boolean;
  horarios: HorarioResposta[];
}
