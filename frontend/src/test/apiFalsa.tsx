import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import { criarQueryClient } from '../api/consultas.ts';
import type { Agendamento, Exame, HorariosDoDia, Medico } from '../api/tipos.ts';

interface Requisicao {
  metodo: string;
  caminho: string;
  url: URL;
  corpo: unknown;
}

type Resposta = { status?: number; corpo: unknown };
type Rota = Resposta | ((requisicao: Requisicao) => Resposta | Promise<Resposta>);

export function simularApi(rotas: Record<string, Rota>) {
  const chamadas: Requisicao[] = [];

  vi.stubGlobal(
    'fetch',
    vi.fn(async (entrada: string, init: RequestInit = {}) => {
      const url = new URL(entrada, 'http://localhost');
      const requisicao: Requisicao = {
        metodo: init.method ?? 'GET',
        caminho: url.pathname,
        url,
        corpo: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
      };
      chamadas.push(requisicao);

      const rota = rotas[`${requisicao.metodo} ${requisicao.caminho}`];
      const resposta: Resposta = !rota
        ? {
            status: 404,
            corpo: {
              statusCode: 404,
              codigo: 'ROTA_NAO_ENCONTRADA',
              mensagem: 'Rota não encontrada.',
            },
          }
        : typeof rota === 'function'
          ? await rota(requisicao)
          : rota;

      return new Response(JSON.stringify(resposta.corpo), { status: resposta.status ?? 200 });
    }),
  );

  return {
    chamadas,
    chamadasPara: (metodo: string, caminho: string) =>
      chamadas.filter((c) => c.metodo === metodo && c.caminho === caminho),
  };
}

export function renderizar(componente: ReactElement) {
  const usuario = userEvent.setup();
  const tela = render(
    <QueryClientProvider client={criarQueryClient({ repetirFalhas: false })}>
      {componente}
    </QueryClientProvider>,
  );
  return { usuario, ...tela };
}

export function congelarHoje(instante: string) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(instante));
}

export const EXAMES: Exame[] = [
  { id: 1, nome: 'Raio-X de Tórax', duracaoMinutos: 20 },
  { id: 18, nome: 'Tomografia Computadorizada de Tórax', duracaoMinutos: 40 },
  { id: 7, nome: 'Ultrassonografia Abdominal Total', duracaoMinutos: 40 },
];

const turnos = (dias: number[], inicio: string, fim: string) =>
  dias.map((diaSemana) => ({ diaSemana, inicio, fim }));

export const HELENA: Medico = {
  id: 1,
  nome: 'Dra. Helena Marques',
  crm: 'CRM-MG 11111',
  turnos: [
    ...turnos([1, 2, 3, 4, 5], '08:00', '12:00'),
    ...turnos([1, 2, 3, 4, 5], '14:00', '18:00'),
  ],
};

export const THIAGO: Medico = {
  id: 4,
  nome: 'Dr. Thiago Fontes',
  crm: 'CRM-MG 44444',
  turnos: [...turnos([2, 3, 4, 5, 6], '08:00', '12:00'), ...turnos([3, 5], '19:00', '22:00')],
};

export function horariosDoDia(
  data: string,
  inicios: string[],
  extra: Partial<HorariosDoDia> = {},
): HorariosDoDia {
  const somar40 = (hora: string) => {
    const total = Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3)) + 40;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };
  return {
    medicoId: HELENA.id,
    exameId: 18,
    data,
    duracaoMinutos: 40,
    atendeNoDia: true,
    horarios: inicios.map((hora) => ({
      inicio: `${data}T${hora}:00-03:00`,
      fim: `${data}T${somar40(hora)}:00-03:00`,
    })),
    ...extra,
  };
}

export function agendamento(extra: Partial<Agendamento> = {}): Agendamento {
  return {
    id: 1,
    pacienteNome: 'Maria da Silva',
    status: 'ATIVO',
    inicio: '2030-01-08T08:40:00-03:00',
    fim: '2030-01-08T09:20:00-03:00',
    criadoEm: '2030-01-07T10:00:00-03:00',
    canceladoEm: null,
    exame: EXAMES[1],
    medico: { id: HELENA.id, nome: HELENA.nome, crm: HELENA.crm },
    ...extra,
  };
}
