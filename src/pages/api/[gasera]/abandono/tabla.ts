import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros } from '../../../../lib/api/filtros.js';

// GET /api/:gasera/abandono/tabla -> por mes: unicos, duplicados, gestionados, no_gestionados, pcts
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');
  const conds: string[] = [];
  const p: unknown[] = [];
  if (f.anio !== undefined) {
    p.push(f.anio);
    conds.push(`EXTRACT(YEAR FROM fecha_llamada) = $${p.length}`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const rows = await query(
    `SELECT to_char(fecha_llamada, 'YYYY-MM') AS mes,
       COUNT(*)::int AS total,
       COUNT(DISTINCT telefono)::int AS unicos,
       (COUNT(*) - COUNT(DISTINCT telefono))::int AS duplicados,
       COUNT(DISTINCT telefono) FILTER (WHERE gestionado_inbound)::int AS gestionados,
       (COUNT(DISTINCT telefono) - COUNT(DISTINCT telefono) FILTER (WHERE gestionado_inbound))::int AS no_gestionados,
       ROUND(COALESCE(((COUNT(*) - COUNT(DISTINCT telefono)) + COUNT(DISTINCT telefono) FILTER (WHERE gestionado_inbound))::numeric / NULLIF(COUNT(*),0),0),4)::float AS pct_recuperacion,
       ROUND(COALESCE((COUNT(DISTINCT telefono) - COUNT(DISTINCT telefono) FILTER (WHERE gestionado_inbound))::numeric / NULLIF(COUNT(*),0),0),4)::float AS pct_abandono
     FROM ${qid(cfg.tablas.abandono)} ${where} GROUP BY 1 ORDER BY 1`,
    p,
  );
  return json(rows);
};
