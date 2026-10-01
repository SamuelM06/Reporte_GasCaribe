import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros } from '../../../../lib/api/filtros.js';

// Mapa de calor: hora (0-23) x mes, solo UNICOS no gestionados.
// GET /api/:gasera/abandono/heatmap?anio=
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');
  const conds: string[] = ['telefono IS NOT NULL', 'gestionado_inbound = FALSE'];
  const p: unknown[] = [];
  if (f.anio !== undefined) {
    p.push(f.anio);
    conds.push(`EXTRACT(YEAR FROM fecha_llamada) = $${p.length}`);
  }
  const rows = await query(
    `SELECT to_char(fecha_llamada, 'YYYY-MM') AS mes,
       EXTRACT(HOUR FROM hora::time)::int AS hora,
       COUNT(*)::int AS n
     FROM (SELECT DISTINCT ON (telefono) telefono, fecha_llamada, hora
           FROM ${qid(cfg.tablas.abandono)} WHERE ${conds.join(' AND ')}
           ORDER BY telefono, fecha_llamada) u
     WHERE hora ~ '^[0-9]{1,2}:[0-9]{2}' AND fecha_llamada IS NOT NULL
     GROUP BY 1, 2 ORDER BY 1, 2`,
    p,
  );
  return json(rows);
};
