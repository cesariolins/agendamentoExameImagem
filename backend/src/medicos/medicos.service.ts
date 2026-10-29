import { Injectable } from '@nestjs/common';
import {
  agoraNoDia,
  diaDaSemana,
  instanteNaClinica,
  isoNaClinica,
  naClinica,
} from '../agenda/fuso.js';
import {
  type ContextoDoDia,
  MINUTOS_NO_DIA,
  gerarHorarios,
  paraMinutos,
} from '../agenda/regras.js';
import { ErroDeNegocio } from '../comum/erros.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ConsultaDeHorariosDto, HorariosResposta, MedicoResposta } from './medicos.dto.js';

@Injectable()
export class MedicosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(): Promise<MedicoResposta[]> {
    return this.prisma.medico.findMany({
      select: {
        id: true,
        nome: true,
        crm: true,
        turnos: {
          select: { diaSemana: true, inicio: true, fim: true },
          orderBy: [{ diaSemana: 'asc' }, { inicio: 'asc' }],
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async horariosLivres(
    medicoId: number,
    { data, exameId }: ConsultaDeHorariosDto,
  ): Promise<HorariosResposta> {
    const { exame, contexto } = await this.carregarAgendaDoDia(medicoId, data, exameId);
    const horarios = gerarHorarios(contexto).map((inicio) => ({
      inicio: isoNaClinica(instanteNaClinica(data, inicio)),
      fim: isoNaClinica(instanteNaClinica(data, inicio + exame.duracaoMinutos)),
    }));
    return {
      medicoId,
      exameId,
      data,
      duracaoMinutos: exame.duracaoMinutos,
      atendeNoDia: contexto.turnos.length > 0,
      horarios,
    };
  }

  /**
   * Reúne o que as regras de agenda precisam para um médico, uma data e um exame:
   * turnos do dia da semana, agendamentos ativos do dia e o "agora" relativo à data.
   * Usado tanto para listar horários quanto para validar um novo agendamento.
   */
  async carregarAgendaDoDia(medicoId: number, data: string, exameId: number) {
    const [medico, exame] = await Promise.all([
      this.prisma.medico.findUnique({
        where: { id: medicoId },
        include: { turnos: { where: { diaSemana: diaDaSemana(data) } } },
      }),
      this.prisma.exame.findUnique({ where: { id: exameId } }),
    ]);
    if (!medico) throw new ErroDeNegocio('MEDICO_NAO_ENCONTRADO');
    if (!exame) throw new ErroDeNegocio('EXAME_NAO_ENCONTRADO');

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        medicoId,
        status: 'ATIVO',
        inicio: { lt: instanteNaClinica(data, MINUTOS_NO_DIA) },
        fim: { gt: instanteNaClinica(data, 0) },
      },
      select: { inicio: true, fim: true },
    });

    const contexto: ContextoDoDia = {
      turnos: medico.turnos.map((t) => ({
        inicio: paraMinutos(t.inicio),
        fim: paraMinutos(t.fim),
      })),
      duracaoMinutos: exame.duracaoMinutos,
      ocupados: agendamentos.map((a) => {
        const inicio = naClinica(a.inicio).minutos;
        return { inicio, fim: inicio + (a.fim.getTime() - a.inicio.getTime()) / 60_000 };
      }),
      agoraMinutos: agoraNoDia(data),
    };

    return { medico, exame, contexto };
  }
}
