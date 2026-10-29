import { lerExames } from './semear.js';

describe('lerExames', () => {
  it('lê o catálogo do desafio', () => {
    const exames = lerExames();
    expect(exames).toHaveLength(30);
    expect(exames[0]).toEqual({ id: 1, nome: 'Raio-X de Tórax', duracaoMinutos: 20 });
    expect(new Set(exames.map((e) => e.duracaoMinutos))).toEqual(new Set([20, 30, 40]));
    expect(new Set(exames.map((e) => e.id)).size).toBe(30);
  });

  it('aceita BOM, CRLF e linhas em branco', () => {
    const csv = '﻿id,nome,duracao_minutos\r\n1,Raio-X,20\r\n\r\n2,Mamografia,30\r\n';
    expect(lerExames(csv)).toEqual([
      { id: 1, nome: 'Raio-X', duracaoMinutos: 20 },
      { id: 2, nome: 'Mamografia', duracaoMinutos: 30 },
    ]);
  });

  it('recusa cabeçalho diferente do esperado', () => {
    expect(() => lerExames('id;nome;duracao\n1;Raio-X;20')).toThrow(/Cabeçalho inesperado/);
  });

  it('aponta a linha inválida em vez de gravar dado quebrado', () => {
    const csv = 'id,nome,duracao_minutos\n1,Raio-X,20\n2,Mamografia,trinta';
    expect(() => lerExames(csv)).toThrow(/Linha 3 inválida/);
    expect(() => lerExames('id,nome,duracao_minutos\n3,,20')).toThrow(/Linha 2 inválida/);
    expect(() => lerExames('id,nome,duracao_minutos\n4,Exame, com vírgula,20')).toThrow(/Linha 2/);
  });
});
