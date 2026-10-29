export const CATALOGO_DE_ERROS = {
  DADOS_INVALIDOS: { status: 400, mensagem: 'Dados inválidos. Verifique os campos informados.' },
  EXAME_NAO_ENCONTRADO: { status: 404, mensagem: 'Exame não encontrado.' },
  MEDICO_NAO_ENCONTRADO: { status: 404, mensagem: 'Médico não encontrado.' },
  AGENDAMENTO_NAO_ENCONTRADO: { status: 404, mensagem: 'Agendamento não encontrado.' },
  ROTA_NAO_ENCONTRADA: { status: 404, mensagem: 'Rota não encontrada.' },
  CONFLITO_DE_HORARIO: {
    status: 409,
    mensagem: 'Este horário acabou de ser ocupado. Escolha outro horário.',
  },
  HORARIO_NO_PASSADO: {
    status: 422,
    mensagem: 'Não é possível agendar em data e hora que já passaram.',
  },
  FORA_DO_EXPEDIENTE: {
    status: 422,
    mensagem: 'O horário escolhido está fora dos turnos de atendimento do médico.',
  },
  HORARIO_FORA_DA_GRADE: {
    status: 422,
    mensagem: 'O horário escolhido não é um dos horários disponíveis para este exame.',
  },
  AGENDAMENTO_JA_INICIADO: {
    status: 422,
    mensagem: 'Não é possível cancelar um agendamento que já começou.',
  },
  ERRO_INTERNO: { status: 500, mensagem: 'Erro inesperado. Tente novamente em instantes.' },
} as const satisfies Record<string, { status: number; mensagem: string }>;

export type CodigoDeErro = keyof typeof CATALOGO_DE_ERROS;

export interface DetalheDeCampo {
  campo: string;
  mensagens: string[];
}

export class ErroDeNegocio extends Error {
  constructor(
    readonly codigo: CodigoDeErro,
    readonly detalhes?: DetalheDeCampo[],
  ) {
    super(CATALOGO_DE_ERROS[codigo].mensagem);
  }
}
