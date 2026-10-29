import { Injectable } from '@nestjs/common';
import { instanteNaClinica, isoNaClinica, naClinica } from '../agenda/fuso.js';
import { MINUTOS_NO_DIA, motivoDeRecusa } from '../agenda/regras.js';
import { ErroDeNegocio } from '../comum/erros.js';
import type { Prisma } from '../generated/prisma/client.js';
import { MedicosService } from '../medicos/medicos.service.js';
import { ehConflitoDeHorario } from '../prisma/erros-do-banco.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AgendamentoResposta,
  CriarAgendamentoDto,
  FiltroDeAgendamentosDto,
} from './agendamentos.dto.js';

const RELACOES = {
  exame: { select: { id: true, nome: true, duracaoMinutos: true } },
  medico: { select: { id: true, nome: true, crm: true } },
} as const;

type AgendamentoComRelacoes = Prisma.AgendamentoGetPayload<{ include: typeof RELACOES }>;

function apresentar(agendamento: AgendamentoComRelacoes): AgendamentoResposta {
  const { id, pacienteNome, status, exame, medico } = agendamento;
  return {
    id,
    pacienteNome,
    status,
    inicio: isoNaClinica(agendamento.inicio),
    fim: isoNaClinica(agendamento.fim),
    criadoEm: isoNaClinica(agendamento.criadoEm),
    canceladoEm: agendamento.canceladoEm && isoNaClinica(agendamento.canceladoEm),
    exame,
    medico,
  };
}

@Injectable()
export class AgendamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly medicos: MedicosService,
  ) {}

  async criar(dto: CriarAgendamentoDto): Promise<AgendamentoResposta> {
    const inicio = new Date(dto.inicio);
    // A grade é de minutos cheios: um início com segundos nunca coincide com um horário oferecido.
    if (inicio.getTime() % 60_000 !== 0) throw new ErroDeNegocio('HORARIO_FORA_DA_GRADE');

    // Mesma regra que gera os horários livres: o que a tela oferece é exatamente o que a API aceita.
    const { data, minutos } = naClinica(inicio);
    const { exame, contexto } = await this.medicos.carregarAgendaDoDia(
      dto.medicoId,
      data,
      dto.exameId,
    );
    const motivo = motivoDeRecusa(contexto, minutos);
    if (motivo) throw new ErroDeNegocio(motivo);

    try {
      const criado = await this.prisma.agendamento.create({
        data: {
          pacienteNome: dto.pacienteNome,
          exameId: dto.exameId,
          medicoId: dto.medicoId,
          inicio,
          fim: new Date(inicio.getTime() + exame.duracaoMinutos * 60_000),
        },
        include: RELACOES,
      });
      return apresentar(criado);
    } catch (erro) {
      // Outro pedido gravou um horário cruzado entre a checagem acima e este INSERT: o trigger barrou.
      if (ehConflitoDeHorario(erro)) throw new ErroDeNegocio('CONFLITO_DE_HORARIO');
      throw erro;
    }
  }

  async listar({
    medicoId,
    data,
    status,
  }: FiltroDeAgendamentosDto): Promise<AgendamentoResposta[]> {
    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        medicoId,
        status,
        ...(data && {
          inicio: { gte: instanteNaClinica(data, 0), lt: instanteNaClinica(data, MINUTOS_NO_DIA) },
        }),
      },
      include: RELACOES,
      orderBy: { inicio: 'asc' },
    });
    return agendamentos.map(apresentar);
  }

  /** Cancelamento lógico: libera o horário e mantém o histórico. Cancelar de novo não muda nada. */
  async cancelar(id: number): Promise<AgendamentoResposta> {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id },
      include: RELACOES,
    });
    if (!agendamento) throw new ErroDeNegocio('AGENDAMENTO_NAO_ENCONTRADO');
    if (agendamento.status === 'CANCELADO') return apresentar(agendamento);
    if (agendamento.inicio <= new Date()) throw new ErroDeNegocio('AGENDAMENTO_JA_INICIADO');

    const cancelado = await this.prisma.agendamento.update({
      where: { id },
      data: { status: 'CANCELADO', canceladoEm: new Date() },
      include: RELACOES,
    });
    return apresentar(cancelado);
  }
}
