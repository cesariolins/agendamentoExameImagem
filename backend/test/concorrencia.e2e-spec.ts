import { criarAppDeTeste } from './app-de-teste.js';

let t: Awaited<ReturnType<typeof criarAppDeTeste>>;

beforeAll(async () => {
  t = await criarAppDeTeste();
});

beforeEach(async () => {
  await t.limparAgendamentos();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await t.limparAgendamentos();
  await t.app.close();
});

const HELENA = 1;
const pedido = (paciente: string, exameId: number, hora: string) => ({
  pacienteNome: paciente,
  exameId,
  medicoId: HELENA,
  inicio: `2030-01-07T${hora}:00-03:00`,
});

async function emParalelo(corpos: object[]) {
  const respostas = await Promise.all(
    corpos.map((corpo) => t.api().post('/api/agendamentos').send(corpo)),
  );
  return {
    status: respostas.map((r) => r.status).sort((a, b) => a - b),
    conflitos: respostas.filter((r) => r.status === 409).map((r) => r.body.codigo),
  };
}

describe('pedidos simultâneos', () => {
  it('10 pedidos para o mesmo horário: 1 agendado e 9 recusados com 409', async () => {
    const corpos = Array.from({ length: 10 }, (_, i) => pedido(`Paciente ${i + 1}`, 7, '08:40'));

    const { status, conflitos } = await emParalelo(corpos);

    expect(status).toEqual([201, ...Array(9).fill(409)]);
    expect(conflitos.every((codigo) => codigo === 'CONFLITO_DE_HORARIO')).toBe(true);
    expect(await t.prisma.agendamento.count()).toBe(1);
  });

  it('inícios e durações diferentes que se cruzam (40 min às 08:00 × 20 min às 08:20)', async () => {
    const { status } = await emParalelo([pedido('Ana', 7, '08:00'), pedido('Bruno', 1, '08:20')]);

    expect(status).toEqual([201, 409]);
    expect(await t.prisma.agendamento.count()).toBe(1);
  });

  it('pior caso: todos leem a agenda vazia antes de gravar, e ainda assim o banco impede a duplicidade', async () => {
    const agendaSempreVazia = vi.spyOn(t.prisma.agendamento, 'findMany').mockResolvedValue([]);
    const corpos = Array.from({ length: 10 }, (_, i) => pedido(`Paciente ${i + 1}`, 7, '08:40'));

    const { status, conflitos } = await emParalelo(corpos);

    expect(agendaSempreVazia).toHaveBeenCalledTimes(10);
    expect(status).toEqual([201, ...Array(9).fill(409)]);
    expect(conflitos.every((codigo) => codigo === 'CONFLITO_DE_HORARIO')).toBe(true);
    expect(await t.prisma.agendamento.count()).toBe(1);
  });
});
