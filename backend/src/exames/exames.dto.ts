import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BuscaDeExamesDto {
  @ApiPropertyOptional({
    description:
      'Trecho do nome do exame, sem diferenciar maiúsculas nem acentos. Vazio lista todos.',
    example: 'torax',
  })
  @IsOptional()
  @IsString({ message: 'busca deve ser um texto.' })
  @MaxLength(100, { message: 'busca deve ter no máximo 100 caracteres.' })
  busca?: string;
}

export class ExameResposta {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Raio-X de Tórax' })
  nome: string;

  @ApiProperty({ description: 'Duração que o exame ocupa na agenda', example: 20 })
  duracaoMinutos: number;
}
