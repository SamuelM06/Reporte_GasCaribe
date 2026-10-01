# Plan 02: Proyecto, Backend y Transformacion — Gestion_Caribe

> **Prerrequisito:** Plan 01 APROBADO (BD cargada ene–sep 2026 + clasificacion lista + `v_valores_sin_mapear` vacia).
> **Alcance:** crear proyecto Astro+React+TS, conexion segura a BD, backend de transformacion (normalizar, clasificar, franjas abandono) + endpoints. Front visual queda para Plan 03.
> **Gasera inicial:** GasCaribe. Arquitectura lista para 6 gaseras.

---
## 1. Stack y decisiones

| Tema | Decision |
|---|---|
| Framework | Astro con islas React (`.tsx` y `.jsx`) |
| Lenguaje | TypeScript en backend/lib; JS permitido en componentes |
| BD | PostgreSQL `DataCenter_Promigas`, esquema `gestion_diaria`, driver `pg`, conexion directa solo servidor |
| Ejecucion | Docker (`Dockerfile` + `docker-compose.yml`) |
| Secretos | Solo `.env` privado. `.env.example` en repo. Nada en codigo/docs/`public/` |
| Docs | Todo en `context/*.md` (raiz, NO dentro de `src/`) |
| Usuarios BD | `DB_USER_READ` (app, solo SELECT en vistas) + `DB_USER_ETL` (scripts, escritura). Nunca el navegador habla con Postgres. |

Principio: endpoints Astro server-side leen `.env`, consultan con SQL parametrizado, devuelven JSON. Credenciales jamas al cliente.

---
## 2. Estructura del proyecto (crear en Fase 1)

```
Gestion_Caribe/
├── .env / .env.example / .gitignore / README.md
├── Dockerfile / docker-compose.yml / astro.config.mjs / package.json / tsconfig.json
├── context/
│   ├── Plan_01_ETL_BD.md
│   ├── Plan_02_Proyecto_Backend.md
│   ├── Clasificacion.md
│   ├── Esquema_BD.md
│   ├── Diagnostico_Inicial.md
│   ├── Validacion_Carga.md
│   └── Bitacora.md
├── public/                 # solo estaticos publicos
├── data/raw/<Gasera>/      # git-ignored
├── backups/                # git-ignored
├── scripts/
│   ├── etl/                # del Plan 01
│   └── nueva-gasera.ts     # generador multi-gasera
└── src/
    ├── gaseras/
    │   ├── _template/
    │   ├── registry.ts
    │   └── GasCaribe/config.ts + queries.ts + transform.ts
    ├── lib/db/pool.ts
    ├── lib/transform/normalizarTexto.ts + clasificar.ts + franjaHoraria.ts
    ├── lib/types/
    ├── pages/api/[gasera]/...
    ├── components/         # se usa en Plan 03
    └── layouts/
```

`.env.example` (Fase 1):

```ini
DB_HOST=
DB_PORT=
DB_NAME=
DB_SCHEMA=
DB_USER_READ=
DB_PASSWORD_READ=
DB_USER_ETL=
DB_PASSWORD_ETL=
EXCEL_INBOUND_URL=
EXCEL_OUTBOUND_URL=
```

---
## 3. Multi-gasera (dia 1, sin duplicar codigo)

`src/gaseras/GasCaribe/config.ts`:

```ts
export default {
  codigo: 'GasCaribe', // = columna gasera en tabla clasificacion
  nombre: 'Gases del Caribe',
  tablas: { inbound: 'caribe_inbound', outbound: 'caribe_outbound', abandono: 'caribe_abandono' },
  vistas: { inbound: 'v_caribe_inbound_clasificado', outbound: 'v_caribe_outbound_clasificado' },
  excel: { inbound: 'EXCEL_INBOUND_URL', outbound: 'EXCEL_OUTBOUND_URL' },
};
```

`src/gaseras/registry.ts`: lista de gaseras activas. Endpoints reciben `:gasera` y cargan su config. Si gasera no registrada → 404.

`scripts/nueva-gasera.ts` — uso: `npm run nueva-gasera -- --nombre=Otra --prefijo=otra --inboundUrl=... --outboundUrl=...`

Hace:

1. Copia `src/gaseras/_template/` → `src/gaseras/<Nueva>/` con prefijo sustituido.
2. Crea `data/raw/<Nueva>/`.
3. Inserta en `gestion_diaria.clasificacion` (UNICA tabla) las 4 canonicas APTA (`cancelado`, `retenido`, `cancelado + reintegro`, `cancelado + venta`) con `gasera='<Nueva>'`. Resto = NO APTA por defecto. No crea tabla de gasera ni tabla nueva.
4. Registra en `registry.ts` + seccion en `Bitacora.md`.

---
## 4. Fases de ejecucion

### Fase 1 — Crear proyecto (1 dia)

1. `npm create astro@latest Gestion_Caribe -- --template minimal --typescript strict`, integrar `react`.
2. Crear arbol anterior, `.gitignore`, `.env.example`, `README.md`, `Dockerfile`, `docker-compose.yml`.
3. Copiar docs Plan 01 a `context/`. Crear `Bitacora.md` y registrar.
4. Verificar: `npm run dev` levanta, `docker compose up --build` levanta, repo sin secretos (`grep -r PASSWORD --exclude-dir=node_modules .` vacio).

