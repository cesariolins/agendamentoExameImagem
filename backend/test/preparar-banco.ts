import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { semear } from '../prisma/semear.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { criarAdapter } from '../src/prisma/adapter.js';
import { CAMINHO_DO_BANCO_DE_TESTE, URL_DO_BANCO_DE_TESTE } from './banco-de-teste.js';

export default async function prepararBanco() {
  for (const sufixo of ['', '-journal', '-wal', '-shm']) {
    rmSync(CAMINHO_DO_BANCO_DE_TESTE + sufixo, { force: true });
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: URL_DO_BANCO_DE_TESTE },
    stdio: 'pipe',
  });

  const prisma = new PrismaClient({ adapter: criarAdapter(URL_DO_BANCO_DE_TESTE) });
  try {
    await semear(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
