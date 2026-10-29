import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  CATALOGO_DE_ERROS,
  type CodigoDeErro,
  type DetalheDeCampo,
  ErroDeNegocio,
} from './erros.js';

interface RespostaDeErro {
  statusCode: number;
  codigo: CodigoDeErro;
  mensagem: string;
  detalhes?: DetalheDeCampo[];
}

const doCatalogo = (codigo: CodigoDeErro): RespostaDeErro => ({
  statusCode: CATALOGO_DE_ERROS[codigo].status,
  codigo,
  mensagem: CATALOGO_DE_ERROS[codigo].mensagem,
});

/**
 * Converte qualquer exceção na resposta padrão `{ statusCode, codigo, mensagem, detalhes? }`.
 * Exceções desconhecidas viram 500 sem vazar detalhes internos (que ficam só no log).
 */
@Catch()
export class FiltroDeErros implements ExceptionFilter {
  private readonly logger = new Logger(FiltroDeErros.name);

  catch(excecao: unknown, host: ArgumentsHost) {
    const resposta = this.paraResposta(excecao);
    if (resposta.statusCode >= 500) this.logger.error(excecao);
    host.switchToHttp().getResponse<Response>().status(resposta.statusCode).json(resposta);
  }

  private paraResposta(excecao: unknown): RespostaDeErro {
    if (excecao instanceof ErroDeNegocio) {
      return {
        ...doCatalogo(excecao.codigo),
        ...(excecao.detalhes && { detalhes: excecao.detalhes }),
      };
    }

    // Exceções do próprio Nest/Express: rota inexistente, JSON malformado, corpo grande demais etc.
    if (excecao instanceof HttpException) {
      const status = excecao.getStatus();
      if (status === 404) return doCatalogo('ROTA_NAO_ENCONTRADA');
      if (status < 500) return { ...doCatalogo('DADOS_INVALIDOS'), statusCode: status };
    }

    return doCatalogo('ERRO_INTERNO');
  }
}
