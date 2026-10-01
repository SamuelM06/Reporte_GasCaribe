import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';

// GET /api/:gasera/clasificacion/resultados -> conteo por resultado_normalizado
export const GET: APIRoute = async ({ params }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return Response.json({ error: 'gasera no registrada' }, { status: 404 });
  const rows = await query(
    `SELECT resultado_normalizado, clasificacion, COUNT(*)::int AS n FROM (
       SELECT resultado_normalizado, clasificacion FROM ${qid(cfg.tablas.inbound)}
       UNION ALL
       SELECT resultado_normalizado, clasificacion FROM ${qid(cfg.tablas.outbound)}
     ) u GROUP BY 1, 2 ORDER BY 3 DESC`,
  );
  return Response.json(rows);
};
