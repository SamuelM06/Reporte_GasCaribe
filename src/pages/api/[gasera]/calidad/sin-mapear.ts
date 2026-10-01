import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';

// GET /api/:gasera/calidad/sin-mapear -> valores de resultado sin clasificar
export const GET: APIRoute = async ({ params }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return Response.json({ error: 'gasera no registrada' }, { status: 404 });
  if (cfg.codigo !== 'GasCaribe') return Response.json({ error: 'sin vista de calidad para esta gasera' }, { status: 404 });
  const rows = await query(`SELECT valor, origen FROM ${qid('v_valores_sin_mapear')} ORDER BY 1`);
  return Response.json(rows);
};
