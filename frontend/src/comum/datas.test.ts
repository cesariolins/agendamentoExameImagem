import { describe, expect, it } from 'vitest';
import type { Turno } from '../api/tipos.ts';
import {
  dataCurta,
  dataPorExtenso,
  diaNoPluralComArtigo,
  diasDeAtendimento,
  hojeNaClinica,
  horaDe,
  periodoDoDia,
  proximosDiasDeAtendimento,
  resumirTurnos,
  somarDias,
} from './datas.ts';

const turnos = (dias: number[], inicio: string, fim: string): Turno[] =>
  dias.map((diaSemana) => ({ diaSemana, inicio, fim }));

const HELENA = [
  ...turnos([1, 2, 3, 4, 5], '08:00', '12:00'),
  ...turnos([1, 2, 3, 4, 5], '14:00', '18:00'),
];
const RAFAEL = [...turnos([1, 3, 5], '07:00', '13:00'), ...turnos([2, 4], '13:00', '19:00')];
const THIAGO = [...turnos([2, 3, 4, 5, 6], '08:00', '12:00'), ...turnos([3, 5], '19:00', '22:00')];

describe('hojeNaClinica', () => {
  it('usa a data de São Paulo, não a de UTC nem a do navegador', () => {
    expect(hojeNaClinica(new Date('2030-01-08T01:30:00Z'))).toBe('2030-01-07');
    expect(hojeNaClinica(new Date('2030-01-08T03:00:00Z'))).toBe('2030-01-08');
  });
});

describe('formatação', () => {
  it('escreve datas de calendário por extenso e no formato curto', () => {
    expect(dataPorExtenso('2030-01-07')).toBe('segunda-feira, 7 de janeiro de 2030');
    expect(dataCurta('2030-01-08')).toMatch(/^ter\.?, 08\/01$/);
  });

  it('extrai a hora local do ISO que a API devolve no fuso da clínica', () => {
    expect(horaDe('2030-01-07T08:40:00-03:00')).toBe('08:40');
  });

  it('escreve o dia da semana no plural com o artigo certo', () => {
    expect(diaNoPluralComArtigo(1)).toBe('às segundas');
    expect(diaNoPluralComArtigo(6)).toBe('aos sábados');
  });

  it('classifica o período do dia', () => {
    expect([periodoDoDia('07:00'), periodoDoDia('13:00'), periodoDoDia('19:40')]).toEqual([
      'Manhã',
      'Tarde',
      'Noite',
    ]);
  });

  it('soma dias atravessando o mês', () => {
    expect(somarDias('2030-01-31', 1)).toBe('2030-02-01');
  });
});

describe('resumirTurnos', () => {
  it('agrupa dias em sequência com o mesmo expediente', () => {
    expect(resumirTurnos(HELENA)).toEqual(['Seg a Sex · 08:00–12:00 e 14:00–18:00']);
  });

  it('lista dias fora de sequência e separa expedientes diferentes', () => {
    expect(resumirTurnos(RAFAEL)).toEqual([
      'Seg, Qua e Sex · 07:00–13:00',
      'Ter e Qui · 13:00–19:00',
    ]);
  });

  it('separa os dias com turno extra à noite', () => {
    expect(resumirTurnos(THIAGO)).toEqual([
      'Ter, Qui e Sáb · 08:00–12:00',
      'Qua e Sex · 08:00–12:00 e 19:00–22:00',
    ]);
  });

  it('resume só os dias de atendimento', () => {
    expect(diasDeAtendimento(THIAGO)).toBe('Ter a Sáb');
    expect(diasDeAtendimento(RAFAEL)).toBe('Seg a Sex');
  });
});

describe('proximosDiasDeAtendimento', () => {
  it('lista as próximas datas em que o médico atende, a partir de hoje', () => {
    expect(proximosDiasDeAtendimento(THIAGO, '2030-01-06', 4)).toEqual([
      '2030-01-08',
      '2030-01-09',
      '2030-01-10',
      '2030-01-11',
    ]);
  });

  it('não lista nada para quem não tem turnos', () => {
    expect(proximosDiasDeAtendimento([], '2030-01-06')).toEqual([]);
  });
});
