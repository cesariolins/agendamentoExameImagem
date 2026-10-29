import { Injectable } from '@nestjs/common';
import { normalizarTexto } from '../comum/texto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ExameResposta } from './exames.dto.js';

@Injectable()
export class ExamesService {
  constructor(private readonly prisma: PrismaService) {}

  buscar(busca = ''): Promise<ExameResposta[]> {
    const palavras = normalizarTexto(busca).split(/\s+/).filter(Boolean);
    return this.prisma.exame.findMany({
      where: { AND: palavras.map((palavra) => ({ nomeBusca: { contains: palavra } })) },
      select: { id: true, nome: true, duracaoMinutos: true },
      orderBy: { nomeBusca: 'asc' },
    });
  }
}
