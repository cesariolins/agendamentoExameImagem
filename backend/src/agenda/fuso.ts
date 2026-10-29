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
  const offset = p.timeZoneName === 'GMT' ? '+00:00' : p.timeZoneName.slice(3);
  return { ...p, data: `${p.year}-${p.month}-${p.day}`, offset };
}

function offsetEmMinutos(instante: Date): number {
  const [sinal, h, m] = partes(instante)
    .offset.match(/([+-])(\d{2}):(\d{2})/)!
    .slice(1);
  return (sinal === '-' ? -1 : 1) * (Number(h) * 60 + Number(m));
}

export function naClinica(instante: Date): { data: string; minutos: number } {
  const p = partes(instante);
  return { data: p.data, minutos: Number(p.hour) * 60 + Number(p.minute) };
}

export function instanteNaClinica(data: string, minutos: number): Date {
  const [ano, mes, dia] = data.split('-').map(Number);
  const comoSeFosseUtc = Date.UTC(ano, mes - 1, dia, 0, minutos);
  let instante = comoSeFosseUtc - offsetEmMinutos(new Date(comoSeFosseUtc)) * 60_000;
  instante = comoSeFosseUtc - offsetEmMinutos(new Date(instante)) * 60_000;
  return new Date(instante);
}

export function isoNaClinica(instante: Date): string {
  const p = partes(instante);
  return `${p.data}T${p.hour}:${p.minute}:${p.second}${p.offset}`;
}

export function diaDaSemana(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

export function agoraNoDia(data: string, agora: Date = new Date()): number | undefined {
  const hoje = naClinica(agora);
  if (data < hoje.data) return MINUTOS_NO_DIA;
  if (data === hoje.data) return hoje.minutos;
  return undefined;
}
