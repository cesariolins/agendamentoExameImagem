-- Garante no banco que um médico nunca tenha dois agendamentos ATIVOS com intervalos cruzados.
--
-- Por que trigger: a sobreposição envolve inícios diferentes (40 min às 08:00 x 20 min às 08:20),
-- então um índice único não resolve. O SQLite serializa as escritas e o trigger roda dentro do
-- próprio INSERT/UPDATE, portanto "checar e gravar" é atômico: de dois pedidos simultâneos, o
-- segundo enxerga o primeiro e aborta. A API traduz o erro CONFLITO_DE_HORARIO para HTTP 409.
--
-- Intervalos semiabertos [inicio, fim): encostar (08:00–08:40 e 08:40–09:20) não é sobrepor.
-- As datas são inteiros epoch-ms (veja src/prisma/adapter.ts); outro formato é rejeitado.
--
-- ATENÇÃO: se uma migration futura recriar a tabela "Agendamento" (CREATE new_/DROP/RENAME),
-- o SQLite apaga estes triggers. Recrie-os na mesma migration.

CREATE TRIGGER "agendamento_sem_sobreposicao_insert"
BEFORE INSERT ON "Agendamento"
BEGIN
  SELECT RAISE(ABORT, 'AGENDAMENTO_INVALIDO')
  WHERE typeof(NEW."inicio") <> 'integer'
     OR typeof(NEW."fim") <> 'integer'
     OR NEW."fim" <= NEW."inicio"
     OR NEW."status" NOT IN ('ATIVO', 'CANCELADO');

  SELECT RAISE(ABORT, 'CONFLITO_DE_HORARIO')
  WHERE NEW."status" = 'ATIVO' AND EXISTS (
    SELECT 1 FROM "Agendamento" a
    WHERE a."medicoId" = NEW."medicoId"
      AND a."status" = 'ATIVO'
      AND a."inicio" < NEW."fim"
      AND a."fim" > NEW."inicio"
  );
END;

CREATE TRIGGER "agendamento_sem_sobreposicao_update"
BEFORE UPDATE OF "medicoId", "inicio", "fim", "status" ON "Agendamento"
WHEN NEW."status" = 'ATIVO'
BEGIN
  SELECT RAISE(ABORT, 'CONFLITO_DE_HORARIO')
  WHERE EXISTS (
    SELECT 1 FROM "Agendamento" a
    WHERE a."id" <> NEW."id"
      AND a."medicoId" = NEW."medicoId"
      AND a."status" = 'ATIVO'
      AND a."inicio" < NEW."fim"
      AND a."fim" > NEW."inicio"
  );
END;
