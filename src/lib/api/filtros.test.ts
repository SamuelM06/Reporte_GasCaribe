import { describe, expect, it } from 'vitest';
import { whereAbandono, whereGestion } from './filtros.js';

describe('whereGestion placeholders', () => {
  it('primera condicion es $1', () => {
    const w = whereGestion({ anio: 2026 }, '', 1);
    expect(w.where).toContain('anio = $1');
    expect(w.params).toEqual([2026]);
  });

  it('dos filtros + segunda rama continua numeracion', () => {
    const w1 = whereGestion({ anio: 2026, mesNombre: 'SEPTIEMBRE' }, '', 1);
    expect(w1.where).toContain('$1');
    expect(w1.where).toContain('$2');
    const w2 = whereGestion({ anio: 2026, mesNombre: 'SEPTIEMBRE' }, '', w1.params.length + 1);
    expect(w2.where).toContain('$3');
    expect(w2.where).toContain('$4');
  });

  it('whereAbandono numera desde base', () => {
    const w = whereAbandono({ anio: 2026, mesNombre: 'SEPTIEMBRE' }, '', 1);
    expect(w.params).toEqual([2026, 9]);
    expect(w.where).toContain('$1');
    expect(w.where).toContain('$2');
  });
});
