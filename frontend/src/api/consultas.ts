import {
  QueryClient,
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ErroApi, api } from './cliente.ts';
import type { StatusAgendamento } from './tipos.ts';

const ehErroDoCliente = (erro: unknown) =>
  erro instanceof ErroApi && erro.status >= 400 && erro.status < 500;

export function criarQueryClient({ repetirFalhas = true } = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (falhas, erro) => repetirFalhas && !ehErroDoCliente(erro) && falhas < 2,
      },
    },
  });
}

export interface ConsultaDeHorarios {
  medicoId: number;
  data: string;
  exameId: number;
}

export function useExames(busca: string) {
  return useQuery({
    queryKey: ['exames', busca],
    queryFn: () => api.buscarExames(busca),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
}

export function useMedicos() {
  return useQuery({ queryKey: ['medicos'], queryFn: api.listarMedicos, staleTime: Infinity });
}

export function useHorarios(consulta: ConsultaDeHorarios | null) {
  return useQuery({
    queryKey: ['horarios', consulta],
    queryFn: () => api.horariosLivres(consulta!.medicoId, consulta!.data, consulta!.exameId),
    enabled: consulta !== null,
  });
}

export function useAgendamentos(status?: StatusAgendamento) {
  return useQuery({
    queryKey: ['agendamentos', status ?? 'TODOS'],
    queryFn: () => api.listarAgendamentos(status),
  });
}

function useInvalidarAgenda() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['horarios'] }),
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] }),
    ]);
}

export function useCriarAgendamento() {
  const invalidarAgenda = useInvalidarAgenda();
  return useMutation({ mutationFn: api.criarAgendamento, onSettled: invalidarAgenda });
}

export function useCancelarAgendamento() {
  const invalidarAgenda = useInvalidarAgenda();
  return useMutation({ mutationFn: api.cancelarAgendamento, onSettled: invalidarAgenda });
}
