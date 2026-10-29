import { PrismaClient } from '../src/generated/prisma/client.js';
import { criarAdapter } from '../src/prisma/adapter.js';
import { semear } from './semear.js';

const prisma = new PrismaClient({ adapter: criarAdapter() });

try {
  const total = await semear(prisma);
  console.log(
    `Banco populado: ${total.exames} exames, ${total.medicos} médicos e ${total.turnos} turnos.`,
  );
} finally {
  await prisma.$disconnect();
}
