import { criarAppDeTeste } from './app-de-teste.js';

let t: Awaited<ReturnType<typeof criarAppDeTeste>>;

beforeAll(async () => {
  t = await criarAppDeTeste();
});

beforeEach(async () => {
  await t.limparAgendamentos();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await t.limparAgendamentos();
  await t.app.close();
});

const SEGUNDA = '2030-01-07';
const DOMINGO = '2030-01-06';
const HELENA = 1; // Seg–Sex 08:00–12:00 e 14:00–18:00
const ULTRASSOM_40_MIN = 7;
const RAIO_X_20_MIN = 1;

const horarios = (medicoId: number, data: string, exameId: number) =>
  t.api().get(`/api/medicos/${medicoId}/horarios`).query({ data, exameId });

const horas = (corpo: { horarios: { inicio: string }[] }) =>
  corpo.horarios.map((h) => h.inicio.slice(11, 16));

function agendar(
  medicoId: number,
  inicio: string,
  fim: string,
  status: 'ATIVO' | 'CANCELADO' = 'ATIVO',
) {
  return t.prisma.agendamento.create({
    data: {
      pacienteNome: 'Paciente',
      exameId: RAIO_X_20_MIN,
      medicoId,
      status,
      inicio: new Date(`${SEGUNDA}T${inicio}:00-03:00`),
      fim: new Date(`${SEGUNDA}T${fim}:00-03:00`),
    },
  });
}

describe('GET /api/medicos', () => {
  it('lista os 5 médicos com os turnos ordenados por dia e horário', async () => {
    const { body } = await t.api().get('/api/medicos').expect(200);
    expect(body).toHaveLength(5);

    const thiago = body.find((m: { id: number }) => m.id === 4);
    expect(thiago).toMatchObject({ nome: 'Dr. Thiago Fontes', crm: 'CRM-MG 44444' });
    expect(thiago.turnos.filter((turno: { diaSemana: number }) => turno.diaSemana === 3)).toEqual([
      { diaSemana: 3, inicio: '08:00', fim: '12:00' },
      { diaSemana: 3, inicio: '19:00', fim: '22:00' },
    ]);
  });
});

describe('GET /api/medicos/:id/horarios', () => {
  it('gera a grade de cada turno com a duração do exame, no fuso da clínica', async () => {
    const { body } = await horarios(HELENA, SEGUNDA, ULTRASSOM_40_MIN).expect(200);

    expect(body).toMatchObject({
      medicoId: HELENA,
      exameId: ULTRASSOM_40_MIN,
      data: SEGUNDA,
      duracaoMinutos: 40,
      atendeNoDia: true,
    });
    expect(body.horarios[0]).toEqual({
      inicio: '2030-01-07T08:00:00-03:00',
      fim: '2030-01-07T08:40:00-03:00',
    });
    const manha = ['08:00', '08:40', '09:20', '10:00', '10:40', '11:20'];
    const tarde = ['14:00', '14:40', '15:20', '16:00', '16:40', '17:20'];
    expect(horas(body)).toEqual([...manha, ...tarde]);
  });

  it('remove os horários que cruzam agendamentos ativos do médico', async () => {
    await agendar(HELENA, '09:20', '10:00');
    const { body } = await horarios(HELENA, SEGUNDA, ULTRASSOM_40_MIN).expect(200);
    expect(horas(body)).not.toContain('09:20');
    expect(horas(body)).toContain('08:40');
    expect(horas(body)).toContain('10:00');
  });

  it('ignora agendamentos cancelados e de outros médicos', async () => {
    await agendar(HELENA, '08:00', '08:40', 'CANCELADO');
    await agendar(2, '08:00', '08:40');
    const { body } = await horarios(HELENA, SEGUNDA, ULTRASSOM_40_MIN).expect(200);
    expect(horas(body)[0]).toBe('08:00');
  });

  it('dia sem atendimento: lista vazia e atendeNoDia = false', async () => {
    const { body } = await horarios(HELENA, DOMINGO, ULTRASSOM_40_MIN).expect(200);
    expect(body).toMatchObject({ atendeNoDia: false, horarios: [] });
  });

  it('hoje: só oferece horários que ainda não começaram', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${SEGUNDA}T09:05:00-03:00`));

    const { body } = await horarios(HELENA, SEGUNDA, RAIO_X_20_MIN).expect(200);
    expect(horas(body)[0]).toBe('09:20');
  });

  it('data passada: atende no dia, mas não sobra nenhum horário', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-08T10:00:00-03:00'));

    const { body } = await horarios(HELENA, SEGUNDA, RAIO_X_20_MIN).expect(200);
    expect(body).toMatchObject({ atendeNoDia: true, horarios: [] });
  });

  describe('erros', () => {
    it('médico inexistente → 404', async () => {
      const { body } = await horarios(99, SEGUNDA, RAIO_X_20_MIN).expect(404);
      expect(body.codigo).toBe('MEDICO_NAO_ENCONTRADO');
    });

    it('exame inexistente → 404', async () => {
      const { body } = await horarios(HELENA, SEGUNDA, 999).expect(404);
      expect(body.codigo).toBe('EXAME_NAO_ENCONTRADO');
    });

    it.each(['2030-02-30', '07/01/2030', '2030-1-7', ''])(
      'data inválida "%s" → 400',
      async (data) => {
        const { body } = await horarios(HELENA, data, RAIO_X_20_MIN).expect(400);
        expect(body).toMatchObject({ codigo: 'DADOS_INVALIDOS', detalhes: [{ campo: 'data' }] });
      },
    );

    it('exameId ausente ou não numérico → 400', async () => {
      const ausente = await t.api().get(`/api/medicos/${HELENA}/horarios`).query({ data: SEGUNDA });
      expect(ausente.status).toBe(400);
      expect(ausente.body.detalhes).toEqual([
        {
          campo: 'exameId',
          mensagens: expect.arrayContaining(['exameId deve ser um número inteiro.']),
        },
      ]);

      await horarios(HELENA, SEGUNDA, 'abc' as unknown as number).expect(400);
    });

    it('id do médico não numérico → 400', async () => {
      const { body } = await horarios('abc' as unknown as number, SEGUNDA, RAIO_X_20_MIN).expect(
        400,
      );
      expect(body.detalhes).toEqual([
        { campo: 'id', mensagens: ['id deve ser um número inteiro.'] },
      ]);
    });
  });
});
