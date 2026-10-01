import { describe, expect, it } from 'vitest';
import { normalizarAseguradora, normalizarProducto } from './productos.js';

describe('normalizarProducto', () => {
  it.each([
    ['PRACTISEGURO', 'PRACTISEGURO'],
    ['practiseguro plus', 'PRACTISEGURO'],
    ['MASCOTAS', 'MASCOTA'],
    ['Seguro protector', 'SEGURO PROTECTOR'],
    ['futuro protegido', 'FUTURO PROTEGIDO'],
    ['FUTURO PROTEGIDO  PLUS', 'FUTURO PROTEGIDO PLUS'],
    ['SEGURO FUENRARIO', 'SEGURO FUNERARIO'],
    ['3148743929', 'SIN REGISTRO'],
    [null, 'SIN REGISTRO'],
    ['OJO SE CALLO LLAMADA', 'SIN REGISTRO'],
    ['CARDIS', 'OTROS'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizarProducto(input)).toBe(expected);
  });
});

describe('normalizarAseguradora', () => {
  it.each([
    ['Seguros Alfa S.A.', 'ALFA'],
    ['HDI SEGUROS COLOMBIA S.A', 'HDI'],
    ['CIA SURAMERICANA DE SEGUROS DE VIDA', 'SURAMERICANA'],
    ['Gnp', 'NO APLICA'],
    [null, 'SIN REGISTRO'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizarAseguradora(input)).toBe(expected);
  });
});
