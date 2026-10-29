import { useEffect, useRef, useState } from 'react';
import IconeConcluida from '~icons/solar/check-circle-linear';
import type { Agendamento, Exame, Horario, Medico } from '../api/tipos.ts';
import { dataPorExtenso, horaDe } from '../comum/datas.ts';
import { rotulo } from '../comum/estilos.ts';
import { AgendamentoConfirmado } from './AgendamentoConfirmado.tsx';
import { BuscaDeExames } from './BuscaDeExames.tsx';
import { Confirmacao } from './Confirmacao.tsx';
import { EscolhaDeDataEHorario } from './EscolhaDeDataEHorario.tsx';
import { EscolhaDeMedico } from './EscolhaDeMedico.tsx';
import { Etapa } from './Etapa.tsx';

const ETAPAS = ['Exame', 'Médico', 'Data e horário', 'Confirmação'];

function useFocarEtapaAtual(etapaAtual: number) {
  const anterior = useRef(etapaAtual);
  useEffect(() => {
    if (anterior.current === etapaAtual) return;
    anterior.current = etapaAtual;
    const titulo = document.getElementById(`etapa-${etapaAtual}`);
    titulo?.focus({ preventScroll: true });
    titulo?.closest('section')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [etapaAtual]);
}

function Progresso({ etapaAtual }: { etapaAtual: number }) {
  return (
    <nav aria-label="Etapas do agendamento" className="md:sticky md:top-24">
      <ol className="flex gap-4 overflow-x-auto md:flex-col md:gap-5">
        {ETAPAS.map((nome, i) => {
          const numero = i + 1;
          const atual = numero === etapaAtual;
          const concluida = numero < etapaAtual;
          return (
            <li
              key={nome}
              aria-current={atual ? 'step' : undefined}
              className={`flex shrink-0 items-center gap-3 text-sm ${atual ? 'text-stone-900' : 'text-stone-400'}`}
            >
              <span className="font-mono text-xs">{String(numero).padStart(2, '0')}</span>
              <span className={atual ? 'font-medium' : ''}>{nome}</span>
              {concluida && <IconeConcluida aria-label="concluída" className="text-emerald-700" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function FluxoDeAgendamento({ onVerAgendamentos }: { onVerAgendamentos: () => void }) {
  const [exame, setExame] = useState<Exame | null>(null);
  const [medico, setMedico] = useState<Medico | null>(null);
  const [data, setData] = useState('');
  const [horario, setHorario] = useState<Horario | null>(null);
  const [pacienteNome, setPacienteNome] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState<Agendamento | null>(null);

  const etapaAtual = !exame ? 1 : !medico ? 2 : !horario ? 3 : 4;
  useFocarEtapaAtual(etapaAtual);

  function recomecar() {
    setExame(null);
    setMedico(null);
    setData('');
    setHorario(null);
    setPacienteNome('');
    setAviso(null);
    setConfirmado(null);
  }

  if (confirmado) {
    return (
      <AgendamentoConfirmado
        agendamento={confirmado}
        onNovoAgendamento={recomecar}
        onVerAgendamentos={onVerAgendamentos}
      />
    );
  }

  return (
    <>
      <section className="border-b border-stone-300 px-4 py-10 md:px-10 md:py-14">
        <p className={rotulo}>Exames de imagem</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tighter md:text-6xl">
          Agende seu exame
        </h1>
        <p className="mt-4 max-w-xl text-lg text-stone-600">
          Encontre o exame, escolha o médico e veja na hora os horários livres.
        </p>
      </section>

      <div className="md:grid md:grid-cols-12">
        <aside className="border-b border-stone-300 px-4 py-5 md:col-span-3 md:border-r md:border-b-0 md:px-8 md:py-10">
          <Progresso etapaAtual={etapaAtual} />
        </aside>

        <div className="md:col-span-9">
          <Etapa
            numero={1}
            nome="Exame"
            titulo="Qual exame você vai fazer?"
            concluida={etapaAtual > 1}
            resumo={exame && `${exame.nome} · ${exame.duracaoMinutos} min`}
            onAlterar={() => {
              setExame(null);
              setHorario(null);
            }}
          >
            <BuscaDeExames
              onEscolher={(escolhido) => {
                setExame(escolhido);
                setAviso(null);
              }}
            />
          </Etapa>

          {etapaAtual >= 2 && (
            <Etapa
              numero={2}
              nome="Médico"
              titulo="Com qual médico?"
              concluida={etapaAtual > 2}
              resumo={medico && `${medico.nome} · ${medico.crm}`}
              onAlterar={() => {
                setMedico(null);
                setHorario(null);
              }}
            >
              <EscolhaDeMedico onEscolher={setMedico} />
            </Etapa>
          )}

          {etapaAtual >= 3 && exame && medico && (
            <Etapa
              numero={3}
              nome="Data e horário"
              titulo="Quando?"
              concluida={etapaAtual > 3}
              resumo={
                horario &&
                `${dataPorExtenso(data)} · ${horaDe(horario.inicio)} às ${horaDe(horario.fim)}`
              }
              onAlterar={() => setHorario(null)}
            >
              <EscolhaDeDataEHorario
                exame={exame}
                medico={medico}
                data={data}
                aviso={aviso}
                onTrocarData={(novaData) => {
                  setData(novaData);
                  setAviso(null);
                }}
                onEscolher={(escolhido) => {
                  setHorario(escolhido);
                  setAviso(null);
                }}
              />
            </Etapa>
          )}

          {etapaAtual === 4 && exame && medico && horario && (
            <Etapa numero={4} nome="Confirmação" titulo="Confirme o agendamento" concluida={false}>
              <Confirmacao
                exame={exame}
                medico={medico}
                data={data}
                horario={horario}
                pacienteNome={pacienteNome}
                onPacienteNome={setPacienteNome}
                onConfirmado={setConfirmado}
                onHorarioIndisponivel={(mensagem) => {
                  setAviso(mensagem);
                  setHorario(null);
                }}
              />
            </Etapa>
          )}
        </div>
      </div>
    </>
  );
}
