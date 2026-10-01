import { pool, qid } from './db/pool.js';
import type { CatalogoRow } from './transform/clasificar.js';

// Catalogo cacheado 5 min por gasera.
const cache = new Map<string, { at: number; rows: CatalogoRow[] }>();

export async function loadCatalogo(gasera: string): Promise<CatalogoRow[]> {
  const hit = cache.get(gasera);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.rows;
  const { rows } = await pool.query(
    `SELECT variante, resultado_normalizado, clasificacion FROM ${qid('clasificacion')} WHERE gasera = $1`,
    [gasera],
  );
  const typed = rows as CatalogoRow[];
  cache.set(gasera, { at: Date.now(), rows: typed });
  return typed;
}
