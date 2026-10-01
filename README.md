# Gestion_Caribe

Mega-proyecto ETL multi-gasera. Gasera inicial: **GasCaribe (Gases del Caribe)**.

## Orden de ejecucion

1. **Plan 01 — ETL BD:** `context/Plan_01_ETL_BD.md` (primero, solo base de datos)
2. **Plan 02 — Proyecto + Backend:** `context/Plan_02_Proyecto_Backend.md` (despues, Astro + API)
3. **Plan 03 — Front:** pendiente (indicadores y graficas)

## Seguridad

- Secretos solo en `.env` (privado, nunca al repo). Ver `.env.example`.
- Links de SharePoint con token solo en `.env` (`EXCEL_INBOUND_URL`, `EXCEL_OUTBOUND_URL`).
- `data/raw/` y `backups/` ignorados por git.
- `public/` solo estaticos publicos.

## Estructura

- `context/` → toda la documentacion (.md) + Bitacora
- `scripts/etl/` → carga Excel → Postgres
- `src/gaseras/GasCaribe/` → config de la gasera (Plan 02)
- `src/lib/` → db + transformaciones (Plan 02)

## Inicio rapido Plan 01

1. Copiar `.env.example` → `.env` y llenar.
2. Descargar Excel a `data/raw/GasCaribe/`.
3. `pg_dump -n gestion_diaria` a `backups/` antes de tocar nada.
4. Seguir `context/Plan_01_ETL_BD.md` Fase 0→5.

## Plan 02 — Backend (Astro + API, estado: funcionando)

Requiere Node 22+ y `.env` con `DB_USER_READ`/`DB_PASSWORD_READ` (solo lectura).

```bash
npm install
npm test        # 17 pruebas unitarias (normalizar, clasificar, franjas)
npm run dev     # http://localhost:4321
npm run build   # compilado standalone (Docker)
```

Docker: `docker compose up --build` (usa `.env`, expone 4321).

Endpoints (`:gasera` validada contra `registry.ts`):

- `GET /api/health`
- `GET /api/:gasera/clasificacion/resumen?anio=2026&mes=9`
- `GET /api/:gasera/clasificacion/resultados`
- `GET /api/:gasera/abandono/franjas`
- `GET /api/:gasera/inbound/mensual`
- `GET /api/:gasera/outbound/mensual`
- `GET /api/:gasera/calidad/sin-mapear`

Nueva gasera: `npm run nueva-gasera -- --nombre=X --prefijo=x` + SQL que imprime.
Nota: el servidor Postgres exige SSL (pool lo activa; `DB_SSL=off` para local).
