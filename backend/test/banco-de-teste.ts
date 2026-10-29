import { fileURLToPath } from 'node:url';

/** Banco SQLite exclusivo dos testes e2e (backend/test.db), recriado a cada execução. */
export const CAMINHO_DO_BANCO_DE_TESTE = fileURLToPath(new URL('../test.db', import.meta.url));
export const URL_DO_BANCO_DE_TESTE = `file:${CAMINHO_DO_BANCO_DE_TESTE.replaceAll('\\', '/')}`;
