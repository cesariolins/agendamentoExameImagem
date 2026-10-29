import { useEffect, useRef } from 'react';
import IconeConfirmado from '~icons/solar/check-circle-linear';
import type { Agendamento } from '../api/tipos.ts';
import { dataDe, dataPorExtenso, horaDe } from '../comum/datas.ts';
import { botaoPrimario, botaoSecundario, rotulo } from '../comum/estilos.ts';
import { Detalhes } from './Detalhes.tsx';

interface Props {
  agendamento: Agendamento;
  onNovoAgendamento: () => void;
  onVerAgendamentos: () => void;
}

export function AgendamentoConfirmado({
  agendamento,
  onNovoAgendamento,
  onVerAgendamentos,
}: Props) {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => titulo.current?.focus(), []);

  return (
    <section className="animate-surgir mx-auto max-w-2xl px-4 py-12 md:py-20">
      <IconeConfirmado aria-hidden className="text-5xl text-emerald-700" />
      <p className={`${rotulo} mt-6`}>Agendamento nº {agendamento.id}</p>
      <h2
        ref={titulo}
        tabIndex={-1}
        className="mt-2 text-4xl font-semibold tracking-tighter outline-none md:text-5xl"
      >
        Exame agendado
      </h2>
      <p className="mt-4 text-lg text-stone-600">
        Tudo certo, {agendamento.pacienteNome}. Chegue alguns minutos antes do horário.
      </p>

      <div className="mt-10">
        <Detalhes
          itens={[
            ['Exame', agendamento.exame.nome],
            ['Médico', `${agendamento.medico.nome} · ${agendamento.medico.crm}`],
            ['Data', dataPorExtenso(dataDe(agendamento.inicio))],
            ['Horário', `${horaDe(agendamento.inicio)} às ${horaDe(agendamento.fim)}`],
          ]}
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button type="button" onClick={onNovoAgendamento} className={botaoPrimario}>
          Fazer outro agendamento
        </button>
        <button type="button" onClick={onVerAgendamentos} className={botaoSecundario}>
          Ver agendamentos
        </button>
      </div>
    </section>
  );
}
