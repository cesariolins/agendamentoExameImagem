import { Prisma } from '../generated/prisma/client.js';

interface CausaDoAdapter {
  originalCode?: string;
  originalMessage?: string;
}

/**
 * Identifica o abort do trigger anti-sobreposição (migration trigger_sem_sobreposicao).
 *
 * O adapter do SQLite entrega erros de trigger com o mesmo código P2003 de uma violação de
 * chave estrangeira, então o código sozinho não basta: é preciso olhar a causa original.
 */
export function ehConflitoDeHorario(erro: unknown): boolean {
  if (!(erro instanceof Prisma.PrismaClientKnownRequestError)) return false;
  const causa = (erro.meta?.driverAdapterError as { cause?: CausaDoAdapter } | undefined)?.cause;
  return (
    causa?.originalCode === 'SQLITE_CONSTRAINT_TRIGGER' &&
    causa.originalMessage === 'CONFLITO_DE_HORARIO'
  );
}
