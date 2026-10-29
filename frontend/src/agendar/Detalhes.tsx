import { rotulo } from '../comum/estilos.ts';

export function Detalhes({ itens }: { itens: [string, string][] }) {
  return (
    <dl className="divide-y divide-stone-300 border-y border-stone-300">
      {itens.map(([termo, valor]) => (
        <div
          key={termo}
          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3"
        >
          <dt className={rotulo}>{termo}</dt>
          <dd className="text-right">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
