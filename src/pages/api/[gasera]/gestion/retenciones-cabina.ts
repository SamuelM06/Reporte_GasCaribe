import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros, orderMeses, whereGestion } from '../../../../lib/api/filtros.js';

// Tendencia de retenciones por cabina (=operador): lineas inbound vs outbound.
// GET /api/:gasera/gestion/retenciones-cabina
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');
  const w1 = whereGestion(f, '', 1);
  const w2 = whereGestion(f, '', w1.params.length + 1);
  const rows = await query(
    `SELECT anio, mes, COALESCE(operador,'SIN REGISTRO') AS cabina, src,
       COUNT(*) FILTER (WHERE resultado_normalizado IN ('retenido','cancelado + venta'))::int AS retenciones
     FROM (
       SELECT 'in' AS src, anio, mes, operador, resultado_normalizado FROM ${qid(cfg.tablas.inbound)} ${w1.where}
       UNION ALL
       SELECT 'out', anio, mes, operador, resultado_normalizado FROM ${qid(cfg.tablas.outbound)} ${w2.where}
     ) u GROUP BY 1, 2, 3, 4 ORDER BY 1, ${orderMeses()}, 3, 4`,
    [...w1.params, ...w2.params],
  );
  return json(rows);
};
