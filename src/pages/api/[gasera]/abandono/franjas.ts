import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';

// GET /api/:gasera/abandono/franjas -> abandono por franja horaria y mes
export const GET: APIRoute = async ({ params }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return Response.json({ error: 'gasera no registrada' }, { status: 404 });
  const rows = await query(
    `SELECT mes, hora, franja_label, SUM(abandonos)::int AS abandonos
     FROM ${qid('v_caribe_abandono_franja')}
     GROUP BY 1, 2, 3 ORDER BY 1, 2`,
  );
  // TODO multi-gasera: derivar el nombre de la vista desde config (fase Plan 03).
  // Por ahora solo GasCaribe tiene v_caribe_abandono_franja.
  if (cfg.codigo !== 'GasCaribe') return Response.json({ error: 'sin vista de franjas para esta gasera' }, { status: 404 });
  return Response.json(rows);
};
