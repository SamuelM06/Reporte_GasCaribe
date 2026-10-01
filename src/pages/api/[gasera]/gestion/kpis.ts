import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros, whereGestion } from '../../../../lib/api/filtros.js';

// Total Retenciones = retenido + cancelado + venta. % Retencion = retenciones / aptos.
const RET = `resultado_normalizado IN ('retenido', 'cancelado + venta')`;

// GET /api/:gasera/gestion/kpis -> KPIs con filtros
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');

  const w1 = whereGestion(f, '', 1);
  const w2 = whereGestion(f, '', w1.params.length + 1);
  const rows = await query(
    `SELECT
       COUNT(*)::int AS total_general,
       COUNT(*) FILTER (WHERE src = 'in')::int AS inbound,
       COUNT(*) FILTER (WHERE src = 'out')::int AS outbound,
       COUNT(*) FILTER (WHERE clasificacion = 'APTA')::int AS aptas,
       COUNT(*) FILTER (WHERE clasificacion = 'NO APTA')::int AS no_aptas,
       COUNT(*) FILTER (WHERE ${RET})::int AS retenciones,
       ROUND(COALESCE(COUNT(*) FILTER (WHERE ${RET})::numeric / NULLIF(COUNT(*) FILTER (WHERE clasificacion = 'APTA'), 0), 0), 4)::float AS pct_retencion
     FROM (
       SELECT 'in' AS src, clasificacion, resultado_normalizado FROM ${qid(cfg.tablas.inbound)} ${w1.where}
       UNION ALL
       SELECT 'out', clasificacion, resultado_normalizado FROM ${qid(cfg.tablas.outbound)} ${w2.where}
     ) u`,
    [...w1.params, ...w2.params],
  );
  const ab = await query(
    `SELECT COUNT(DISTINCT telefono)::int AS unicos FROM ${qid(cfg.tablas.abandono)} WHERE telefono IS NOT NULL`,
  );
  return json({ ...(rows[0] as object), abandono_unicos: (ab[0] as { unicos: number }).unicos });
};
