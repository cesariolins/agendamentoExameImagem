import { criarAppDeTeste } from './app-de-teste.js';

let t: Awaited<ReturnType<typeof criarAppDeTeste>>;

beforeAll(async () => {
  t = await criarAppDeTeste();
});

afterAll(async () => {
  await t.app.close();
});

const nomes = (corpo: { nome: string }[]) => corpo.map((exame) => exame.nome);

describe('GET /api/exames', () => {
  it('sem busca, lista os 30 exames em ordem alfabética', async () => {
    const { body } = await t.api().get('/api/exames').expect(200);
    expect(body).toHaveLength(30);
    expect(body[0]).toEqual({ id: 27, nome: 'Angiotomografia Coronariana', duracaoMinutos: 40 });
    expect(Object.keys(body[0])).toEqual(['id', 'nome', 'duracaoMinutos']);
  });

  it('ignora acentos e maiúsculas ("TORAX" acha "Tórax")', async () => {
    const { body } = await t.api().get('/api/exames').query({ busca: 'TORAX' }).expect(200);
    expect(nomes(body)).toEqual(['Raio-X de Tórax', 'Tomografia Computadorizada de Tórax']);
  });

  it('exige todas as palavras, em qualquer ordem', async () => {
    const { body } = await t
      .api()
      .get('/api/exames')
      .query({ busca: 'joelho ressonancia' })
      .expect(200);
    expect(nomes(body)).toEqual(['Ressonância Magnética de Joelho']);
  });

  it('devolve lista vazia quando nada corresponde', async () => {
    const { body } = await t.api().get('/api/exames').query({ busca: 'endoscopia' }).expect(200);
    expect(body).toEqual([]);
  });

  it('recusa busca longa demais com erro por campo', async () => {
    const { body } = await t
      .api()
      .get('/api/exames')
      .query({ busca: 'x'.repeat(101) })
      .expect(400);
    expect(body).toEqual({
      statusCode: 400,
      codigo: 'DADOS_INVALIDOS',
      mensagem: 'Dados inválidos. Verifique os campos informados.',
      detalhes: [{ campo: 'busca', mensagens: ['busca deve ter no máximo 100 caracteres.'] }],
    });
  });
});
