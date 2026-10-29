/** Minúsculas, sem acentos e sem espaços nas pontas: "  Tórax " → "torax". */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
