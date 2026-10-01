import { Pool } from 'pg';
import 'dotenv/config';

const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER_READ', 'DB_PASSWORD_READ'] as const;

for (const k of required) {
  if (!process.env[k]) throw new Error(`Falta variable de entorno ${k} (ver .env.example)`);
}

const schema = process.env.DB_SCHEMA ?? 'gestion_diaria';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER_READ,
  password: process.env.DB_PASSWORD_READ,
  max: 10,
  // El servidor exige SSL (pg_hba). Desactivar solo con DB_SSL=off.
  ssl: process.env.DB_SSL === 'off' ? undefined : { rejectUnauthorized: false },
});

// Nombres de tabla/vista solo desde config whitelisteada (nunca del query string).
export function qid(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`Identificador SQL invalido: ${name}`);
  return `"${schema}"."${name}"`;
}

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const { rows } = await pool.query(text, params);
  return rows as T[];
}
