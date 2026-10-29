import { normalizarTexto } from './texto.js';

describe('normalizarTexto', () => {
  it('remove acentos, cedilha e caixa alta', () => {
    expect(normalizarTexto('Raio-X de Tórax')).toBe('raio-x de torax');
    expect(normalizarTexto('Ultrassonografia Obstétrica')).toBe('ultrassonografia obstetrica');
    expect(normalizarTexto('CORAÇÃO')).toBe('coracao');
  });

  it('apara espaços nas pontas', () => {
    expect(normalizarTexto('  Crânio ')).toBe('cranio');
  });
});
