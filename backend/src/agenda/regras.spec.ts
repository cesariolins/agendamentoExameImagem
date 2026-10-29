import {
  type ContextoDoDia,
  type Intervalo,
  MINUTOS_NO_DIA,
  gerarHorarios,
  gradeDoDia,
  motivoDeRecusa,
  paraHora,
  paraMinutos,
  sobrepoe,
} from './regras.js';

/** intervalo('09:20', '10:00') → { inicio: 560, fim: 600 } */
const intervalo = (inicio: string, fim: string): Intervalo => ({
  inicio: paraMinutos(inicio),
  fim: paraMinutos(fim),
});

const manha = intervalo('08:00', '12:00');

const horarios = (ctx: Partial<ContextoDoDia> & { duracaoMinutos: number }) =>
  gerarHorarios({ turnos: [manha], ocupados: [], ...ctx }).map(paraHora);

describe('gerarHorarios', () => {
  describe('exemplos do enunciado (turno 08:00–12:00)', () => {
    it('exame de 40 min', () => {
      expect(horarios({ duracaoMinutos: 40 })).toEqual([
        '08:00',
        '08:40',
        '09:20',
        '10:00',
        '10:40',
        '11:20',
      ]);
    });

    it('exame de 30 min', () => {
      expect(horarios({ duracaoMinutos: 30 })).toEqual([
        '08:00',
        '08:30',
        '09:00',
        '09:30',
        '10:00',
        '10:30',
        '11:00',
        '11:30',
      ]);
    });

    it('exame de 20 min: de 08:00 a 11:40, que termina exatamente às 12:00', () => {
      const lista = horarios({ duracaoMinutos: 20 });
      expect(lista).toHaveLength(12);
      expect(lista.at(0)).toBe('08:00');
      expect(lista.at(1)).toBe('08:20');
      expect(lista.at(-1)).toBe('11:40');
    });
  });

  describe('agendamento existente das 09:20 às 10:00', () => {
    const ocupados = [intervalo('09:20', '10:00')];

    it('40 min: some só 09:20; 08:40 termina às 09:20 e continua valendo', () => {
      expect(horarios({ duracaoMinutos: 40, ocupados })).toEqual([
        '08:00',
        '08:40',
        '10:00',
        '10:40',
        '11:20',
      ]);
    });

    it('30 min: somem 09:00 e 09:30, que cruzam o intervalo', () => {
      const lista = horarios({ duracaoMinutos: 30, ocupados });
      expect(lista).not.toContain('09:00');
      expect(lista).not.toContain('09:30');
      expect(lista).toContain('08:30');
      expect(lista).toContain('10:00');
    });

    it('20 min: somem 09:20 e 09:40; 09:00 termina às 09:20 e continua valendo', () => {
      const lista = horarios({ duracaoMinutos: 20, ocupados });
      expect(lista).not.toContain('09:20');
      expect(lista).not.toContain('09:40');
      expect(lista).toContain('09:00');
      expect(lista).toContain('10:00');
    });
  });

  it('mantém a grade ancorada no início do turno mesmo com agendamento desalinhado', () => {
    // Um exame de 20 min marcado às 08:20 bloqueia o horário de 40 min das 08:00,
    // mas a grade de 40 min não "escorrega" para 08:40 → 09:20 → …: ela continua igual.
    expect(horarios({ duracaoMinutos: 40, ocupados: [intervalo('08:20', '08:40')] })).toEqual([
      '08:40',
      '09:20',
      '10:00',
      '10:40',
      '11:20',
    ]);
  });

  it('reinicia a grade em cada turno do dia', () => {
    const turnos = [intervalo('14:00', '18:00'), manha]; // fora de ordem de propósito
    const lista = horarios({ duracaoMinutos: 40, turnos });
    expect(lista.slice(4, 8)).toEqual(['10:40', '11:20', '14:00', '14:40']);
    expect(lista.at(-1)).toBe('17:20');
  });

  it('descarta o último passo que estouraria o turno noturno', () => {
    // 19:00–22:00 com 40 min: 21:40 terminaria às 22:20.
    expect(horarios({ duracaoMinutos: 40, turnos: [intervalo('19:00', '22:00')] })).toEqual([
      '19:00',
      '19:40',
      '20:20',
      '21:00',
    ]);
  });

  it('não oferece nada em dia sem turnos', () => {
    expect(horarios({ duracaoMinutos: 30, turnos: [] })).toEqual([]);
  });

  describe('data de hoje', () => {
    it('só oferece inícios estritamente posteriores ao minuto atual', () => {
      const agoraMinutos = paraMinutos('09:05');
      expect(horarios({ duracaoMinutos: 20, agoraMinutos }).at(0)).toBe('09:20');
    });

    it('um horário que começa exatamente agora já não é oferecido', () => {
      const agoraMinutos = paraMinutos('09:20');
      expect(horarios({ duracaoMinutos: 20, agoraMinutos }).at(0)).toBe('09:40');
    });
  });

  it('não oferece nada em data passada', () => {
    expect(horarios({ duracaoMinutos: 20, agoraMinutos: MINUTOS_NO_DIA })).toEqual([]);
  });
});

