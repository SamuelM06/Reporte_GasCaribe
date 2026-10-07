import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';
import { bad, json } from '../../../../lib/api/respond.js';
import { orderMeses } from '../../../../lib/api/filtros.js';

// GET /api/:gasera/filtros/opciones -> meses, cabinas, clasificaciones, productos
export const GET: APIRoute = async ({ params }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return bad('gasera no registrada', 404);
  const meses = await query(
    `SELECT anio, mes FROM (
      SELECT DISTINCT anio, mes FROM (
        SELECT anio, mes FROM ${qid(cfg.tablas.inbound)}
        UNION
        SELECT anio, mes FROM ${qid(cfg.tablas.outbound)}
      ) d
    ) u ORDER BY 1, ${orderMeses()}`,
  );
  const cabinas = [{ cabina: 'in' }, { cabina: 'out' }];
  const productos = await query(
    `SELECT DISTINCT gestion_diaria.normalizar_producto(producto) AS producto FROM (SELECT producto FROM ${qid(cfg.tablas.inbound)} UNION ALL SELECT producto FROM ${qid(cfg.tablas.outbound)}) u WHERE gestion_diaria.normalizar_producto(producto) NOT IN ('SIN REGISTRO','OTROS') ORDER BY 1`,
  );
  return json({ meses, cabinas, clasificaciones: ['APTA', 'NO APTA'], productos });
};
