import type { Exame, Horario, Medico } from '../api/tipos.ts';
import { Aviso } from '../comum/Estados.tsx';
import { dataCurta, hojeNaClinica, proximosDiasDeAtendimento } from '../comum/datas.ts';
import { campo, rotulo } from '../comum/estilos.ts';
import { GradeDeHorarios } from './GradeDeHorarios.tsx';

interface Props {
  exame: Exame;
  medico: Medico;
  data: string;
  aviso: string | null;
  onTrocarData: (data: string) => void;
  onEscolher: (horario: Horario) => void;
}

export function EscolhaDeDataEHorario({
  exame,
  medico,
  data,
  aviso,
  onTrocarData,
  onEscolher,
}: Props) {
  const hoje = hojeNaClinica();
  const sugestoes = proximosDiasDeAtendimento(medico.turnos, hoje);

  return (
    <div className="space-y-8">
      {aviso && <Aviso>{aviso} Escolha outro horário abaixo.</Aviso>}

      <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
        <fieldset>
          <legend className={rotulo}>Próximos dias de atendimento</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {sugestoes.map((sugestao) => (
              <button
                key={sugestao}
                type="button"
                aria-pressed={sugestao === data}
                onClick={() => onTrocarData(sugestao)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  sugestao === data
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-300 hover:border-stone-900 hover:bg-white'
                }`}
              >
                {sugestao === hoje ? 'Hoje' : dataCurta(sugestao)}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="data" className={rotulo}>
            Ou outra data
          </label>
          <input
            id="data"
            type="date"
            min={hoje}
            value={data}
            onChange={(evento) => onTrocarData(evento.target.value)}
            className={`${campo} mt-2 w-auto py-2`}
          />
        </div>
      </div>

      <GradeDeHorarios exame={exame} medico={medico} data={data} onEscolher={onEscolher} />
    </div>
  );
}
