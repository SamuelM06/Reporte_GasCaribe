import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros, whereAbandono } from '../../../../lib/api/filtros.js';

// % Recuperacion = (duplicados + gestionados_unicos) / total
// % Abandono real = no_gestionados_unicos / total
// GET /api/:gasera/abandono/kpis?anio=&mes=
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');
  const w = whereAbandono(f);
  const rows = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(DISTINCT telefono)::int AS unicos,
       (COUNT(*) - COUNT(DISTINCT telefono))::int AS duplicados,
       COUNT(DISTINCT telefono) FILTER (WHERE gestionado_inbound)::int AS gestionados,
       (COUNT(DISTINCT telefono) - COUNT(DISTINCT telefono) FILTER (WHERE gestionado_inbound))::int AS no_gestionados,
       ROUND(COALESCE(((COUNT(*) - COUNT(DISTINCT telefono)) + COUNT(DISTINCT telefono) FILTER (WHERE gestionado_inbound))::numeric / NULLIF(COUNT(*),0),0),4)::float AS pct_recuperacion,
       ROUND(COALESCE((COUNT(DISTINCT telefono) - COUNT(DISTINCT telefono) FILTER (WHERE gestionado_inbound))::numeric / NULLIF(COUNT(*),0),0),4)::float AS pct_abandono
     FROM ${qid(cfg.tablas.abandono)} ${w.where}`,
    w.params,
  );
  return json(rows[0] ?? {});
};
