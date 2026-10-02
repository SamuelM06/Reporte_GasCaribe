import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros, orderMeses, whereGestion } from '../../../../lib/api/filtros.js';

// Tendencia de retenciones por cabina (origen in/out): lineas inbound vs outbound.
// GET /api/:gasera/gestion/retenciones-cabina
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');
  const partes: string[] = [];
  const args: unknown[] = [];
  if (!f.cabina || f.cabina === 'in') {
    const w = whereGestion(f, '', args.length + 1);
    partes.push(`SELECT 'in' AS src, anio, mes, operador, resultado_normalizado FROM ${qid(cfg.tablas.inbound)} ${w.where}`);
    args.push(...w.params);
  }
  if (!f.cabina || f.cabina === 'out') {
    const w = whereGestion(f, '', args.length + 1);
    partes.push(`SELECT 'out' AS src, anio, mes, operador, resultado_normalizado FROM ${qid(cfg.tablas.outbound)} ${w.where}`);
    args.push(...w.params);
  }
  const rows = await query(
    `SELECT anio, mes, COALESCE(operador,'SIN REGISTRO') AS cabina, src,
       COUNT(*) FILTER (WHERE resultado_normalizado IN ('retenido','cancelado + venta'))::int AS retenciones
     FROM (${partes.join(' UNION ALL ')}) u GROUP BY 1, 2, 3, 4 ORDER BY 1, ${orderMeses()}, 3, 4`,
    args,
  );
  return json(rows);
};
