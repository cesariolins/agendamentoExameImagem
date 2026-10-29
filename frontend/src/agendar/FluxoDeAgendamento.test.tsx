import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EXAMES,
  HELENA,
  THIAGO,
  agendamento,
  congelarHoje,
  horariosDoDia,
  renderizar,
  simularApi,
} from '../test/apiFalsa.tsx';
import { FluxoDeAgendamento } from './FluxoDeAgendamento.tsx';

const ROTAS_BASE = {
  'GET /api/exames': ({ url }: { url: URL }) => ({
    corpo: EXAMES.filter((exame) =>
      exame.nome
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .includes(url.searchParams.get('busca') ?? ''),
    ),
  }),
  'GET /api/medicos': { corpo: [HELENA, THIAGO] },
};

type Usuario = ReturnType<typeof renderizar>['usuario'];

async function escolherExameEMedico(usuario: Usuario, medico = HELENA) {
  await usuario.click(
    await screen.findByRole('button', { name: /Tomografia Computadorizada de Tórax/ }),
  );
  await usuario.click(await screen.findByRole('button', { name: new RegExp(medico.nome) }));
}

async function irAteConfirmacao(usuario: Usuario) {
  await escolherExameEMedico(usuario);
  await usuario.click(screen.getByRole('button', { name: /ter\.?, 08\/01/i }));
  await usuario.click(await screen.findByRole('button', { name: '08:40 às 09:20' }));
}

beforeEach(() => {
  congelarHoje('2030-01-07T10:00:00-03:00');
});

