export const normalizarNome = (nome: string) => nome.trim().replace(/\s+/g, ' ');

export function validarNome(nome: string) {
  const normalizado = normalizarNome(nome);
  if (normalizado.length < 3) return 'Informe o nome do paciente (pelo menos 3 letras).';
  if (normalizado.length > 120) return 'O nome pode ter no máximo 120 caracteres.';
  return null;
}
