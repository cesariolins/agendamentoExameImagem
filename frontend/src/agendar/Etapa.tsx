import type { ReactNode } from 'react';
import { botaoSecundario, rotulo } from '../comum/estilos.ts';

interface Props {
  numero: number;
  nome: string;
  titulo: string;
  concluida: boolean;
  resumo?: ReactNode;
  onAlterar?: () => void;
  children?: ReactNode;
}

export function Etapa({ numero, nome, titulo, concluida, resumo, onAlterar, children }: Props) {
  const id = `etapa-${numero}`;
  return (
    <section
      aria-labelledby={id}
      className="animate-surgir scroll-mt-20 border-b border-stone-300 px-4 py-8 md:px-10 md:py-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className={rotulo}>
            {String(numero).padStart(2, '0')} / {nome}
          </span>
          <h2
            id={id}
            tabIndex={-1}
            className={`mt-2 font-medium tracking-tight outline-none ${concluida ? 'text-xl text-stone-500' : 'text-2xl md:text-3xl'}`}
          >
            {titulo}
          </h2>
        </div>
        {concluida && onAlterar && (
          <button
            type="button"
            onClick={onAlterar}
            className={botaoSecundario}
            aria-label={`Alterar ${nome.toLowerCase()}`}
          >
            Alterar
          </button>
        )}
      </div>
      {concluida ? (
        <div className="mt-3 text-lg text-stone-900">{resumo}</div>
      ) : (
        <div className="mt-6">{children}</div>
      )}
    </section>
  );
}
