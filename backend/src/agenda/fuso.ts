/**
 * Conversões entre instantes (Date, UTC) e o horário local da clínica.
 *
 * Usa só Intl (stdlib): o offset vem do banco de fusos do runtime, não é fixado
 * no código. Assim nada depende do fuso da máquina onde a API roda.
 */
import { MINUTOS_NO_DIA } from './regras.js';

export const FUSO_DA_CLINICA = 'America/Sao_Paulo';

const formatador = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSO_DA_CLINICA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'longOffset',
});

function partes(instante: Date) {
  const p = Object.fromEntries(
    formatador.formatToParts(instante).map((x) => [x.type, x.value]),
  ) as Record<Intl.DateTimeFormatPartTypes, string>;
  // longOffset vem como "GMT-03:00", ou só "GMT" quando o offset é zero.
  const offset = p.timeZoneName === 'GMT' ? '+00:00' : p.timeZoneName.slice(3);
  return { ...p, data: `${p.year}-${p.month}-${p.day}`, offset };
}

function offsetEmMinutos(instante: Date): number {
  const [sinal, h, m] = partes(instante)
    .offset.match(/([+-])(\d{2}):(\d{2})/)!
    .slice(1);
  return (sinal === '-' ? -1 : 1) * (Number(h) * 60 + Number(m));
}

/** Data (YYYY-MM-DD) e minutos desde a meia-noite de um instante, no horário da clínica. */
export function naClinica(instante: Date): { data: string; minutos: number } {
  const p = partes(instante);
  return { data: p.data, minutos: Number(p.hour) * 60 + Number(p.minute) };
}

/** Instante correspondente a uma data e um horário (em minutos) da clínica. */
export function instanteNaClinica(data: string, minutos: number): Date {
  const [ano, mes, dia] = data.split('-').map(Number);
  const comoSeFosseUtc = Date.UTC(ano, mes - 1, dia, 0, minutos);
  // Duas passadas: a segunda corrige o caso de o offset mudar entre o palpite e o resultado.
  let instante = comoSeFosseUtc - offsetEmMinutos(new Date(comoSeFosseUtc)) * 60_000;
  instante = comoSeFosseUtc - offsetEmMinutos(new Date(instante)) * 60_000;
  return new Date(instante);
}

/** ISO 8601 com o offset da clínica: "2026-11-03T08:40:00-03:00". */
export function isoNaClinica(instante: Date): string {
  const p = partes(instante);
  return `${p.data}T${p.hour}:${p.minute}:${p.second}${p.offset}`;
}

/** 0 = domingo … 6 = sábado. Uma data de calendário não tem fuso, então basta UTC. */
export function diaDaSemana(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

/**
 * "Agora" expresso para uma data consultada, no formato que as regras esperam:
 * minuto atual se a data é hoje, o dia inteiro se já passou, `undefined` se é futura.
 */
export function agoraNoDia(data: string, agora: Date = new Date()): number | undefined {
  const hoje = naClinica(agora);
  if (data < hoje.data) return MINUTOS_NO_DIA;
  if (data === hoje.data) return hoje.minutos;
  return undefined;
}
