import { useState } from 'react';
import IconeBusca from '~icons/solar/magnifer-linear';
import { useExames } from '../api/consultas.ts';
import type { Exame } from '../api/tipos.ts';
import { Carregando, MensagemDeErro, Vazio } from '../comum/Estados.tsx';
import { campo, grade, opcao, rotulo } from '../comum/estilos.ts';
import { useDebounce } from '../comum/useDebounce.ts';

export function BuscaDeExames({ onEscolher }: { onEscolher: (exame: Exame) => void }) {
  const [texto, setTexto] = useState('');
  const busca = useDebounce(texto.trim());
  const exames = useExames(busca);

  return (
    <div>
      <label htmlFor="busca-exame" className={rotulo}>
        Buscar exame
      </label>
      <div className="relative mt-2">
        <IconeBusca
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-stone-400"
        />
        <input
          id="busca-exame"
          type="search"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Ex.: tórax, ressonância, mamografia"
          autoComplete="off"
          className={`${campo} pl-11`}
        />
      </div>

      <div className="mt-6">
        {exames.isPending ? (
          <Carregando texto="Carregando exames…" />
        ) : exames.isError ? (
          <MensagemDeErro erro={exames.error} onTentarNovamente={() => exames.refetch()} />
        ) : exames.data.length === 0 ? (
          <Vazio titulo={`Nenhum exame encontrado para “${busca}”.`}>
            Confira a grafia ou busque por parte do nome, como “ultrassom” ou “crânio”.
          </Vazio>
        ) : (
          <>
            <p className={`${rotulo} mb-3`} aria-live="polite">
              {exames.data.length} {exames.data.length === 1 ? 'exame' : 'exames'}
            </p>
            <ul
              className={`${grade} max-h-[26rem] overflow-y-auto sm:grid-cols-2 ${exames.isPlaceholderData ? 'opacity-60' : ''}`}
            >
              {exames.data.map((exame) => (
                <li key={exame.id} className="flex">
                  <button
                    type="button"
                    onClick={() => onEscolher(exame)}
                    className={`flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left ${opcao(false)}`}
                  >
                    <span>{exame.nome}</span>
                    <span className="shrink-0 font-mono text-xs text-stone-500">
                      {exame.duracaoMinutos} min
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
