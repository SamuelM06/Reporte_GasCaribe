import type { APIRoute } from 'astro';
import { getGasera } from '../../../../gaseras/registry.js';
import { qid, query } from '../../../../lib/db/pool.js';

const MESES_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

// GET /api/:gasera/clasificacion/resumen?anio=&mes= -> APTA vs NO APTA por mes
export const GET: APIRoute = async ({ params, url }) => {
  const cfg = getGasera(params.gasera ?? '');
  if (!cfg) return Response.json({ error: 'gasera no registrada' }, { status: 404 });

  const anioRaw = url.searchParams.get('anio');
  const mesRaw = url.searchParams.get('mes');
  let anio: number | undefined;
  let mesNombre: string | undefined;
  if (anioRaw != null) {
    const n = Number(anioRaw);
    if (!Number.isInteger(n)) return Response.json({ error: 'anio invalido' }, { status: 400 });
    anio = n;
  }
  if (mesRaw != null) {
    const n = Number(mesRaw);
    if (!Number.isInteger(n) || n < 1 || n > 12) {
      return Response.json({ error: 'mes invalido (1-12)' }, { status: 400 });
    }
    mesNombre = MESES_ES[n - 1];
  }

  // La columna mes guarda 'SEPTIEMBRE 2026': filtramos por anio y por nombre de mes.
  // Cada rama del UNION necesita sus propios placeholders ($1..$n, $n+1..$2n).
  function buildWhere(base: number): { where: string; next: number } {
    const conds: string[] = [];
    let n = base;
    if (anio !== undefined) {
      conds.push(`anio = $${n}`);
      n += 1;
    }
    if (mesNombre !== undefined) {
      conds.push(`mes ILIKE $${n}`);
      n += 1;
    }
    return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', next: n };
  }
  const w1 = buildWhere(1);
  const w2 = buildWhere(w1.next);
  const args: unknown[] = [];
  if (anio !== undefined) args.push(anio);
  if (mesNombre !== undefined) args.push(`${mesNombre} %`);
  const allArgs = [...args, ...args];
  const orderCase = MESES_ES.map((m, i) => `WHEN split_part(mes, ' ', 1) = '${m}' THEN ${i + 1}`).join(' ');

  const rows = await query(
    `SELECT anio, mes, clasificacion, COUNT(*)::int AS n FROM (
       SELECT anio, mes, clasificacion FROM ${qid(cfg.tablas.inbound)} ${w1.where}
       UNION ALL
       SELECT anio, mes, clasificacion FROM ${qid(cfg.tablas.outbound)} ${w2.where}
     ) u GROUP BY 1, 2, 3 ORDER BY 1, CASE ${orderCase} ELSE 13 END, 3`,
    allArgs,
  );
  return Response.json(rows);
};
