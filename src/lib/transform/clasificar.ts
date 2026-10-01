import { normalizarTexto } from './normalizarTexto.js';

export interface CatalogoRow {
  variante: string;
  resultado_normalizado: string;
  clasificacion: 'APTA' | 'NO APTA';
}

export interface ClasificacionResult {
  resultado_normalizado: string | null;
  clasificacion: 'APTA' | 'NO APTA';
  sinMapear: boolean;
}

// Pura (testeable sin BD): resuelve contra filas de catalogo ya cargadas.
export function clasificarConCatalogo(
  resultado: string | null | undefined,
  catalogo: CatalogoRow[],
): ClasificacionResult {
  const norm = normalizarTexto(resultado);
  if (norm == null) return { resultado_normalizado: null, clasificacion: 'NO APTA', sinMapear: false };
  const hit = catalogo.find((r) => r.variante === norm);
  if (!hit) return { resultado_normalizado: norm, clasificacion: 'NO APTA', sinMapear: true };
  return { resultado_normalizado: hit.resultado_normalizado, clasificacion: hit.clasificacion, sinMapear: false };
}
