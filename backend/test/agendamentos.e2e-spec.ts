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
const HELENA = 1;
const RAFAEL = 2;
const ULTRASSOM_40_MIN = 7;
const RAIO_X_20_MIN = 1;

const emSegunda = (hora: string) => `${SEGUNDA}T${hora}:00-03:00`;

const pedido = (extra: Record<string, unknown> = {}) => ({
  pacienteNome: 'Maria da Silva',
  exameId: ULTRASSOM_40_MIN,
  medicoId: HELENA,
  inicio: emSegunda('08:40'),
  ...extra,
});

const agendar = (corpo: Record<string, unknown>) => t.api().post('/api/agendamentos').send(corpo);
const cancelar = (id: number | string) => t.api().patch(`/api/agendamentos/${id}/cancelar`);

function congelarRelogio(instante: string) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(instante));
}

describe('POST /api/agendamentos', () => {
  it('agenda num horário livre e deriva o término pela duração do exame', async () => {
    const { body } = await agendar(pedido()).expect(201);

    expect(body).toMatchObject({
      pacienteNome: 'Maria da Silva',
      status: 'ATIVO',
      inicio: '2030-01-07T08:40:00-03:00',
      fim: '2030-01-07T09:20:00-03:00',
      canceladoEm: null,
      exame: { id: ULTRASSOM_40_MIN, nome: 'Ultrassonografia Abdominal Total', duracaoMinutos: 40 },
      medico: { id: HELENA, nome: 'Dra. Helena Marques', crm: 'CRM-MG 11111' },
    });
    expect(body.id).toEqual(expect.any(Number));
    expect(body.criadoEm).toMatch(/-03:00$/);
  });

  it('o horário agendado deixa de ser oferecido', async () => {
    await agendar(pedido()).expect(201);
    const { body } = await t
      .api()
      .get(`/api/medicos/${HELENA}/horarios`)
      .query({ data: SEGUNDA, exameId: ULTRASSOM_40_MIN });
    const horas = body.horarios.map((h: { inicio: string }) => h.inicio.slice(11, 16));
    expect(horas).not.toContain('08:40');
    expect(horas).toContain('08:00');
    expect(horas).toContain('09:20');
  });

  it('aceita o mesmo instante escrito em outro fuso', async () => {
    const { body } = await agendar(pedido({ inicio: '2030-01-07T11:40:00Z' })).expect(201);
    expect(body.inicio).toBe('2030-01-07T08:40:00-03:00');
  });

  it('normaliza os espaços do nome do paciente', async () => {
    const { body } = await agendar(pedido({ pacienteNome: '  Maria   da  Silva ' })).expect(201);
    expect(body.pacienteNome).toBe('Maria da Silva');
  });

  it('recusa horário que cruza outro agendamento do médico (08:40–09:20 × 09:00–09:20) → 409', async () => {
    await agendar(pedido({ exameId: RAIO_X_20_MIN, inicio: emSegunda('09:00') })).expect(201);
    const { body } = await agendar(pedido()).expect(409);
    expect(body).toEqual({
      statusCode: 409,
      codigo: 'CONFLITO_DE_HORARIO',
      mensagem: 'Este horário acabou de ser ocupado. Escolha outro horário.',
    });
  });

  it('permite o mesmo horário com outro médico, quando está na grade dos dois', async () => {
    const raioX = { exameId: RAIO_X_20_MIN, inicio: emSegunda('08:00') };
    await agendar(pedido(raioX)).expect(201);
    await agendar(pedido({ ...raioX, medicoId: RAFAEL })).expect(201);
  });

  it('a grade é de cada médico: 08:00 não existe na grade de 40 min de quem começa às 07:00', async () => {
    const { body } = await agendar(pedido({ medicoId: RAFAEL, inicio: emSegunda('08:00') })).expect(
      422,
    );
    expect(body.codigo).toBe('HORARIO_FORA_DA_GRADE');
  });

  describe('regras de negócio → 422', () => {
    it.each([
      [
        'fora da grade do exame (08:10 em grade de 40 min)',
        emSegunda('08:10'),
        'HORARIO_FORA_DA_GRADE',
      ],
      ['com segundos quebrados', `${SEGUNDA}T08:40:30-03:00`, 'HORARIO_FORA_DA_GRADE'],
      ['que estoura o fim do turno (11:40 + 40 min)', emSegunda('11:40'), 'FORA_DO_EXPEDIENTE'],
      ['no intervalo entre turnos', emSegunda('12:40'), 'FORA_DO_EXPEDIENTE'],
      ['em dia que o médico não atende', '2030-01-06T08:00:00-03:00', 'FORA_DO_EXPEDIENTE'],
    ])('horário %s', async (_, inicio, codigo) => {
      const { body } = await agendar(pedido({ inicio })).expect(422);
      expect(body.codigo).toBe(codigo);
    });

    it('horário que já passou', async () => {
      congelarRelogio(emSegunda('09:00'));
      const { body } = await agendar(pedido({ inicio: emSegunda('08:40') })).expect(422);
      expect(body.codigo).toBe('HORARIO_NO_PASSADO');
    });
  });

  describe('referências inexistentes → 404', () => {
    it('médico', async () => {
      const { body } = await agendar(pedido({ medicoId: 99 })).expect(404);
      expect(body.codigo).toBe('MEDICO_NAO_ENCONTRADO');
    });

    it('exame', async () => {
      const { body } = await agendar(pedido({ exameId: 999 })).expect(404);
      expect(body.codigo).toBe('EXAME_NAO_ENCONTRADO');
    });
  });

  describe('validação → 400', () => {
    it('lista todos os campos obrigatórios ausentes', async () => {
      const { body } = await agendar({}).expect(400);
      expect(body.codigo).toBe('DADOS_INVALIDOS');
      expect(body.detalhes.map((d: { campo: string }) => d.campo)).toEqual([
        'pacienteNome',
        'exameId',
        'medicoId',
        'inicio',
      ]);
    });

    it.each([
      ['nome curto demais', { pacienteNome: ' Al ' }, 'pacienteNome'],
      ['id como texto', { exameId: '7' }, 'exameId'],
      ['início sem fuso (ambíguo)', { inicio: '2030-01-07T08:40:00' }, 'inicio'],
      ['início que não é data', { inicio: 'amanhã cedo' }, 'inicio'],
    ])('%s', async (_, extra, campo) => {
      const { body } = await agendar(pedido(extra)).expect(400);
      expect(body.detalhes).toEqual([{ campo, mensagens: expect.any(Array) }]);
    });
  });
});

