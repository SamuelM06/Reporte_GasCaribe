import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';

// GET /api/:gasera/inbound/mensual -> registros por mes
export const GET: APIRoute = async ({ params }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return Response.json({ error: 'gasera no registrada' }, { status: 404 });
  const rows = await query(
    `SELECT mes, clasificacion, COUNT(*)::int AS n FROM ${qid(cfg.tablas.inbound)} GROUP BY 1, 2 ORDER BY 1, 2`,
  );
  return Response.json(rows);
};
