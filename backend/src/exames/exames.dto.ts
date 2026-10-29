import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BuscaDeExamesDto {
  /**
   * Trecho do nome do exame, sem diferenciar maiúsculas nem acentos. Vazio lista todos.
   * @example "torax"
   */
  @IsOptional()
  @IsString({ message: 'busca deve ser um texto.' })
  @MaxLength(100, { message: 'busca deve ter no máximo 100 caracteres.' })
  busca?: string;
}

export class ExameResposta {
  /** @example 1 */
  id: number;
  /** @example "Raio-X de Tórax" */
  nome: string;
  /**
   * Duração que o exame ocupa na agenda
   * @example 20
   */
  duracaoMinutos: number;
}
