import { type FormEvent, useState } from 'react';
import { ErroApi } from '../api/cliente.ts';
import { useCriarAgendamento } from '../api/consultas.ts';
import type { Agendamento, CodigoDeErro, Exame, Horario, Medico } from '../api/tipos.ts';
import { MensagemDeErro } from '../comum/Estados.tsx';
import { dataPorExtenso, horaDe } from '../comum/datas.ts';
import { botaoPrimario, campo, rotulo } from '../comum/estilos.ts';
import { Detalhes } from './Detalhes.tsx';
import { normalizarNome, validarNome } from './nomeDoPaciente.ts';

interface Props {
  exame: Exame;
  medico: Medico;
  data: string;
  horario: Horario;
  pacienteNome: string;
  onPacienteNome: (nome: string) => void;
  onConfirmado: (agendamento: Agendamento) => void;
  onHorarioIndisponivel: (mensagem: string) => void;
}

const HORARIO_INDISPONIVEL: CodigoDeErro[] = [
  'CONFLITO_DE_HORARIO',
  'HORARIO_NO_PASSADO',
  'FORA_DO_EXPEDIENTE',
  'HORARIO_FORA_DA_GRADE',
];

export function Confirmacao({
  exame,
  medico,
  data,
  horario,
  pacienteNome,
  onPacienteNome,
  onConfirmado,
  onHorarioIndisponivel,
}: Props) {
  const criar = useCriarAgendamento();
  const [erroDoNome, setErroDoNome] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<unknown>(null);

  function confirmar(evento: FormEvent) {
    evento.preventDefault();
    const problema = validarNome(pacienteNome);
    setErroDoNome(problema);
    setErroGeral(null);
    if (problema) return;

    criar.mutate(
      {
        pacienteNome: normalizarNome(pacienteNome),
        exameId: exame.id,
        medicoId: medico.id,
        inicio: horario.inicio,
      },
      {
        onSuccess: onConfirmado,
        onError: (erro) => {
          if (erro instanceof ErroApi && HORARIO_INDISPONIVEL.includes(erro.codigo)) {
            onHorarioIndisponivel(erro.message);
            return;
          }
          const doNome =
            erro instanceof ErroApi && erro.detalhes.find((d) => d.campo === 'pacienteNome');
          if (doNome) setErroDoNome(doNome.mensagens[0]);
          else setErroGeral(erro);
        },
      },
    );
  }

  return (
    <form onSubmit={confirmar} noValidate className="grid gap-10 lg:grid-cols-2">
      <Detalhes
        itens={[
          ['Exame', exame.nome],
          ['Duração', `${exame.duracaoMinutos} min`],
          ['Médico', `${medico.nome} · ${medico.crm}`],
          ['Data', dataPorExtenso(data)],
          ['Horário', `${horaDe(horario.inicio)} às ${horaDe(horario.fim)}`],
        ]}
      />

      <div className="flex flex-col gap-6">
        <div>
          <label htmlFor="paciente" className={rotulo}>
            Nome do paciente
          </label>
          <input
            id="paciente"
            value={pacienteNome}
            onChange={(evento) => onPacienteNome(evento.target.value)}
            autoComplete="name"
            aria-invalid={erroDoNome !== null}
            aria-describedby={erroDoNome ? 'paciente-erro' : undefined}
            className={`${campo} mt-2`}
          />
          {erroDoNome && (
            <p id="paciente-erro" className="mt-2 text-sm text-red-700">
              {erroDoNome}
            </p>
          )}
        </div>

        {erroGeral !== null && <MensagemDeErro erro={erroGeral} />}

        <button type="submit" disabled={criar.isPending} className={`${botaoPrimario} w-full`}>
          {criar.isPending ? 'Agendando…' : 'Confirmar agendamento'}
        </button>
      </div>
    </form>
  );
}
