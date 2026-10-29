import IconeRelogio from '~icons/solar/clock-circle-linear';
import IconeMedico from '~icons/solar/stethoscope-linear';
import { useMedicos } from '../api/consultas.ts';
import type { Medico } from '../api/tipos.ts';
import { Carregando, MensagemDeErro } from '../comum/Estados.tsx';
import { resumirTurnos } from '../comum/datas.ts';
import { grade, opcao, rotulo } from '../comum/estilos.ts';

export function EscolhaDeMedico({ onEscolher }: { onEscolher: (medico: Medico) => void }) {
  const medicos = useMedicos();

  if (medicos.isPending) return <Carregando texto="Carregando médicos…" />;
  if (medicos.isError) {
    return <MensagemDeErro erro={medicos.error} onTentarNovamente={() => medicos.refetch()} />;
  }

  return (
    <ul className={`${grade} sm:grid-cols-2`}>
      {medicos.data.map((medico) => (
        <li key={medico.id} className="flex">
          <button
            type="button"
            onClick={() => onEscolher(medico)}
            className={`group flex w-full flex-col gap-4 p-5 text-left ${opcao(false)}`}
          >
            <span className="flex items-start justify-between gap-4">
              <span>
                <span className="block text-lg font-medium tracking-tight">{medico.nome}</span>
                <span className={rotulo}>{medico.crm}</span>
              </span>
              <IconeMedico
                aria-hidden
                className="text-2xl text-stone-400 transition-colors group-hover:text-stone-900"
              />
            </span>
            <span className="space-y-1 text-sm text-stone-600">
              {resumirTurnos(medico.turnos).map((linha) => (
                <span key={linha} className="flex items-center gap-2">
                  <IconeRelogio aria-hidden className="shrink-0 text-stone-400" />
                  {linha}
                </span>
              ))}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
