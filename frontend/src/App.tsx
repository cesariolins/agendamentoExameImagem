import { useState } from 'react';
import IconeMarca from '~icons/solar/atom-linear';
import { FluxoDeAgendamento } from './agendar/FluxoDeAgendamento.tsx';
import { ListaDeAgendamentos } from './agendamentos/ListaDeAgendamentos.tsx';

type Aba = 'agendar' | 'agendamentos';

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'agendar', rotulo: 'Agendar' },
  { id: 'agendamentos', rotulo: 'Agendamentos' },
];

export default function App() {
  const [aba, setAba] = useState<Aba>('agendar');

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col border-x border-stone-300">
      <header className="sticky top-0 z-10 border-b border-stone-300 bg-papel/90 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-10">
          <div className="flex items-center gap-4">
            <div className="group flex items-center gap-2">
              <IconeMarca
                aria-hidden
                className="text-xl transition-transform duration-700 group-hover:rotate-180"
              />
              <span className="text-lg leading-none font-bold tracking-tighter [text-box:trim-both_cap_alphabetic]">
                IMAGEM
              </span>
            </div>
            <span aria-hidden className="hidden h-4 w-px bg-stone-300 sm:block" />
            <span className="hidden text-[11px] leading-none font-medium tracking-[0.2em] text-stone-500 uppercase [text-box:trim-both_cap_alphabetic] sm:block">
              Agenda de exames
            </span>
          </div>
          <nav aria-label="Seções" className="flex gap-6">
            {ABAS.map(({ id, rotulo }) => (
              <button
                key={id}
                type="button"
                aria-current={aba === id ? 'page' : undefined}
                onClick={() => setAba(id)}
                className={`border-b py-1 text-xs font-medium tracking-widest uppercase transition-colors ${
                  aba === id
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                {rotulo}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {aba === 'agendar' ? (
          <FluxoDeAgendamento onVerAgendamentos={() => setAba('agendamentos')} />
        ) : (
          <ListaDeAgendamentos onAgendar={() => setAba('agendar')} />
        )}
      </main>

      <footer className="border-t border-stone-300 px-4 py-6 md:px-10">
        <p className="font-mono text-xs tracking-widest text-stone-500 uppercase">
          Horários no fuso de Brasília · America/Sao_Paulo
        </p>
      </footer>
    </div>
  );
}
