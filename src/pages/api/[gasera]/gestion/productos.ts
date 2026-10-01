import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros, whereGestion } from '../../../../lib/api/filtros.js';

// GET /api/:gasera/gestion/productos -> top productos normalizados
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');
  const { producto: _omit, ...sinProd } = f;
  void _omit;
  const w1 = whereGestion(sinProd, '', 1);
  const w2 = whereGestion(sinProd, '', w1.params.length + 1);
  const rows = await query(
    `SELECT prod AS producto, COUNT(*)::int AS n FROM (
       SELECT gestion_diaria.normalizar_producto(producto) AS prod FROM ${qid(cfg.tablas.inbound)} ${w1.where}
       UNION ALL
       SELECT gestion_diaria.normalizar_producto(producto) FROM ${qid(cfg.tablas.outbound)} ${w2.where}
     ) u GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
    [...w1.params, ...w2.params],
  );
  return json(rows);
};
