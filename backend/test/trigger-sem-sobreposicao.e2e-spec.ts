import { PrismaClient } from '../src/generated/prisma/client.js';
import { criarAdapter } from '../src/prisma/adapter.js';
import { ehConflitoDeHorario } from '../src/prisma/erros-do-banco.js';

const prisma = new PrismaClient({ adapter: criarAdapter() });

const SEGUNDA_FUTURA = '2030-01-07';
const em = (hora: string) => new Date(`${SEGUNDA_FUTURA}T${hora}:00-03:00`);

function agendamento(
  inicio: string,
  fim: string,
  extra: { medicoId?: number; status?: 'ATIVO' | 'CANCELADO' } = {},
) {
  return {
    pacienteNome: 'Paciente de Teste',
    exameId: 7,
    medicoId: 1,
    inicio: em(inicio),
    fim: em(fim),
    ...extra,
  };
}

async function erroDe(operacao: Promise<unknown>): Promise<unknown> {
  try {
    await operacao;
  } catch (erro) {
    return erro;
  }
  throw new Error('A operação deveria ter falhado');
}

beforeEach(async () => {
  await prisma.agendamento.deleteMany();
});

afterAll(async () => {
  await prisma.agendamento.deleteMany();
  await prisma.$disconnect();
});

describe('trigger anti-sobreposição (direto no banco, sem passar pela API)', () => {
  it('aceita agendamentos que apenas se encostam', async () => {
    await prisma.agendamento.create({ data: agendamento('08:00', '08:40') });
    await prisma.agendamento.create({ data: agendamento('08:40', '09:20') });
    expect(await prisma.agendamento.count()).toBe(2);
  });

  it('rejeita sobreposição com início e duração diferentes (40 min às 08:00 × 20 min às 08:20)', async () => {
    await prisma.agendamento.create({ data: agendamento('08:00', '08:40') });
    const erro = await erroDe(prisma.agendamento.create({ data: agendamento('08:20', '08:40') }));
    expect(ehConflitoDeHorario(erro)).toBe(true);
    expect(await prisma.agendamento.count()).toBe(1);
  });

  it('permite o mesmo horário com médicos diferentes', async () => {
    await prisma.agendamento.create({ data: agendamento('08:00', '08:40') });
    await prisma.agendamento.create({ data: agendamento('08:00', '08:40', { medicoId: 2 }) });
    expect(await prisma.agendamento.count()).toBe(2);
  });

  it('ignora agendamentos cancelados', async () => {
    await prisma.agendamento.create({
      data: agendamento('08:00', '08:40', { status: 'CANCELADO' }),
    });
    await prisma.agendamento.create({ data: agendamento('08:00', '08:40') });
    expect(await prisma.agendamento.count()).toBe(2);
  });

  it('impede reativar um cancelado que cruza um agendamento ativo (trigger de UPDATE)', async () => {
    const cancelado = await prisma.agendamento.create({
      data: agendamento('08:00', '08:40', { status: 'CANCELADO' }),
    });
    await prisma.agendamento.create({ data: agendamento('08:20', '09:00') });

    const erro = await erroDe(
      prisma.agendamento.update({ where: { id: cancelado.id }, data: { status: 'ATIVO' } }),
    );
    expect(ehConflitoDeHorario(erro)).toBe(true);
  });

  it('não confunde violação de chave estrangeira com conflito (ambas chegam como P2003)', async () => {
    const erro = await erroDe(
      prisma.agendamento.create({ data: agendamento('08:00', '08:40', { medicoId: 999 }) }),
    );
    expect(erro).toMatchObject({ code: 'P2003' });
    expect(ehConflitoDeHorario(erro)).toBe(false);
  });

  it('rejeita datas gravadas fora do formato epoch-ms', async () => {
    const erro = await erroDe(
      prisma.$executeRawUnsafe(
        `INSERT INTO "Agendamento" ("pacienteNome", "exameId", "medicoId", "inicio", "fim")
         VALUES ('Paciente', 7, 1, '2030-01-07T08:00:00', '2030-01-07T08:40:00')`,
      ),
    );
    expect(JSON.stringify(erro)).toContain('AGENDAMENTO_INVALIDO');
    expect(await prisma.agendamento.count()).toBe(0);
  });

  it('com pedidos simultâneos em cinco conexões (como cinco processos), só um é gravado', async () => {
    const clientes = Array.from({ length: 5 }, () => new PrismaClient({ adapter: criarAdapter() }));
    const pedidos: [string, string][] = [
      ['08:00', '08:40'],
      ['08:20', '08:40'],
      ['08:00', '08:30'],
      ['08:30', '09:00'],
      ['08:10', '08:50'],
    ];

    try {
      const resultados = await Promise.allSettled(
        clientes.flatMap((cliente) =>
          pedidos.map(([inicio, fim]) =>
            cliente.agendamento.create({ data: agendamento(inicio, fim) }),
          ),
        ),
      );

      const gravados = resultados.filter((r) => r.status === 'fulfilled');
      const recusados = resultados.filter((r) => r.status === 'rejected');
      expect(gravados).toHaveLength(1);
      expect(recusados.every((r) => ehConflitoDeHorario(r.reason))).toBe(true);
      expect(await prisma.agendamento.count()).toBe(1);
    } finally {
      await Promise.all(clientes.map((cliente) => cliente.$disconnect()));
    }
  });
});
