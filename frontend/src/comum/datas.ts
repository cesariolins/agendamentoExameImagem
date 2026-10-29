import type { Turno } from '../api/tipos.ts';

export const FUSO_DA_CLINICA = 'America/Sao_Paulo';

const ORDEM_DA_SEMANA = [1, 2, 3, 4, 5, 6, 0];
const SIGLAS_DOS_DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_NO_PLURAL = [
  'aos domingos',
  'às segundas',
  'às terças',
  'às quartas',
  'às quintas',
  'às sextas',
  'aos sábados',
];

const formatoIso = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_DA_CLINICA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatoPorExtenso = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const formatoCurto = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

const meiaNoiteUtc = (data: string) => new Date(`${data}T00:00:00Z`);

export const hojeNaClinica = (agora = new Date()) => formatoIso.format(agora);

export const diaDaSemana = (data: string) => meiaNoiteUtc(data).getUTCDay();

export const diaNoPluralComArtigo = (dia: number) => DIAS_NO_PLURAL[dia];

export const dataPorExtenso = (data: string) => formatoPorExtenso.format(meiaNoiteUtc(data));

export const dataCurta = (data: string) => formatoCurto.format(meiaNoiteUtc(data));

export const horaDe = (iso: string) => iso.slice(11, 16);

export const dataDe = (iso: string) => iso.slice(0, 10);

export function somarDias(data: string, dias: number) {
  const resultado = meiaNoiteUtc(data);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

export function periodoDoDia(hora: string) {
  const h = Number(hora.slice(0, 2));
  if (h < 12) return 'Manhã';
  if (h < 18) return 'Tarde';
  return 'Noite';
}

function listarDias(dias: number[]) {
  const posicoes = [...new Set(dias)]
    .map((dia) => ORDEM_DA_SEMANA.indexOf(dia))
    .sort((a, b) => a - b);
  const siglas = posicoes.map((posicao) => SIGLAS_DOS_DIAS[ORDEM_DA_SEMANA[posicao]]);
  const emSequencia = posicoes.every((posicao, i) => i === 0 || posicao === posicoes[i - 1] + 1);

  if (siglas.length >= 3 && emSequencia) return `${siglas[0]} a ${siglas.at(-1)}`;
  if (siglas.length === 1) return siglas[0];
  return `${siglas.slice(0, -1).join(', ')} e ${siglas.at(-1)}`;
}

export const diasDeAtendimento = (turnos: Turno[]) => listarDias(turnos.map((t) => t.diaSemana));

export function resumirTurnos(turnos: Turno[]): string[] {
  const diasPorExpediente = new Map<string, number[]>();
  for (const dia of ORDEM_DA_SEMANA) {
    const expediente = turnos
      .filter((turno) => turno.diaSemana === dia)
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
      .map((turno) => `${turno.inicio}–${turno.fim}`)
      .join(' e ');
    if (expediente)
      diasPorExpediente.set(expediente, [...(diasPorExpediente.get(expediente) ?? []), dia]);
  }
  return [...diasPorExpediente].map(([expediente, dias]) => `${listarDias(dias)} · ${expediente}`);
}

export function proximosDiasDeAtendimento(turnos: Turno[], aPartirDe: string, quantidade = 6) {
  const diasQueAtende = new Set(turnos.map((turno) => turno.diaSemana));
  const datas: string[] = [];
  for (let i = 0; i < 28 && datas.length < quantidade; i++) {
    const data = somarDias(aPartirDe, i);
    if (diasQueAtende.has(diaDaSemana(data))) datas.push(data);
  }
  return datas;
}
