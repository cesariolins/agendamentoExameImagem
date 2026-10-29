import { useHorarios } from '../api/consultas.ts';
import type { Exame, Horario, Medico } from '../api/tipos.ts';
import { Carregando, MensagemDeErro, Vazio } from '../comum/Estados.tsx';
import {
  diaDaSemana,
  diaNoPluralComArtigo,
  diasDeAtendimento,
  hojeNaClinica,
  horaDe,
  periodoDoDia,
} from '../comum/datas.ts';
import { rotulo } from '../comum/estilos.ts';

interface Props {
  exame: Exame;
  medico: Medico;
  data: string;
  onEscolher: (horario: Horario) => void;
}

const DATA_COMPLETA = /^\d{4}-\d{2}-\d{2}$/;

function agruparPorPeriodo(horarios: Horario[]) {
  const grupos = new Map<string, Horario[]>();
  for (const horario of horarios) {
    const periodo = periodoDoDia(horaDe(horario.inicio));
    grupos.set(periodo, [...(grupos.get(periodo) ?? []), horario]);
  }
  return [...grupos];
}

export function GradeDeHorarios({ exame, medico, data, onEscolher }: Props) {
  const hoje = hojeNaClinica();
  const dataValida = DATA_COMPLETA.test(data);
  const noPassado = dataValida && data < hoje;
  const horarios = useHorarios(
    dataValida && !noPassado ? { medicoId: medico.id, data, exameId: exame.id } : null,
  );

  if (!dataValida) return <Vazio titulo="Escolha uma data para ver os horários livres." />;
  if (noPassado) {
    return <Vazio titulo="Essa data já passou.">Escolha uma data a partir de hoje.</Vazio>;
  }
  if (horarios.isPending) return <Carregando texto="Buscando horários livres…" />;
  if (horarios.isError) {
    return <MensagemDeErro erro={horarios.error} onTentarNovamente={() => horarios.refetch()} />;
  }

  const { atendeNoDia, horarios: livres } = horarios.data;

  if (!atendeNoDia) {
    return (
      <Vazio titulo={`${medico.nome} não atende ${diaNoPluralComArtigo(diaDaSemana(data))}.`}>
        Dias de atendimento: {diasDeAtendimento(medico.turnos)}. Escolha outra data.
      </Vazio>
    );
  }

  if (livres.length === 0) {
    return (
      <Vazio
        titulo={
          data === hoje
            ? 'Não há mais horários livres hoje.'
            : 'Todos os horários desta data estão ocupados.'
        }
      >
        Escolha outra data.
      </Vazio>
    );
  }

  return (
    <div className="space-y-6">
      <p className={rotulo} aria-live="polite">
        {livres.length} {livres.length === 1 ? 'horário livre' : 'horários livres'} ·{' '}
        {exame.duracaoMinutos} min cada
      </p>
      {agruparPorPeriodo(livres).map(([periodo, itens]) => (
        <div key={periodo}>
          <p className="text-sm font-medium text-stone-700">{periodo}</p>
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {itens.map((horario) => (
              <li key={horario.inicio}>
                <button
                  type="button"
                  onClick={() => onEscolher(horario)}
                  aria-label={`${horaDe(horario.inicio)} às ${horaDe(horario.fim)}`}
                  className="w-full rounded-md border border-stone-300 bg-white/40 py-2.5 font-mono text-sm transition-colors hover:border-stone-900 hover:bg-stone-900 hover:text-white"
                >
                  {horaDe(horario.inicio)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
