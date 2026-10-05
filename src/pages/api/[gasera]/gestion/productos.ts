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
  const partes: string[] = [];
  const args: unknown[] = [];
  if (!f.cabina || f.cabina === 'in') {
    const w = whereGestion(sinProd, '', args.length + 1);
    partes.push(`SELECT gestion_diaria.normalizar_producto(producto) AS prod FROM ${qid(cfg.tablas.inbound)} ${w.where}`);
    args.push(...w.params);
  }
  if (!f.cabina || f.cabina === 'out') {
    const w = whereGestion(sinProd, '', args.length + 1);
    partes.push(`SELECT gestion_diaria.normalizar_producto(producto) AS prod FROM ${qid(cfg.tablas.outbound)} ${w.where}`);
    args.push(...w.params);
  }
  const rows = await query(
    `SELECT prod AS producto, COUNT(*)::int AS n FROM (${partes.join(' UNION ALL ')}) u WHERE prod NOT IN ('SIN REGISTRO','OTROS') GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
    args,
  );
  return json(rows);
};
