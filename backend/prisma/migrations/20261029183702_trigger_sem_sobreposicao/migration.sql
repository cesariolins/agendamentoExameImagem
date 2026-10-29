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
