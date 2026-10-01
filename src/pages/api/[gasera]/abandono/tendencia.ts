import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros, orderMeses, whereAbandono } from '../../../../lib/api/filtros.js';

// GET /api/:gasera/abandono/tendencia?anio=&mes=
// Sin ?mes=: por mes. Con ?mes=: drilldown por dia (animado).
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');
  const drill = url.searchParams.get('mes') != null;
  const w = whereAbandono(f);
  const grano = drill ? 'fecha_llamada::text AS periodo' : `to_char(fecha_llamada, 'YYYY-MM') AS periodo`;
  const orden = drill ? 'periodo' : 'periodo';
  const rows = await query(
    `SELECT ${grano},
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE gestionado_inbound)::int AS gestionados,
       ROUND(COALESCE(COUNT(*) FILTER (WHERE gestionado_inbound)::numeric / NULLIF(COUNT(*),0),0),4)::float AS pct_recuperacion,
       ROUND(COALESCE((COUNT(*) - COUNT(*) FILTER (WHERE gestionado_inbound))::numeric / NULLIF(COUNT(*),0),0),4)::float AS pct_abandono
     FROM ${qid(cfg.tablas.abandono)} ${w.where} GROUP BY 1 ORDER BY ${orden}`,
    w.params,
  );
  void orderMeses;
  return json({ drill, rows });
};
