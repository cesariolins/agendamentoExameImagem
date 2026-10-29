import { Prisma } from '../generated/prisma/client.js';

interface CausaDoAdapter {
  originalCode?: string;
  originalMessage?: string;
}

export function ehConflitoDeHorario(erro: unknown): boolean {
  if (!(erro instanceof Prisma.PrismaClientKnownRequestError)) return false;
  const causa = (erro.meta?.driverAdapterError as { cause?: CausaDoAdapter } | undefined)?.cause;
  return (
    causa?.originalCode === 'SQLITE_CONSTRAINT_TRIGGER' &&
    causa.originalMessage === 'CONFLITO_DE_HORARIO'
  );
}
