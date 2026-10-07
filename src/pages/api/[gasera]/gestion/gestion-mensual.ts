import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros, orderMeses, whereInbound, whereOutbound } from '../../../../lib/api/filtros.js';

const RET = `resultado_normalizado IN ('retenido', 'cancelado + venta')`;

// GET /api/:gasera/gestion/gestion-mensual -> tabla Mes|registros|aptos|noaptos|canc_venta|retenido|retenciones|pct
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');
  const partes: string[] = [];
  const args: unknown[] = [];
  if (!f.cabina || f.cabina === 'in') {
    const w = whereInbound(f, '', args.length + 1);
    partes.push(`SELECT anio, mes, clasificacion, resultado_normalizado FROM ${qid(cfg.tablas.inbound)} ${w.where}`);
    args.push(...w.params);
  }
  if (!f.cabina || f.cabina === 'out') {
    const w = whereOutbound(f, '', args.length + 1);
    partes.push(`SELECT anio, mes, clasificacion, resultado_normalizado FROM ${qid(cfg.tablas.outbound)} ${w.where}`);
    args.push(...w.params);
  }
  const rows = await query(
    `SELECT anio, mes,
       COUNT(*)::int AS registros,
       COUNT(*) FILTER (WHERE clasificacion='APTA')::int AS aptos,
       COUNT(*) FILTER (WHERE clasificacion='NO APTA')::int AS no_aptos,
       COUNT(*) FILTER (WHERE resultado_normalizado='cancelado + venta')::int AS canc_venta,
       COUNT(*) FILTER (WHERE resultado_normalizado='retenido')::int AS retenido,
       COUNT(*) FILTER (WHERE ${RET})::int AS retenciones,
       ROUND(COALESCE(COUNT(*) FILTER (WHERE ${RET})::numeric / NULLIF(COUNT(*) FILTER (WHERE clasificacion='APTA'),0),0),4)::float AS pct_retencion
     FROM (${partes.join(' UNION ALL ')}) u GROUP BY 1, 2 ORDER BY 1, ${orderMeses()}`,
    args,
  );
  return json(rows);
};
