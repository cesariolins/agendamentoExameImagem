import type {
  Agendamento,
  CodigoDeErro,
  DetalheDeCampo,
  Exame,
  HorariosDoDia,
  Medico,
  NovoAgendamento,
  StatusAgendamento,
} from './tipos.ts';

export class ErroApi extends Error {
  readonly status: number;
  readonly codigo: CodigoDeErro;
  readonly detalhes: DetalheDeCampo[];

  constructor(
    status: number,
    codigo: CodigoDeErro,
    mensagem: string,
    detalhes: DetalheDeCampo[] = [],
  ) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

const MENSAGEM_SEM_CONEXAO =
  'Não foi possível falar com o servidor. Verifique se a API está rodando e tente novamente.';
const MENSAGEM_INESPERADA = 'Erro inesperado. Tente novamente em instantes.';

async function requisitar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`/api${caminho}`, {
      ...init,
      headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch {
    throw new ErroApi(0, 'SEM_CONEXAO', MENSAGEM_SEM_CONEXAO);
  }

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroApi(
      resposta.status,
      corpo?.codigo ?? 'ERRO_INTERNO',
      corpo?.mensagem ?? MENSAGEM_INESPERADA,
      corpo?.detalhes ?? [],
    );
  }
  return corpo as T;
}

export const api = {
  buscarExames: (busca: string) => requisitar<Exame[]>(`/exames?${new URLSearchParams({ busca })}`),

  listarMedicos: () => requisitar<Medico[]>('/medicos'),

  horariosLivres: (medicoId: number, data: string, exameId: number) =>
    requisitar<HorariosDoDia>(
      `/medicos/${medicoId}/horarios?${new URLSearchParams({ data, exameId: String(exameId) })}`,
    ),

  criarAgendamento: (dados: NovoAgendamento) =>
    requisitar<Agendamento>('/agendamentos', { method: 'POST', body: JSON.stringify(dados) }),

  listarAgendamentos: (status?: StatusAgendamento) =>
    requisitar<Agendamento[]>(status ? `/agendamentos?status=${status}` : '/agendamentos'),

  cancelarAgendamento: (id: number) =>
    requisitar<Agendamento>(`/agendamentos/${id}/cancelar`, { method: 'PATCH' }),
};
