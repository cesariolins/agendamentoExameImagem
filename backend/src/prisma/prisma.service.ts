import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { criarAdapter } from './adapter.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: criarAdapter() });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
