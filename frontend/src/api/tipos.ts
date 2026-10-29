export interface Exame {
  id: number;
  nome: string;
  duracaoMinutos: number;
}

export interface Turno {
  diaSemana: number;
  inicio: string;
  fim: string;
}

export interface Medico {
  id: number;
  nome: string;
  crm: string;
  turnos: Turno[];
}

export interface Horario {
  inicio: string;
  fim: string;
}

export interface HorariosDoDia {
  medicoId: number;
  exameId: number;
  data: string;
  duracaoMinutos: number;
  atendeNoDia: boolean;
  horarios: Horario[];
}

export type StatusAgendamento = 'ATIVO' | 'CANCELADO';

export interface Agendamento {
  id: number;
  pacienteNome: string;
  status: StatusAgendamento;
  inicio: string;
  fim: string;
  criadoEm: string;
  canceladoEm: string | null;
  exame: Exame;
  medico: Omit<Medico, 'turnos'>;
}

export interface NovoAgendamento {
  pacienteNome: string;
  exameId: number;
  medicoId: number;
  inicio: string;
}

export interface DetalheDeCampo {
  campo: string;
  mensagens: string[];
}

export type CodigoDeErro =
  | 'DADOS_INVALIDOS'
  | 'EXAME_NAO_ENCONTRADO'
  | 'MEDICO_NAO_ENCONTRADO'
  | 'AGENDAMENTO_NAO_ENCONTRADO'
  | 'ROTA_NAO_ENCONTRADA'
  | 'CONFLITO_DE_HORARIO'
  | 'HORARIO_NO_PASSADO'
  | 'FORA_DO_EXPEDIENTE'
  | 'HORARIO_FORA_DA_GRADE'
  | 'AGENDAMENTO_JA_INICIADO'
  | 'ERRO_INTERNO'
  | 'SEM_CONEXAO';
