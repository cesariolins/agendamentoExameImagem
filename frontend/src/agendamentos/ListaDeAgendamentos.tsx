import { useState } from 'react';
import { useAgendamentos, useCancelarAgendamento } from '../api/consultas.ts';
import type { Agendamento, StatusAgendamento } from '../api/tipos.ts';
import { Carregando, MensagemDeErro, Vazio } from '../comum/Estados.tsx';
import { dataCurta, dataDe, horaDe } from '../comum/datas.ts';
import { botaoPrimario, botaoSecundario, rotulo } from '../comum/estilos.ts';

const FILTROS: { rotulo: string; status?: StatusAgendamento }[] = [
  { rotulo: 'Ativos', status: 'ATIVO' },
  { rotulo: 'Cancelados', status: 'CANCELADO' },
  { rotulo: 'Todos' },
];

const ETIQUETAS = {
  agendado: { texto: 'Agendado', classe: 'border-emerald-700/40 text-emerald-800' },
  realizado: { texto: 'Realizado', classe: 'border-stone-400 text-stone-500' },
  cancelado: { texto: 'Cancelado', classe: 'border-red-700/40 text-red-700' },
};

function situacao(agendamento: Agendamento) {
  if (agendamento.status === 'CANCELADO') return 'cancelado';
  return Date.parse(agendamento.inicio) <= Date.now() ? 'realizado' : 'agendado';
}

function LinhaDeAgendamento({
  agendamento,
  onCancelado,
}: {
  agendamento: Agendamento;
  onCancelado: (agendamento: Agendamento) => void;
}) {
  const cancelar = useCancelarAgendamento();
  const [confirmando, setConfirmando] = useState(false);
  const etiqueta = ETIQUETAS[situacao(agendamento)];
  const podeCancelar = situacao(agendamento) === 'agendado';

  return (
    <li
      aria-label={`${agendamento.pacienteNome}, ${agendamento.exame.nome}`}
      className="grid gap-3 px-4 py-5 md:grid-cols-12 md:items-center md:px-10"
    >
      <div className="md:col-span-3">
        <p className="font-mono text-xs text-stone-500 uppercase">
          {dataCurta(dataDe(agendamento.inicio))}
        </p>
        <p className="text-2xl font-medium tracking-tight">
          {horaDe(agendamento.inicio)}
          <span className="text-stone-400"> – {horaDe(agendamento.fim)}</span>
        </p>
      </div>

      <div className="md:col-span-5">
        <p className="font-medium">{agendamento.pacienteNome}</p>
        <p className="text-sm text-stone-600">{agendamento.exame.nome}</p>
        <p className="text-sm text-stone-500">{agendamento.medico.nome}</p>
      </div>

      <div className="md:col-span-2">
        <span
          className={`inline-block rounded-full border px-3 py-1 font-mono text-xs uppercase ${etiqueta.classe}`}
        >
          {etiqueta.texto}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 md:col-span-2 md:justify-end">
        {podeCancelar &&
          (confirmando ? (
            <>
              <button
                type="button"
                disabled={cancelar.isPending}
                onClick={() =>
                  cancelar.mutate(agendamento.id, { onSuccess: () => onCancelado(agendamento) })
                }
                className={`${botaoPrimario} bg-red-700 px-4 py-1.5 text-xs hover:bg-red-800`}
              >
                {cancelar.isPending ? 'Cancelando…' : 'Confirmar cancelamento'}
              </button>
              <button
                type="button"
                disabled={cancelar.isPending}
                onClick={() => setConfirmando(false)}
                className={botaoSecundario}
              >
                Voltar
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmando(true)} className={botaoSecundario}>
              Cancelar
            </button>
          ))}
      </div>

      {cancelar.isError && (
        <div className="md:col-span-12">
          <MensagemDeErro erro={cancelar.error} />
        </div>
      )}
    </li>
  );
}

export function ListaDeAgendamentos({ onAgendar }: { onAgendar: () => void }) {
  const [filtro, setFiltro] = useState(FILTROS[0]);
  const [ultimoCancelado, setUltimoCancelado] = useState<Agendamento | null>(null);
  const agendamentos = useAgendamentos(filtro.status);

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-stone-300 px-4 py-10 md:px-10 md:py-14">
        <div>
          <p className={rotulo}>Agenda</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tighter md:text-6xl">Agendamentos</h1>
        </div>
        <div role="group" aria-label="Filtrar por situação" className="flex gap-2">
          {FILTROS.map((opcao) => (
            <button
              key={opcao.rotulo}
              type="button"
              aria-pressed={opcao === filtro}
              onClick={() => setFiltro(opcao)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium tracking-widest uppercase transition-colors ${
                opcao === filtro
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 hover:border-stone-900'
              }`}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </section>

      <p role="status" className="sr-only">
        {ultimoCancelado && `Agendamento de ${ultimoCancelado.pacienteNome} cancelado.`}
      </p>

      {agendamentos.isSuccess && agendamentos.data.length > 0 ? (
        <ul className="divide-y divide-stone-300 border-b border-stone-300">
          {agendamentos.data.map((agendamento) => (
            <LinhaDeAgendamento
              key={agendamento.id}
              agendamento={agendamento}
              onCancelado={setUltimoCancelado}
            />
          ))}
        </ul>
      ) : (
        <div className="px-4 py-8 md:px-10">
          {agendamentos.isPending ? (
            <Carregando texto="Carregando agendamentos…" />
          ) : agendamentos.isError ? (
            <MensagemDeErro
              erro={agendamentos.error}
              onTentarNovamente={() => agendamentos.refetch()}
            />
          ) : (
            <Vazio titulo="Nenhum agendamento por aqui.">
              <button type="button" onClick={onAgendar} className={`${botaoSecundario} mt-4`}>
                Agendar um exame
              </button>
            </Vazio>
          )}
        </div>
      )}
    </>
  );
}