describe('FluxoDeAgendamento', () => {
  it('agenda do começo ao fim: busca, médico, data, horário e confirmação', async () => {
    const api = simularApi({
      ...ROTAS_BASE,
      'GET /api/medicos/1/horarios': ({ url }) => ({
        corpo: horariosDoDia(url.searchParams.get('data')!, ['08:00', '08:40', '14:00']),
      }),
      'POST /api/agendamentos': ({ corpo }) => ({
        status: 201,
        corpo: agendamento({
          id: 42,
          pacienteNome: (corpo as { pacienteNome: string }).pacienteNome,
        }),
      }),
    });
    const { usuario } = renderizar(<FluxoDeAgendamento onVerAgendamentos={vi.fn()} />);

    await usuario.type(screen.getByLabelText('Buscar exame'), 'torax');
    await waitFor(() =>
      expect(api.chamadas.some((c) => c.url.searchParams.get('busca') === 'torax')).toBe(true),
    );
    await waitFor(() => expect(screen.getByText('2 exames')).toBeInTheDocument());
    await usuario.click(
      screen.getByRole('button', { name: /Tomografia Computadorizada de Tórax/ }),
    );

    const cartaoDaHelena = await screen.findByRole('button', { name: /Dra\. Helena Marques/ });
    expect(cartaoDaHelena).toHaveTextContent('Seg a Sex · 08:00–12:00 e 14:00–18:00');
    await usuario.click(cartaoDaHelena);

    await usuario.click(screen.getByRole('button', { name: /ter\.?, 08\/01/i }));

    const grade = await screen.findByText('3 horários livres · 40 min cada');
    expect(grade).toBeInTheDocument();
    expect(screen.getByText('Manhã')).toBeInTheDocument();
    expect(screen.getByText('Tarde')).toBeInTheDocument();
    expect(api.chamadasPara('GET', '/api/medicos/1/horarios')[0].url.search).toBe(
      '?data=2030-01-08&exameId=18',
    );

    await usuario.click(screen.getByRole('button', { name: '08:40 às 09:20' }));
    expect(screen.getByText('terça-feira, 8 de janeiro de 2030')).toBeInTheDocument();

    await usuario.type(screen.getByLabelText('Nome do paciente'), '  Maria   da Silva ');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));

    expect(await screen.findByRole('heading', { name: 'Exame agendado' })).toHaveFocus();
    expect(screen.getByText('Agendamento nº 42')).toBeInTheDocument();
    expect(api.chamadasPara('POST', '/api/agendamentos')[0].corpo).toEqual({
      pacienteNome: 'Maria da Silva',
      exameId: 18,
      medicoId: 1,
      inicio: '2030-01-08T08:40:00-03:00',
    });
  });

  it('mostra a etapa concluída como resumo e permite alterar', async () => {
    simularApi(ROTAS_BASE);
    const { usuario } = renderizar(<FluxoDeAgendamento onVerAgendamentos={vi.fn()} />);

    await escolherExameEMedico(usuario);
    expect(screen.getByText('Tomografia Computadorizada de Tórax · 40 min')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Alterar médico' }));
    expect(
      await screen.findByRole('button', { name: new RegExp(THIAGO.nome) }),
    ).toBeInTheDocument();
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Médico');
  });

  it('avisa quando a busca não encontra exames', async () => {
    simularApi(ROTAS_BASE);
    const { usuario } = renderizar(<FluxoDeAgendamento onVerAgendamentos={vi.fn()} />);

    await usuario.type(screen.getByLabelText('Buscar exame'), 'endoscopia');

    expect(
      await screen.findByText('Nenhum exame encontrado para “endoscopia”.'),
    ).toBeInTheDocument();
  });

  it('mostra erro de conexão com opção de tentar novamente', async () => {
    let tentativas = 0;
    simularApi({
      ...ROTAS_BASE,
      'GET /api/medicos': () => {
        tentativas += 1;
        if (tentativas === 1) throw new TypeError('Failed to fetch');
        return { corpo: [HELENA] };
      },
    });
    const { usuario } = renderizar(<FluxoDeAgendamento onVerAgendamentos={vi.fn()} />);

    await usuario.click(
      await screen.findByRole('button', { name: /Tomografia Computadorizada de Tórax/ }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível falar com o servidor',
    );

    await usuario.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('button', { name: /Dra\. Helena Marques/ })).toBeInTheDocument();
  });

  it('explica quando o médico não atende no dia escolhido', async () => {
    simularApi({
      ...ROTAS_BASE,
      'GET /api/medicos/4/horarios': {
        corpo: horariosDoDia('2030-01-07', [], { medicoId: 4, atendeNoDia: false }),
      },
    });
    const { usuario } = renderizar(<FluxoDeAgendamento onVerAgendamentos={vi.fn()} />);

    await escolherExameEMedico(usuario, THIAGO);
    fireEvent.change(screen.getByLabelText('Ou outra data'), { target: { value: '2030-01-07' } });

    expect(
      await screen.findByText('Dr. Thiago Fontes não atende às segundas.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Dias de atendimento: Ter a Sáb/)).toBeInTheDocument();
  });

  it('diferencia "sem horários hoje" de data já passada', async () => {
    const api = simularApi({
      ...ROTAS_BASE,
      'GET /api/medicos/1/horarios': { corpo: horariosDoDia('2030-01-07', []) },
    });
    const { usuario } = renderizar(<FluxoDeAgendamento onVerAgendamentos={vi.fn()} />);

    await escolherExameEMedico(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Hoje' }));
    expect(await screen.findByText('Não há mais horários livres hoje.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Ou outra data'), { target: { value: '2030-01-04' } });
    expect(screen.getByText('Essa data já passou.')).toBeInTheDocument();
    expect(api.chamadasPara('GET', '/api/medicos/1/horarios')).toHaveLength(1);
  });

  it('valida o nome do paciente antes de enviar', async () => {
    const api = simularApi({
      ...ROTAS_BASE,
      'GET /api/medicos/1/horarios': ({ url }) => ({
        corpo: horariosDoDia(url.searchParams.get('data')!, ['08:40']),
      }),
    });
    const { usuario } = renderizar(<FluxoDeAgendamento onVerAgendamentos={vi.fn()} />);

    await irAteConfirmacao(usuario);
    await usuario.type(screen.getByLabelText('Nome do paciente'), ' Al ');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));

    expect(screen.getByLabelText('Nome do paciente')).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText('Informe o nome do paciente (pelo menos 3 letras).'),
    ).toBeInTheDocument();
    expect(api.chamadasPara('POST', '/api/agendamentos')).toHaveLength(0);
  });

  it('se o horário for ocupado antes da confirmação: avisa, recarrega a grade e mantém o nome', async () => {
    let consultas = 0;
    const api = simularApi({
      ...ROTAS_BASE,
      'GET /api/medicos/1/horarios': ({ url }) => {
        consultas += 1;
        const data = url.searchParams.get('data')!;
        return { corpo: horariosDoDia(data, consultas === 1 ? ['08:00', '08:40'] : ['08:00']) };
      },
      'POST /api/agendamentos': {
        status: 409,
        corpo: {
          statusCode: 409,
          codigo: 'CONFLITO_DE_HORARIO',
          mensagem: 'Este horário acabou de ser ocupado. Escolha outro horário.',
        },
      },
    });
    const { usuario } = renderizar(<FluxoDeAgendamento onVerAgendamentos={vi.fn()} />);

    await irAteConfirmacao(usuario);
    await usuario.type(screen.getByLabelText('Nome do paciente'), 'Maria da Silva');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este horário acabou de ser ocupado.',
    );
    expect(screen.getByRole('heading', { name: 'Quando?' })).toHaveFocus();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '08:40 às 09:20' })).not.toBeInTheDocument(),
    );
    expect(api.chamadasPara('GET', '/api/medicos/1/horarios').length).toBeGreaterThan(1);

    await usuario.click(screen.getByRole('button', { name: '08:00 às 08:40' }));
    const confirmacao = screen.getByRole('region', { name: 'Confirme o agendamento' });
    expect(within(confirmacao).getByLabelText('Nome do paciente')).toHaveValue('Maria da Silva');
  });
});
