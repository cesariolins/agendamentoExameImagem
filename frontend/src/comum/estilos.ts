export const rotulo = 'text-xs font-mono uppercase tracking-widest text-stone-500';

export const campo =
  'w-full rounded-md border border-stone-300 bg-white/60 px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-900 focus:bg-white aria-[invalid=true]:border-red-700';

export const botaoPrimario =
  'inline-flex items-center justify-center gap-2 rounded-md bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60';

export const botaoSecundario =
  'inline-flex items-center justify-center gap-2 rounded-full border border-stone-900 px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition-colors hover:bg-stone-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60';

export const opcao = (selecionada: boolean) =>
  `transition-colors ${selecionada ? 'bg-stone-900 text-white' : 'bg-papel hover:bg-white'}`;

export const grade = 'grid gap-px border border-stone-300 bg-stone-300';