describe('GET /api/agendamentos', () => {
  it('lista ordenado pelo início e filtra por médico, data e status', async () => {
    await agendar(pedido({ inicio: emSegunda('10:00') })).expect(201);
    await agendar(pedido({ inicio: emSegunda('08:00') })).expect(201);
    await agendar(pedido({ medicoId: RAFAEL, inicio: emSegunda('07:00') })).expect(201);
    const { body: outroDia } = await agendar(
      pedido({ inicio: '2030-01-08T08:00:00-03:00' }),
    ).expect(201);
    await cancelar(outroDia.id).expect(200);

    const todos = await t.api().get('/api/agendamentos').expect(200);
    expect(todos.body.map((a: { inicio: string }) => a.inicio.slice(11, 16))).toEqual([
      '07:00',
      '08:00',
      '10:00',
      '08:00',
    ]);

    const daHelenaNaSegunda = await t
      .api()
      .get('/api/agendamentos')
      .query({ medicoId: HELENA, data: SEGUNDA })
      .expect(200);
    expect(daHelenaNaSegunda.body).toHaveLength(2);

    const cancelados = await t
      .api()
      .get('/api/agendamentos')
      .query({ status: 'CANCELADO' })
      .expect(200);
    expect(cancelados.body.map((a: { id: number }) => a.id)).toEqual([outroDia.id]);
  });

  it('valida os filtros', async () => {
    const { body } = await t
      .api()
      .get('/api/agendamentos')
      .query({ status: 'PENDENTE' })
      .expect(400);
    expect(body.detalhes).toEqual([
      { campo: 'status', mensagens: ['status deve ser ATIVO ou CANCELADO.'] },
    ]);
  });
});

describe('PATCH /api/agendamentos/:id/cancelar', () => {
  it('cancela, mantém o registro e libera o horário', async () => {
    const { body: criado } = await agendar(pedido()).expect(201);

    const { body: cancelado } = await cancelar(criado.id).expect(200);
    expect(cancelado).toMatchObject({ id: criado.id, status: 'CANCELADO' });
    expect(cancelado.canceladoEm).toMatch(/-03:00$/);

    await agendar(pedido({ pacienteNome: 'João Souza' })).expect(201);
  });

  it('é idempotente', async () => {
    const { body: criado } = await agendar(pedido()).expect(201);
    const { body: primeiro } = await cancelar(criado.id).expect(200);
    const { body: segundo } = await cancelar(criado.id).expect(200);
    expect(segundo).toEqual(primeiro);
  });

  it('não cancela um agendamento que já começou', async () => {
    const { body: criado } = await agendar(pedido()).expect(201);
    congelarRelogio(emSegunda('08:50'));
    const { body } = await cancelar(criado.id).expect(422);
    expect(body.codigo).toBe('AGENDAMENTO_JA_INICIADO');
  });

  it('agendamento inexistente → 404; id inválido → 400', async () => {
    expect((await cancelar(123456).expect(404)).body.codigo).toBe('AGENDAMENTO_NAO_ENCONTRADO');
    expect((await cancelar('abc').expect(400)).body.codigo).toBe('DADOS_INVALIDOS');
  });
});
