import { agoraNoDia, diaDaSemana, instanteNaClinica, isoNaClinica, naClinica } from './fuso.js';
import { MINUTOS_NO_DIA, paraMinutos } from './regras.js';

describe('fuso da clínica (America/Sao_Paulo)', () => {
  it('converte um instante UTC para data e minutos locais', () => {
    expect(naClinica(new Date('2026-11-03T11:40:00Z'))).toEqual({
      data: '2026-11-03',
      minutos: paraMinutos('08:40'),
    });
  });

  it('considera a virada do dia no horário local: 02:30 UTC do dia 4 ainda é 23:30 do dia 3', () => {
    expect(naClinica(new Date('2026-11-04T02:30:00Z'))).toEqual({
      data: '2026-11-03',
      minutos: paraMinutos('23:30'),
    });
  });

  it('converte data e horário locais para o instante UTC', () => {
    expect(instanteNaClinica('2026-11-03', paraMinutos('08:40')).toISOString()).toBe(
      '2026-11-03T11:40:00.000Z',
    );
  });

  it('serializa em ISO 8601 com o offset da clínica', () => {
    expect(isoNaClinica(new Date('2026-11-03T11:40:00Z'))).toBe('2026-11-03T08:40:00-03:00');
  });

  it('ida e volta preserva o horário', () => {
    const instante = instanteNaClinica('2026-11-07', paraMinutos('21:00'));
    expect(naClinica(instante)).toEqual({ data: '2026-11-07', minutos: paraMinutos('21:00') });
  });

  it('obtém o offset do banco de fusos em vez de fixar -03:00 (em 2018 havia horário de verão)', () => {
    expect(isoNaClinica(new Date('2018-12-01T12:00:00Z'))).toBe('2018-12-01T10:00:00-02:00');
    expect(instanteNaClinica('2018-12-01', paraMinutos('10:00')).toISOString()).toBe(
      '2018-12-01T12:00:00.000Z',
    );
  });

  it.each([
    ['2026-11-01', 0, 'domingo'],
    ['2026-11-03', 2, 'terça'],
    ['2026-11-07', 6, 'sábado'],
  ])('%s cai no dia da semana %i (%s)', (data, dia) => {
    expect(diaDaSemana(data)).toBe(dia);
  });

  describe('agoraNoDia', () => {
    const agora = new Date('2026-11-03T09:05:00-03:00');

    it('hoje: minuto atual local', () => {
      expect(agoraNoDia('2026-11-03', agora)).toBe(paraMinutos('09:05'));
    });

    it('data passada: o dia inteiro já passou', () => {
      expect(agoraNoDia('2026-11-02', agora)).toBe(MINUTOS_NO_DIA);
    });

    it('data futura: nenhuma restrição', () => {
      expect(agoraNoDia('2026-11-04', agora)).toBeUndefined();
    });

    it('usa a data local mesmo quando em UTC já é o dia seguinte', () => {
      const noite = new Date('2026-11-03T22:00:00-03:00');
      expect(noite.toISOString()).toBe('2026-11-04T01:00:00.000Z');
      expect(agoraNoDia('2026-11-03', noite)).toBe(paraMinutos('22:00'));
      expect(agoraNoDia('2026-11-04', noite)).toBeUndefined();
    });
  });
});
