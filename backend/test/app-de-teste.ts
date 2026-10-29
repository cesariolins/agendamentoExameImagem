import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/** Sobe a aplicação real (mesmos pipes e filtros do main.ts) contra o test.db. */
export async function criarAppDeTeste() {
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app: INestApplication = configurarApp(modulo.createNestApplication());
  await app.init();

  const prisma = app.get(PrismaService);
  return {
    app,
    prisma,
    api: () => request(app.getHttpServer()),
    limparAgendamentos: () => prisma.agendamento.deleteMany(),
  };
}
