import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { fileURLToPath } from 'node:url';

export const URL_DO_BANCO =
  process.env.DATABASE_URL ??
  `file:${fileURLToPath(new URL('../../dev.db', import.meta.url)).replaceAll('\\', '/')}`;

export function criarAdapter(url: string = URL_DO_BANCO) {
  return new PrismaBetterSqlite3({ url }, { timestampFormat: 'unixepoch-ms' });
}
