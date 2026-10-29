import { describe, expect, it, vi } from 'vitest';
import { ErroApi, api } from './cliente.ts';

const responder = (status: number, corpo: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(corpo), { status })),
  );

describe('cliente da API', () => {
  it('monta a URL com o prefixo /api e devolve o JSON', async () => {
    responder(200, [{ id: 1, nome: 'Raio-X de Tórax', duracaoMinutos: 20 }]);

    await expect(api.buscarExames('tórax')).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith('/api/exames?busca=t%C3%B3rax', expect.anything());
  });

  it('envia JSON no corpo das escritas', async () => {
    responder(201, { id: 1 });
    const dados = {
      pacienteNome: 'Ana',
      exameId: 7,
      medicoId: 1,
      inicio: '2030-01-07T08:00:00-03:00',
    };

    await api.criarAgendamento(dados);

    expect(fetch).toHaveBeenCalledWith('/api/agendamentos', {
      method: 'POST',
      body: JSON.stringify(dados),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('converte o erro padrão da API em ErroApi', async () => {
    responder(409, {
      statusCode: 409,
      codigo: 'CONFLITO_DE_HORARIO',
      mensagem: 'Este horário acabou de ser ocupado.',
    });

    const erro = await api.cancelarAgendamento(1).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro).toMatchObject({
      status: 409,
      codigo: 'CONFLITO_DE_HORARIO',
      message: 'Este horário acabou de ser ocupado.',
      detalhes: [],
    });
  });

  it('usa uma mensagem genérica quando o erro não vem no formato da API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('Bad Gateway', { status: 502 })),
    );

    await expect(api.listarMedicos()).rejects.toMatchObject({
      status: 502,
      codigo: 'ERRO_INTERNO',
    });
  });

  it('traduz falha de rede em SEM_CONEXAO', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );

    await expect(api.listarMedicos()).rejects.toMatchObject({ status: 0, codigo: 'SEM_CONEXAO' });
  });
});
