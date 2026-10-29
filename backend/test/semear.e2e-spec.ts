import { semear } from '../prisma/semear.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { criarAdapter } from '../src/prisma/adapter.js';

const prisma = new PrismaClient({ adapter: criarAdapter() });

beforeAll(async () => {
  await prisma.agendamento.deleteMany();
});

afterAll(async () => {
  await prisma.agendamento.deleteMany();
  await prisma.$disconnect();
});

describe('carga inicial', () => {
  it('grava os 30 exames do CSV com o nome normalizado para busca', async () => {
    expect(await prisma.exame.count()).toBe(30);
    expect(await prisma.exame.findUnique({ where: { id: 1 } })).toEqual({
      id: 1,
      nome: 'Raio-X de Tórax',
      nomeBusca: 'raio-x de torax',
      duracaoMinutos: 20,
    });
  });

  it('grava os 5 médicos com os turnos de medicos.md', async () => {
    expect(await prisma.medico.count()).toBe(5);
    expect(await prisma.turno.count()).toBe(36);

    // Thiago Fontes: Ter–Sáb de manhã e, além disso, Qua e Sex à noite.
    const quartaDoThiago = await prisma.turno.findMany({
      where: { medicoId: 4, diaSemana: 3 },
      select: { inicio: true, fim: true },
      orderBy: { inicio: 'asc' },
    });
    expect(quartaDoThiago).toEqual([
      { inicio: '08:00', fim: '12:00' },
      { inicio: '19:00', fim: '22:00' },
    ]);

    // Ninguém atende aos domingos.
    expect(await prisma.turno.count({ where: { diaSemana: 0 } })).toBe(0);
  });

  it('é idempotente e preserva os agendamentos', async () => {
    await prisma.agendamento.create({
      data: {
        pacienteNome: 'Paciente',
        exameId: 1,
        medicoId: 1,
        inicio: new Date('2030-01-07T11:00:00Z'),
        fim: new Date('2030-01-07T11:20:00Z'),
      },
    });

    await semear(prisma);

    expect(await prisma.exame.count()).toBe(30);
    expect(await prisma.turno.count()).toBe(36);
    expect(await prisma.agendamento.count()).toBe(1);
  });
});