### Fase 2 — Conexion BD (solo servidor)

`src/lib/db/pool.ts`:

- Lee solo `.env` (`DB_HOST/PORT/NAME/SCHEMA/USER_READ/PASSWORD_READ`).
- Falla con mensaje claro si falta var.
- Pool `pg`, `max: 10`, `ssl` segun entorno.
- Helper `query(text, params)` — siempre parametrizado, jamas concatenar.

`GET /api/health`: `SELECT 1`, devuelve `{ok:true}` sin datos sensibles. Prueba con ambos usuarios.

Permisos SQL sugeridos:

```sql
GRANT USAGE ON SCHEMA gestion_diaria TO app_read;
GRANT SELECT ON gestion_diaria.v_caribe_inbound_clasificado, gestion_diaria.v_caribe_outbound_clasificado, gestion_diaria.v_caribe_abandono_franja, gestion_diaria.clasificacion TO app_read;
```

### Fase 3 — Backend de transformacion

#### 3.1 Normalizacion `src/lib/transform/normalizarTexto.ts`

Replica exacta de `normalizar_texto()` SQL del Plan 01: minusculas, sin tildes, colapsar espacios, `+` → ` + `. Pruebas: `Cancelada→cancelada`, `cancelao+venta→cancelao + venta`, `RETENIDA→retenida`, `Cancelado + Venta→cancelado + venta`.

#### 3.2 Clasificacion `src/lib/transform/clasificar.ts`

`clasificar(gasera, resultado) → {resultado_normalizado, clasificacion}`. Lee la UNICA tabla BD `gestion_diaria.clasificacion(gasera, variante, resultado_normalizado, clasificacion)` cacheada en memoria 5 min. Join por `variante = normalizarTexto(resultado)`. APTA = 4 canonicos; resto NO APTA; desconocido = NO APTA + flag `sinMapear:true`.

#### 3.3 Abandono por franja `src/lib/transform/franjaHoraria.ts` + vista SQL

Regla: agrupar por hora en punto — 10:00, 10:30, 10:34 → `10 AM`. Funcion `horaAFranja(hora:0-23) → {hora, label}` (`10 AM`, `2 PM`).

```sql
CREATE OR REPLACE VIEW gestion_diaria.v_caribe_abandono_franja AS
SELECT date_trunc('month', fecha_abandono)::date AS mes,
  EXTRACT(HOUR FROM hora_abandono)::int AS hora,
  CASE WHEN EXTRACT(HOUR FROM hora_abandono)::int % 12 = 0 THEN 12 ELSE EXTRACT(HOUR FROM hora_abandono)::int % 12 END
    || CASE WHEN EXTRACT(HOUR FROM hora_abandono)::int < 12 THEN ' AM' ELSE ' PM' END AS franja_label,
  COUNT(*) AS abandonos
FROM gestion_diaria.caribe_abandono
GROUP BY 1,2,3 ORDER BY 1,2;
-- ajustar nombres de columnas fecha/hora reales segun Esquema_BD.md
```

Objetivo: responder "¿a que horas hay mas abandono?".

#### 3.4 Endpoints (todos `GET /api/:gasera/...?anio=2026&mes=1-9`)

| Endpoint | Devuelve |
|---|---|
| `/clasificacion/resumen` | APTA vs NO APTA por mes (inbound y outbound) |
| `/clasificacion/resultados` | conteo por `resultado_normalizado` |
| `/abandono/franjas` | abandono por franja horaria + mes |
| `/inbound/mensual` | registros inbound por mes |
| `/outbound/mensual` | registros outbound por mes |
| `/calidad/sin-mapear` | valores sin clasificar |

Validar `:gasera` contra `registry.ts`. Filtros `anio/mes` validados como enteros, pasados como parametros SQL.

### Fase 4 — Documentacion y calidad

- Cada paso en `context/Bitacora.md` (fecha, que, decision).
- `README.md`: requisitos, `.env`, Docker, ETL, agregar gasera.
- Tests unitarios: `normalizarTexto.test.ts`, `clasificar.test.ts`, `franjaHoraria.test.ts` (`npm test` en verde).
- Auditoria final: `grep` secretos vacio, `public/` sin xlsx/csv/env, `docker compose up` + `curl /api/health` + 1 endpoint GasCaribe OK.

### Fase 5 — Front (Plan 03, fuera de este plan)

Cuando definas indicadores/graficas, se arma Plan 03 con componentes React sobre endpoints 3.4.

---
## 5. Entregables Plan 02

- [ ] Proyecto levanta local + Docker
- [ ] `.env` privado, `.env.example`, `.gitignore`, `README.md`
- [ ] Conexion solo servidor, 2 usuarios, `/api/health` OK
- [ ] `normalizarTexto`, `clasificar`, `franjaHoraria` + tests verdes + vista `v_caribe_abandono_franja`
- [ ] 6 endpoints funcionando para GasCaribe con filtros mes/anio
- [ ] `scripts/nueva-gasera.ts` probado (dry-run)
- [ ] `Bitacora.md` al dia, cero secretos en repo

## 6. Orden total recomendado

1. Ejecutar Plan 01 Fases 0→5 (termina con BD = Excel + clasificacion).
2. Recien entonces Plan 02 Fases 1→4.
3. Plan 03 (front) solo cuando pidas indicadores.
