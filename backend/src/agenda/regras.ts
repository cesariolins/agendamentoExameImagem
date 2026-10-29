export const MINUTOS_NO_DIA = 24 * 60;

export interface Intervalo {
  inicio: number;
  fim: number;
}

export type MotivoDeRecusa =
  'HORARIO_NO_PASSADO' | 'FORA_DO_EXPEDIENTE' | 'HORARIO_FORA_DA_GRADE' | 'CONFLITO_DE_HORARIO';

export interface ContextoDoDia {
  turnos: Intervalo[];
  duracaoMinutos: number;
  ocupados: Intervalo[];
  agoraMinutos?: number;
}

export function sobrepoe(a: Intervalo, b: Intervalo): boolean {
  return a.inicio < b.fim && b.inicio < a.fim;
}

export function motivoDeRecusa(ctx: ContextoDoDia, inicio: number): MotivoDeRecusa | null {
  const bloco = { inicio, fim: inicio + ctx.duracaoMinutos };

  if (ctx.agoraMinutos !== undefined && inicio <= ctx.agoraMinutos) return 'HORARIO_NO_PASSADO';

  const turno = ctx.turnos.find((t) => bloco.inicio >= t.inicio && bloco.fim <= t.fim);
  if (!turno) return 'FORA_DO_EXPEDIENTE';

  if ((inicio - turno.inicio) % ctx.duracaoMinutos !== 0) return 'HORARIO_FORA_DA_GRADE';

  if (ctx.ocupados.some((ocupado) => sobrepoe(bloco, ocupado))) return 'CONFLITO_DE_HORARIO';

  return null;
}

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

export function gerarHorarios(ctx: ContextoDoDia): number[] {
  return gradeDoDia(ctx.turnos, ctx.duracaoMinutos).filter(
    (inicio) => motivoDeRecusa(ctx, inicio) === null,
  );
}

export function paraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function paraHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
