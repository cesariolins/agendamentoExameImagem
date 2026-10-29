import { defineConfig } from 'prisma/config';
import { URL_DO_BANCO } from './src/prisma/adapter.js';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: URL_DO_BANCO,
  },
});
