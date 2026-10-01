import type { APIRoute } from 'astro';
import { query } from '../../lib/db/pool.js';

export const GET: APIRoute = async () => {
  try {
    await query('SELECT 1');
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: 'DB no disponible' }, { status: 500 });
  }
};
