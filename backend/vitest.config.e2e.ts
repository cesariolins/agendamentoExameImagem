import { defineConfig } from 'vitest/config';
import { URL_DO_BANCO_DE_TESTE } from './test/banco-de-teste.js';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/preparar-banco.ts'],
    env: { DATABASE_URL: URL_DO_BANCO_DE_TESTE },
    // Todos os arquivos compartilham o mesmo test.db: rodar em sequência evita interferência.
    fileParallelism: false,
  },
});
