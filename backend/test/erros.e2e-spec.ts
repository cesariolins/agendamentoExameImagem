import { Logger } from '@nestjs/common';
import { criarAppDeTeste } from './app-de-teste.js';

let t: Awaited<ReturnType<typeof criarAppDeTeste>>;

beforeAll(async () => {
  t = await criarAppDeTeste();
});

afterAll(async () => {
  await t.app.close();
});

describe('formato padrão de erros', () => {
  it('rota inexistente → 404 ROTA_NAO_ENCONTRADA', async () => {
    const resposta = await t.api().get('/api/nao-existe').expect(404);
    expect(resposta.body).toEqual({
      statusCode: 404,
      codigo: 'ROTA_NAO_ENCONTRADA',
      mensagem: 'Rota não encontrada.',
    });
  });

  it('JSON malformado → 400 DADOS_INVALIDOS', async () => {
    const resposta = await t
      .api()
      .post('/api/agendamentos')
      .set('Content-Type', 'application/json')
      .send('{ "pacienteNome": ')
      .expect(400);
    expect(resposta.body).toMatchObject({ statusCode: 400, codigo: 'DADOS_INVALIDOS' });
  });

  it('não vaza detalhes internos em erros inesperados (só registra no log)', async () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const espiao = vi
      .spyOn(t.prisma.exame, 'findMany')
      .mockRejectedValueOnce(new Error('disco cheio'));
    const resposta = await t.api().get('/api/exames').expect(500);
    expect(resposta.body).toEqual({
      statusCode: 500,
      codigo: 'ERRO_INTERNO',
      mensagem: 'Erro inesperado. Tente novamente em instantes.',
    });
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: 'disco cheio' }));
    espiao.mockRestore();
    log.mockRestore();
  });
});
