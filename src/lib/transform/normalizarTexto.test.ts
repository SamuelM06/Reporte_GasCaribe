import { describe, expect, it } from 'vitest';
import { normalizarTexto } from './normalizarTexto.js';

describe('normalizarTexto', () => {
  it.each([
    ['Cancelado', 'cancelado'],
    ['cancelada', 'cancelada'],
    ['cancelao+venta', 'cancelao + venta'],
    ['RETENIDA', 'retenida'],
    ['Cancelado + Venta', 'cancelado + venta'],
    ['CANCELADO +VENTA', 'cancelado + venta'],
    ['RETENIDO ', 'retenido'],
    ['Cancelación Previa', 'cancelacion previa'],
    ['  espacios   dobles  ', 'espacios dobles'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizarTexto(input)).toBe(expected);
  });

  it('null -> null', () => {
    expect(normalizarTexto(null)).toBeNull();
  });
});
