import { describe, expect, it } from 'vitest';
import { clasificarConCatalogo, type CatalogoRow } from './clasificar.js';

const catalogo: CatalogoRow[] = [
  { variante: 'cancelado', resultado_normalizado: 'cancelado', clasificacion: 'APTA' },
  { variante: 'cancelada', resultado_normalizado: 'cancelado', clasificacion: 'APTA' },
  { variante: 'retenido', resultado_normalizado: 'retenido', clasificacion: 'APTA' },
  { variante: 'cancelado + venta', resultado_normalizado: 'cancelado + venta', clasificacion: 'APTA' },
  { variante: 'cancelada + venta', resultado_normalizado: 'cancelado + venta', clasificacion: 'APTA' },
  { variante: 'no apto', resultado_normalizado: 'no apto', clasificacion: 'NO APTA' },
];

describe('clasificarConCatalogo', () => {
  it('APTA directo', () => {
    expect(clasificarConCatalogo('Cancelado', catalogo)).toEqual({
      resultado_normalizado: 'cancelado',
      clasificacion: 'APTA',
      sinMapear: false,
    });
  });

  it('APTA por alias + normalizacion', () => {
    expect(clasificarConCatalogo('CANCELADA +VENTA', catalogo).clasificacion).toBe('APTA');
  });

  it('desconocido -> NO APTA + sinMapear', () => {
    expect(clasificarConCatalogo('Algo nuevo', catalogo)).toEqual({
      resultado_normalizado: 'algo nuevo',
      clasificacion: 'NO APTA',
      sinMapear: true,
    });
  });

  it('nulo -> NO APTA sin flag', () => {
    expect(clasificarConCatalogo(null, catalogo).clasificacion).toBe('NO APTA');
  });
});