describe('motivoDeRecusa', () => {
  const ctx: ContextoDoDia = {
    turnos: [manha],
    duracaoMinutos: 40,
    ocupados: [intervalo('09:20', '10:00')],
  };
  const motivo = (hora: string, extra: Partial<ContextoDoDia> = {}) =>
    motivoDeRecusa({ ...ctx, ...extra }, paraMinutos(hora));

  it('aceita um horário livre da grade', () => {
    expect(motivo('08:40')).toBeNull();
  });

  it('recusa horário no passado', () => {
    expect(motivo('08:40', { agoraMinutos: paraMinutos('10:00') })).toBe('HORARIO_NO_PASSADO');
  });

  it('recusa bloco que começa antes ou termina depois do turno', () => {
    expect(motivo('07:20')).toBe('FORA_DO_EXPEDIENTE');
    expect(motivo('11:40')).toBe('FORA_DO_EXPEDIENTE'); // 11:40 + 40 min = 12:20
    expect(motivo('13:00')).toBe('FORA_DO_EXPEDIENTE');
  });

  it('recusa bloco que atravessa dois turnos contíguos', () => {
    const turnos = [intervalo('08:00', '10:00'), intervalo('10:00', '12:00')];
    expect(
      motivoDeRecusa({ ...ctx, turnos, ocupados: [], duracaoMinutos: 30 }, paraMinutos('09:45')),
    ).toBe('FORA_DO_EXPEDIENTE');
  });

  it('recusa início livre e dentro do turno, mas fora da grade', () => {
    expect(motivo('08:10')).toBe('HORARIO_FORA_DA_GRADE');
  });

  it('recusa horário que cruza um agendamento existente', () => {
    expect(motivo('09:20')).toBe('CONFLITO_DE_HORARIO');
  });

  it('passado tem precedência sobre os demais motivos', () => {
    expect(motivo('09:20', { agoraMinutos: MINUTOS_NO_DIA })).toBe('HORARIO_NO_PASSADO');
  });

  it('concorda com gerarHorarios em todos os minutos do dia', () => {
    // A API valida com motivoDeRecusa e a tela mostra gerarHorarios: nenhum início
    // pode ser aceito sem estar na lista, nem estar na lista e ser recusado.
    const cenarios: ContextoDoDia[] = [
      ctx,
      { ...ctx, duracaoMinutos: 20, agoraMinutos: paraMinutos('09:05') },
      {
        turnos: [intervalo('09:00', '12:00'), intervalo('18:00', '22:00')],
        duracaoMinutos: 30,
        ocupados: [intervalo('09:20', '10:00'), intervalo('18:40', '19:20')],
      },
    ];
    for (const cenario of cenarios) {
      const livres = new Set(gerarHorarios(cenario));
      for (let minuto = 0; minuto < MINUTOS_NO_DIA; minuto++) {
        expect(motivoDeRecusa(cenario, minuto) === null, `minuto ${minuto}`).toBe(
          livres.has(minuto),
        );
      }
    }
  });
});

describe('gradeDoDia', () => {
  it('rejeita duração que geraria laço infinito', () => {
    expect(() => gradeDoDia([manha], 0)).toThrow(RangeError);
    expect(() => gradeDoDia([manha], -20)).toThrow(RangeError);
  });
});

describe('sobrepoe', () => {
  it('intervalos que apenas se encostam não se sobrepõem', () => {
    expect(sobrepoe(intervalo('08:00', '08:40'), intervalo('08:40', '09:20'))).toBe(false);
  });

  it('detecta sobreposição parcial e contenção', () => {
    expect(sobrepoe(intervalo('08:00', '08:40'), intervalo('08:20', '08:40'))).toBe(true);
    expect(sobrepoe(intervalo('08:00', '12:00'), intervalo('09:00', '09:20'))).toBe(true);
  });
});

describe('conversão de horas', () => {
  it('converte nos dois sentidos', () => {
    expect(paraMinutos('08:40')).toBe(520);
    expect(paraHora(520)).toBe('08:40');
    expect(paraHora(paraMinutos('21:05'))).toBe('21:05');
  });
});
