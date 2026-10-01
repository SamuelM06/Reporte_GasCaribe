import { describe, expect, it } from 'vitest';
import { horaAFranja, horaStrAFranja } from './franjaHoraria.js';

describe('franjaHoraria', () => {
  it('10 en cualquiera de sus minutos -> 10 AM', () => {
    expect(horaStrAFranja('10:00:00')).toEqual({ hora: 10, label: '10 AM' });
    expect(horaStrAFranja('10:30:15')).toEqual({ hora: 10, label: '10 AM' });
    expect(horaStrAFranja('10:34:59')).toEqual({ hora: 10, label: '10 AM' });
  });

  it('formato 12h', () => {
    expect(horaAFranja(0)).toEqual({ hora: 0, label: '12 AM' });
    expect(horaAFranja(14)).toEqual({ hora: 14, label: '2 PM' });
    expect(horaAFranja(12)).toEqual({ hora: 12, label: '12 PM' });
  });

  it('nulo/invalido -> null', () => {
    expect(horaStrAFranja(null)).toBeNull();
    expect(horaStrAFranja('sin hora')).toBeNull();
  });
});
