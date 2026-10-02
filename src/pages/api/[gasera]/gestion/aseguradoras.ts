import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { leerFiltros, orderMeses, whereGestion } from '../../../../lib/api/filtros.js';

// GET /api/:gasera/gestion/aseguradoras -> aseguradora_norm x mes + total + pct
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const { f, error } = leerFiltros(url);
  if (error || !f) return bad(error ?? 'filtros invalidos');
  const partes: string[] = [];
  const args: unknown[] = [];
  if (!f.cabina || f.cabina === 'in') {
    const w = whereGestion(f, '', args.length + 1);
    partes.push(`SELECT gestion_diaria.normalizar_aseguradora(aseguradora) AS aseg, anio, mes FROM ${qid(cfg.tablas.inbound)} ${w.where}`);
    args.push(...w.params);
  }
  if (!f.cabina || f.cabina === 'out') {
    const w = whereGestion(f, '', args.length + 1);
    partes.push(`SELECT gestion_diaria.normalizar_aseguradora(aseguradora) AS aseg, anio, mes FROM ${qid(cfg.tablas.outbound)} ${w.where}`);
    args.push(...w.params);
  }
  const rows = await query(
    `SELECT aseg, anio, mes, COUNT(*)::int AS n FROM (${partes.join(' UNION ALL ')}) u GROUP BY 1, 2, 3 ORDER BY 4 DESC, 2, ${orderMeses()}`,
    args,
  );
  return json(rows);
};
