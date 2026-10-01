import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros, orderMeses, whereGestion } from '../../../../lib/api/filtros.js';

// GET /api/:gasera/gestion/detalle?clase=apta|noapta -> resultado x mes
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const clase = url.searchParams.get('clase');
  if (clase !== 'apta' && clase !== 'noapta') return bad('clase debe ser apta|noapta');
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');
  const want = clase === 'apta' ? 'APTA' : 'NO APTA';
  const w1 = whereGestion({ ...f, clasificacion: want }, '', 1);
  const w2 = whereGestion({ ...f, clasificacion: want }, '', w1.params.length + 1);
  const rows = await query(
    `SELECT resultado_normalizado, anio, mes, COUNT(*)::int AS n FROM (
       SELECT resultado_normalizado, anio, mes FROM ${qid(cfg.tablas.inbound)} ${w1.where}
       UNION ALL
       SELECT resultado_normalizado, anio, mes FROM ${qid(cfg.tablas.outbound)} ${w2.where}
     ) u GROUP BY 1, 2, 3 ORDER BY 4 DESC, 2, ${orderMeses()}`,
    [...w1.params, ...w2.params],
  );
  return json(rows);
};
