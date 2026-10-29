import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { agendamento, congelarHoje, renderizar, simularApi } from '../test/apiFalsa.tsx';
import { ListaDeAgendamentos } from './ListaDeAgendamentos.tsx';

beforeEach(() => {
  congelarHoje('2030-01-07T10:00:00-03:00');
});

describe('ListaDeAgendamentos', () => {
  it('lista os agendamentos ativos com data, horário, paciente, exame e médico', async () => {
    const api = simularApi({ 'GET /api/agendamentos': { corpo: [agendamento()] } });
    renderizar(<ListaDeAgendamentos onAgendar={vi.fn()} />);

    const linha = await screen.findByRole('listitem', {
      name: 'Maria da Silva, Tomografia Computadorizada de Tórax',
    });
    expect(linha).toHaveTextContent('08:40');
    expect(linha).toHaveTextContent('09:20');
    expect(linha).toHaveTextContent('Dra. Helena Marques');
    expect(linha).toHaveTextContent('Agendado');
    expect(api.chamadas[0].url.search).toBe('?status=ATIVO');
  });

  it('cancela em dois passos e atualiza a lista', async () => {
    let cancelado = false;
    const api = simularApi({
      'GET /api/agendamentos': () => ({ corpo: cancelado ? [] : [agendamento()] }),
      'PATCH /api/agendamentos/1/cancelar': () => {
        cancelado = true;
        return { corpo: agendamento({ status: 'CANCELADO' }) };
      },
    });
    const { usuario } = renderizar(<ListaDeAgendamentos onAgendar={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(api.chamadasPara('PATCH', '/api/agendamentos/1/cancelar')).toHaveLength(0);

    await usuario.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(await screen.findByText('Nenhum agendamento por aqui.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Agendamento de Maria da Silva cancelado.',
    );
    expect(api.chamadasPara('PATCH', '/api/agendamentos/1/cancelar')).toHaveLength(1);
  });

  it('não oferece cancelamento para exame que já começou', async () => {
    congelarHoje('2030-01-08T09:00:00-03:00');
    simularApi({ 'GET /api/agendamentos': { corpo: [agendamento()] } });
    renderizar(<ListaDeAgendamentos onAgendar={vi.fn()} />);

    const linha = await screen.findByRole('listitem');
    expect(linha).toHaveTextContent('Realizado');
    expect(within(linha).queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('mostra o erro da API quando o cancelamento é recusado', async () => {
    simularApi({
      'GET /api/agendamentos': { corpo: [agendamento()] },
      'PATCH /api/agendamentos/1/cancelar': {
        status: 422,
        corpo: {
          statusCode: 422,
          codigo: 'AGENDAMENTO_JA_INICIADO',
          mensagem: 'Não é possível cancelar um agendamento que já começou.',
        },
      },
    });
    const { usuario } = renderizar(<ListaDeAgendamentos onAgendar={vi.fn()} />);

    await usuario.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não é possível cancelar um agendamento que já começou.',
    );
  });

  it('filtra por situação', async () => {
    const api = simularApi({
      'GET /api/agendamentos': ({ url }) => ({
        corpo:
          url.searchParams.get('status') === 'CANCELADO'
            ? [agendamento({ status: 'CANCELADO' })]
            : [],
      }),
    });
    const { usuario } = renderizar(<ListaDeAgendamentos onAgendar={vi.fn()} />);

    expect(await screen.findByText('Nenhum agendamento por aqui.')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Cancelados' }));

    expect(await screen.findByText('Cancelado')).toBeInTheDocument();
    await waitFor(() => expect(api.chamadas.at(-1)?.url.search).toBe('?status=CANCELADO'));
  });
});
