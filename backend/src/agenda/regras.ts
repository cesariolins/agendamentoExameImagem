/**
 * Regras de horário da agenda: o núcleo do domínio.
 *
 * Funções puras, sem dependência de framework, banco ou fuso. Todos os horários
 * são "minutos desde a meia-noite" no horário local da clínica (08:40 → 520),
 * e os intervalos são semiabertos [inicio, fim): encostar não é sobrepor.
 */

export const MINUTOS_NO_DIA = 24 * 60;

export interface Intervalo {
  inicio: number;
  fim: number;
}

export type MotivoDeRecusa =
  'HORARIO_NO_PASSADO' | 'FORA_DO_EXPEDIENTE' | 'HORARIO_FORA_DA_GRADE' | 'CONFLITO_DE_HORARIO';

export interface ContextoDoDia {
  /** Turnos do médico no dia da semana da data consultada. */
  turnos: Intervalo[];
  /** Duração do exame escolhido. */
  duracaoMinutos: number;
  /** Agendamentos ativos do médico nessa data. */
  ocupados: Intervalo[];
  /**
   * Minuto atual, quando a data é hoje (só valem inícios estritamente posteriores).
   * `undefined` para datas futuras; `MINUTOS_NO_DIA` para datas passadas.
   */
  agoraMinutos?: number;
}

export function sobrepoe(a: Intervalo, b: Intervalo): boolean {
  return a.inicio < b.fim && b.inicio < a.fim;
}

/**
 * Diz por que um início não pode ser agendado, ou `null` se pode.
 * A ordem das verificações define a mensagem quando há mais de um motivo.
 */
export function motivoDeRecusa(ctx: ContextoDoDia, inicio: number): MotivoDeRecusa | null {
  const bloco = { inicio, fim: inicio + ctx.duracaoMinutos };

  if (ctx.agoraMinutos !== undefined && inicio <= ctx.agoraMinutos) return 'HORARIO_NO_PASSADO';

  const turno = ctx.turnos.find((t) => bloco.inicio >= t.inicio && bloco.fim <= t.fim);
  if (!turno) return 'FORA_DO_EXPEDIENTE';

  if ((inicio - turno.inicio) % ctx.duracaoMinutos !== 0) return 'HORARIO_FORA_DA_GRADE';

  if (ctx.ocupados.some((ocupado) => sobrepoe(bloco, ocupado))) return 'CONFLITO_DE_HORARIO';

  return null;
}

/** Todos os inícios possíveis: de cada turno, em passos iguais à duração, enquanto o bloco couber. */
export function gradeDoDia(turnos: Intervalo[], duracaoMinutos: number): number[] {
  if (!Number.isInteger(duracaoMinutos) || duracaoMinutos <= 0) {
    throw new RangeError(`Duração inválida: ${duracaoMinutos}`);
  }
  const grade: number[] = [];
  for (const turno of [...turnos].sort((a, b) => a.inicio - b.inicio)) {
    for (
      let inicio = turno.inicio;
      inicio + duracaoMinutos <= turno.fim;
      inicio += duracaoMinutos
    ) {
      grade.push(inicio);
    }
  }
  return grade;
}

/**
 * Horários livres do dia. É a grade filtrada pela mesma regra que valida um agendamento:
 * o que a tela oferece e o que a API aceita nunca divergem.
 */
export function gerarHorarios(ctx: ContextoDoDia): number[] {
  return gradeDoDia(ctx.turnos, ctx.duracaoMinutos).filter(
    (inicio) => motivoDeRecusa(ctx, inicio) === null,
  );
}

/** "08:40" → 520 */
export function paraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** 520 → "08:40" */
export function paraHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
