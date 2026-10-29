import type { ReactNode } from 'react';
import IconeAlerta from '~icons/solar/danger-triangle-linear';
import IconeAtualizar from '~icons/solar/refresh-linear';
import IconeInfo from '~icons/solar/info-circle-linear';
import { botaoSecundario } from './estilos.ts';

export function Carregando({ texto }: { texto: string }) {
  return (
    <p role="status" className="flex items-center gap-3 py-6 text-sm text-stone-500">
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900"
      />
      {texto}
    </p>
  );
}

export function MensagemDeErro({
  erro,
  onTentarNovamente,
}: {
  erro: unknown;
  onTentarNovamente?: () => void;
}) {
  const mensagem = erro instanceof Error ? erro.message : 'Erro inesperado. Tente novamente.';
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 border-l-2 border-red-700 bg-white/60 px-4 py-3 text-sm text-red-700"
    >
      <IconeAlerta aria-hidden className="shrink-0 text-lg" />
      <p className="min-w-0 flex-1">{mensagem}</p>
      {onTentarNovamente && (
        <button type="button" onClick={onTentarNovamente} className={botaoSecundario}>
          <IconeAtualizar aria-hidden />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function Aviso({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-l-2 border-amber-700 bg-white/60 px-4 py-3 text-sm text-amber-800"
    >
      <IconeInfo aria-hidden className="mt-0.5 shrink-0 text-lg" />
      <div>{children}</div>
    </div>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-stone-300 px-6 py-10 text-center">
      <p className="font-medium text-stone-800">{titulo}</p>
      {children && <div className="mt-2 text-sm text-stone-500">{children}</div>}
    </div>
  );
}
