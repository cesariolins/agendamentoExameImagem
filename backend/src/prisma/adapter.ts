import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { fileURLToPath } from 'node:url';

/**
 * URL do banco. Sem DATABASE_URL, usa `backend/dev.db` por caminho absoluto, para que
 * a CLI do Prisma, a API e o seed abram sempre o mesmo arquivo, qualquer que seja o diretório atual.
 */
export const URL_DO_BANCO =
  process.env.DATABASE_URL ??
  `file:${fileURLToPath(new URL('../../dev.db', import.meta.url)).replaceAll('\\', '/')}`;

/**
 * Único ponto de criação do adapter (API, seed e testes passam por aqui).
 * Datas como inteiro epoch-ms: o trigger anti-sobreposição compara números,
 * e um formato divergente seria rejeitado por ele em vez de comparar errado.
 */
export function criarAdapter(url: string = URL_DO_BANCO) {
  return new PrismaBetterSqlite3({ url }, { timestampFormat: 'unixepoch-ms' });
}
