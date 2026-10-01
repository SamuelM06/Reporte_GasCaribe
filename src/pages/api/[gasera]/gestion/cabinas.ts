import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros, whereGestion } from '../../../../lib/api/filtros.js';

// Cabina = operador (cabina viene vacia del Excel). Dona por cabina.
// GET /api/:gasera/gestion/cabinas
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');
  const { cabina: _omit, ...sinCab } = f;
  void _omit;
  const w1 = whereGestion(sinCab, '', 1);
  const w2 = whereGestion(sinCab, '', w1.params.length + 1);
  const rows = await query(
    `SELECT COALESCE(operador, 'SIN REGISTRO') AS cabina, COUNT(*)::int AS n FROM (
       SELECT operador FROM ${qid(cfg.tablas.inbound)} ${w1.where}
       UNION ALL
       SELECT operador FROM ${qid(cfg.tablas.outbound)} ${w2.where}
     ) u GROUP BY 1 ORDER BY 2 DESC`,
    [...w1.params, ...w2.params],
  );
  return json(rows);
};
