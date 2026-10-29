import { readFileSync } from 'node:fs';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { paraMinutos } from '../src/agenda/regras.js';
import { normalizarTexto } from '../src/comum/texto.js';
import { MEDICOS } from './medicos.js';

const CSV_DE_EXAMES = new URL('../../dados/exames.csv', import.meta.url);
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface ExameDoCatalogo {
  id: number;
  nome: string;
  duracaoMinutos: number;
}

export function lerExames(csv = readFileSync(CSV_DE_EXAMES, 'utf8')): ExameDoCatalogo[] {
  const [cabecalho, ...linhas] = csv
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((linha) => linha.trim());

  if (cabecalho?.trim() !== 'id,nome,duracao_minutos') {
    throw new Error(`Cabeçalho inesperado em exames.csv: "${cabecalho}"`);
  }

  return linhas.map((linha, i) => {
    const campos = linha.split(',');
    const id = Number(campos[0]);
    const nome = campos[1]?.trim();
    const duracaoMinutos = Number(campos[2]);
    const valida =
      campos.length === 3 &&
      Number.isInteger(id) &&
      !!nome &&
      Number.isInteger(duracaoMinutos) &&
      duracaoMinutos > 0;
    if (!valida) throw new Error(`Linha ${i + 2} inválida em exames.csv: "${linha}"`);
    return { id, nome, duracaoMinutos };
  });
}

function turnosDosMedicos() {
  return MEDICOS.flatMap((medico) =>
    medico.turnos.flatMap(({ dias, inicio, fim }) => {
      if (!HORA.test(inicio) || !HORA.test(fim) || paraMinutos(inicio) >= paraMinutos(fim)) {
        throw new Error(`Turno inválido para ${medico.nome}: ${inicio}–${fim}`);
      }
      return dias.map((diaSemana) => ({ medicoId: medico.id, diaSemana, inicio, fim }));
    }),
  );
}

export async function semear(prisma: PrismaClient) {
  const exames = lerExames();
  const turnos = turnosDosMedicos();

  await prisma.$transaction([
    ...exames.map((exame) => {
      const dados = { ...exame, nomeBusca: normalizarTexto(exame.nome) };
      return prisma.exame.upsert({ where: { id: exame.id }, create: dados, update: dados });
    }),
    ...MEDICOS.map(({ id, nome, crm }) =>
      prisma.medico.upsert({ where: { id }, create: { id, nome, crm }, update: { nome, crm } }),
    ),
    prisma.turno.deleteMany(),
    prisma.turno.createMany({ data: turnos }),
  ]);

  return { exames: exames.length, medicos: MEDICOS.length, turnos: turnos.length };
}
