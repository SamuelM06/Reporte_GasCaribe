# Plan 01: ETL de Base de Datos — Gestion_Caribe / GasCaribe

> **Alcance estricto:** solo base de datos. Sin front, sin API.
> **Meta:** `gestion_diaria.caribe_inbound` y `caribe_outbound` truncadas y recargadas con TODOS los registros por mes enero–septiembre 2026 desde Excel, + `caribe_abandono` con septiembre, + 1 sola tabla nueva de clasificacion APTA/NO APTA.
> **Gasera:** GasCaribe (Gases del Caribe). Diseno multi-gasera desde dia 1.
> **Regla de seguridad:** links de SharePoint con token NUNCA van al repo. Solo en `.env` local como `EXCEL_INBOUND_URL` / `EXCEL_OUTBOUND_URL`.

---
## 1. Contexto tecnico

| Elemento | Valor |
|---|---|
| Motor | PostgreSQL (admin via DBeaver) |
| DB | `DataCenter_Promigas` |
| Esquema (unico permitido) | `gestion_diaria` — NO crear otro esquema |
| Tablas existentes (YA creadas, se reutilizan) | `caribe_inbound`, `caribe_outbound`, `caribe_abandono` |
| Tabla nueva permitida (SOLO 1) | `gestion_diaria.clasificacion` |
| Estado actual | Tablas tienen registros hasta agosto, carga anterior desconocida, se asume mal |
| Meta | `TRUNCATE` en inbound/outbound y recarga total ene–sep 2026 = Excel. Abandono suma septiembre. |
| Fuentes | `data/raw/GasCaribe/inbound.xlsx` y `outbound.xlsx` (ignorado por git) |

### 1.1 De donde sale cada carga

| Tabla destino (existente) | Origen Excel | Como se insertan TODOS los registros por mes |
|---|---|---|
| `caribe_inbound` | Libro inbound, hojas `Enero 2026`, `Febrero 2026`, `Marzo 2026`, `Abril 2026`, `Mayo 2026`, `Junio 2026`, `Julio 2026`, `Agosto 2026`, `Septiembre 2026` | El script recorre las 9 hojas en orden, lee TODAS las filas de cada hoja y las inserta. Se ignoran hojas de otros anos. Columnas identicas en las 9 hojas (se verifica en Fase 1). |
| `caribe_outbound` | Libro outbound, hoja `outbound` | Se leen TODAS las filas y se filtra por columna `fecha base` entre `2026-01-01` y `2026-09-30`. Solo entran ene–sep 2026. Mismos nombres de columnas que trae el Excel. |
| `caribe_abandono` | Mismo libro inbound, hoja `ABANDONO` | Solo registros de septiembre. `INSERT` sin duplicar, NO se trunca. |

### 1.2 Reglas generales

1. NO crear tablas crudas nuevas. Las 3 ya existen. Solo `TRUNCATE` + `INSERT`.
2. Mantener mismos nombres de columnas del Excel. Si SQL exige, mapear a `snake_case` y documentar en `context/Esquema_BD.md`.
3. Trazabilidad: agregar si no existen `hoja_origen TEXT` + `fecha_carga TIMESTAMPTZ DEFAULT now()`.
4. Todo dentro de transaccion. Falla → `ROLLBACK`.
5. Idempotente: correr 2 veces = mismo resultado.
6. Bitacora en `context/Bitacora.md` (tabla, hoja/mes, leidas, insertadas). Sin tabla de log en BD.
7. Clasificacion NO se escribe en tablas crudas. Una sola tabla `clasificacion` + vistas.

---
## 2. Fase 0 — Seguridad y preparacion

```ini
# .env (privado)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=DataCenter_Promigas
DB_SCHEMA=gestion_diaria
DB_USER_ETL=tu_usuario_escritura
DB_PASSWORD_ETL=tu_clave
EXCEL_INBOUND_URL=pegar_link_inbound_aqui
EXCEL_OUTBOUND_URL=pegar_link_outbound_aqui
```

`.gitignore`: `.env`, `data/raw/`, `backups/`, `*.xlsx`, `*.csv`, `*.xlsm`, `node_modules/`, `dist/`.

Descargar a `data/raw/GasCaribe/inbound.xlsx` y `outbound.xlsx`. Verificar que abran.

Respaldo obligatorio:

```bash
pg_dump -h $DB_HOST -U $DB_USER_ETL -d DataCenter_Promigas -n gestion_diaria -F c -f backups/gestion_diaria_YYYYMMDD_antes_plan01.dump
```

Checklist: `[ ] .env ok` `[ ] Excel ok` `[ ] backup ok`

---
## 3. Fase 1 — Diagnostico (no cargar aun)

```sql
SELECT table_name, column_name, data_type FROM information_schema.columns
WHERE table_schema='gestion_diaria'
AND table_name IN ('caribe_inbound','caribe_outbound','caribe_abandono')
ORDER BY table_name, ordinal_position;

SELECT 'inbound' AS t, COUNT(*) FROM gestion_diaria.caribe_inbound
UNION ALL SELECT 'outbound', COUNT(*) FROM gestion_diaria.caribe_outbound
UNION ALL SELECT 'abandono', COUNT(*) FROM gestion_diaria.caribe_abandono;

-- por mes (ajustar nombre real de columna fecha segun Esquema_BD.md)
SELECT date_trunc('month', fecha_base) AS mes, COUNT(*) FROM gestion_diaria.caribe_outbound GROUP BY 1 ORDER BY 1;
SELECT hoja_origen, COUNT(*) FROM gestion_diaria.caribe_inbound GROUP BY 1 ORDER BY 1;

-- valores unicos resultado (insumo clasificacion)
SELECT DISTINCT "RESULTADO DE RETENCION", COUNT(*) FROM gestion_diaria.caribe_inbound GROUP BY 1 ORDER BY 2 DESC;
SELECT DISTINCT "RESULTADO DE RETENCION", COUNT(*) FROM gestion_diaria.caribe_outbound GROUP BY 1 ORDER BY 2 DESC;
```

Script `scripts/etl/00_diagnosticar.py`: lista hojas, columnas por hoja (¿las 9 de inbound identicas?), conteo por hoja/mes, rango `fecha base` en outbound, unicos de `RESULTADO DE RETENCION`.

Entregable: `context/Diagnostico_Inicial.md` con tabla BD vs Excel + autorizacion de `TRUNCATE`. No avanzar sin esto.

---
## 4. Fase 2 — Carga cruda (TRUNCATE + INSERT por mes)

### 4.1 Estrategia final

| Tabla | Accion |
|---|---|
| `caribe_inbound` (existe) | `TRUNCATE` una vez → insertar TODOS los registros hoja por hoja: Enero 2026 → Septiembre 2026 |
| `caribe_outbound` (existe) | `TRUNCATE` una vez → insertar TODOS los registros con `fecha base` 2026-01-01 a 2026-09-30 |
| `caribe_abandono` (existe) | NO truncar → `INSERT` septiembre anti-duplicado |

### 4.2 Scripts

```
scripts/etl/
├── 00_diagnosticar.py
├── 01_cargar_inbound.py    # loop 9 hojas → staging → TRUNCATE + INSERT
├── 02_cargar_outbound.py   # filtro fecha_base → staging → TRUNCATE + INSERT
├── 03_cargar_abandono.py   # INSERT septiembre sin duplicar
└── common.py
```

Logica `01_cargar_inbound.py` (la clave del plan):

```python
MESES = ["Enero 2026","Febrero 2026","Marzo 2026","Abril 2026","Mayo 2026",
         "Junio 2026","Julio 2026","Agosto 2026","Septiembre 2026"]
# 1. leer cada hoja, agregar columna hoja_origen = nombre hoja
# 2. cargar todo a stg_caribe_inbound
# 3. validar: conteo staging por hoja_origen = conteo Excel por hoja
# 4. en transaccion: TRUNCATE caribe_inbound; INSERT SELECT desde staging
# 5. validar: conteo final por hoja_origen = esperado, sino ROLLBACK
```

SQL transaccion:

```sql
BEGIN;
TRUNCATE gestion_diaria.caribe_inbound;
INSERT INTO gestion_diaria.caribe_inbound SELECT * FROM gestion_diaria.stg_caribe_inbound;
COMMIT;
```

Outbound igual, pero staging ya filtrado:

```sql
-- solo fecha_base 2026-01-01 a 2026-09-30 entran a staging
BEGIN;
TRUNCATE gestion_diaria.caribe_outbound;
INSERT INTO gestion_diaria.caribe_outbound SELECT * FROM gestion_diaria.stg_caribe_outbound;
COMMIT;
```

Abandono (sin truncate):

```sql
INSERT INTO gestion_diaria.caribe_abandono
SELECT s.* FROM gestion_diaria.stg_caribe_abandono s
WHERE NOT EXISTS (SELECT 1 FROM gestion_diaria.caribe_abandono t WHERE t.* IS NOT DISTINCT FROM s.*);
```

Staging se crea `LIKE` la tabla real y se dropea al final. Cada ejecucion registra `tabla | mes/hoja | leidas | insertadas` en consola + `Bitacora.md`.

---
## 5. Fase 3 — Validacion

```sql
SELECT hoja_origen, COUNT(*) FROM gestion_diaria.caribe_inbound GROUP BY 1 ORDER BY 1;
SELECT date_trunc('month', fecha_base) AS mes, COUNT(*) FROM gestion_diaria.caribe_outbound GROUP BY 1 ORDER BY 1;
```

Entregable `context/Validacion_Carga.md`: tabla Excel vs BD por mes (9 meses inbound, 9 meses outbound, septiembre abandono). Criterio: diferencia = 0 o no se avanza.

---
## 6. Fase 4 — Clasificacion APTA / NO APTA (1 SOLA tabla nueva)

**Diseno:** una unica tabla `gestion_diaria.clasificacion`. Sin tabla de gaseras. La gasera va como columna `gasera TEXT`. Las tablas crudas se distinguen por prefijo (`caribe_*`).

```sql
CREATE TABLE IF NOT EXISTS gestion_diaria.clasificacion (
  gasera TEXT NOT NULL,                        -- 'GasCaribe'
  variante TEXT NOT NULL,                      -- texto ya normalizado: 'cancelada', 'cancelao + venta'
  resultado_normalizado TEXT NOT NULL,         -- canonico: 'cancelado', 'retenido', 'cancelado + reintegro', 'cancelado + venta', ...
  clasificacion TEXT NOT NULL CHECK (clasificacion IN ('APTA','NO APTA')),
  PRIMARY KEY (gasera, variante)
);
```

Funcion normalizacion (misma logica en TS luego):

```sql
CREATE OR REPLACE FUNCTION gestion_diaria.normalizar_texto(p TEXT) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE v TEXT;
BEGIN
  IF p IS NULL THEN RETURN NULL; END IF;
  v := lower(p);
  v := translate(v, 'áéíóúüñ', 'aeiouun');
  v := regexp_replace(v, '\s*\+\s*', ' + ', 'g');
  v := regexp_replace(v, '\s+', ' ', 'g');
  RETURN btrim(v);
END $$;
```

Carga inicial GasCaribe (canonicos + alias en la MISMA tabla):

```sql
-- 4 canonicos APTA
INSERT INTO gestion_diaria.clasificacion (gasera, variante, resultado_normalizado, clasificacion) VALUES
 ('GasCaribe','cancelado','cancelado','APTA'),
 ('GasCaribe','retenido','retenido','APTA'),
 ('GasCaribe','cancelado + reintegro','cancelado + reintegro','APTA'),
 ('GasCaribe','cancelado + venta','cancelado + venta','APTA')
ON CONFLICT (gasera, variante) DO NOTHING;

-- alias de escritura (misma tabla, apuntan al canonico)
INSERT INTO gestion_diaria.clasificacion (gasera, variante, resultado_normalizado, clasificacion) VALUES
 ('GasCaribe','cancelada','cancelado','APTA'),
 ('GasCaribe','cancelao','cancelado','APTA'),
 ('GasCaribe','retenida','retenido','APTA'),
 ('GasCaribe','cancelado+venta','cancelado + venta','APTA'),
 ('GasCaribe','cancelao + venta','cancelado + venta','APTA')
 -- + todos los NO APTA conocidos tras diagnostico: 'cancelacion previa','informacion','no apto','no aplica','tercero',...
ON CONFLICT (gasera, variante) DO NOTHING;
```

**Regla de oro:** si `normalizar_texto(RESULTADO)` no existe en `clasificacion` para esa gasera → `NO APTA` + aparece en `v_valores_sin_mapear`.

Vistas:

```sql
CREATE OR REPLACE VIEW gestion_diaria.v_caribe_inbound_clasificado AS
SELECT t.*,
  COALESCE(c.resultado_normalizado, gestion_diaria.normalizar_texto(t."RESULTADO DE RETENCION")) AS resultado_normalizado,
  COALESCE(c.clasificacion, 'NO APTA') AS clasificacion
FROM gestion_diaria.caribe_inbound t
LEFT JOIN gestion_diaria.clasificacion c
  ON c.gasera='GasCaribe' AND c.variante = gestion_diaria.normalizar_texto(t."RESULTADO DE RETENCION");
-- replicar para outbound: v_caribe_outbound_clasificado

CREATE OR REPLACE VIEW gestion_diaria.v_valores_sin_mapear AS
SELECT DISTINCT gestion_diaria.normalizar_texto("RESULTADO DE RETENCION") AS valor, 'inbound' AS origen
FROM gestion_diaria.caribe_inbound
WHERE gestion_diaria.normalizar_texto("RESULTADO DE RETENCION") NOT IN
  (SELECT variante FROM gestion_diaria.clasificacion WHERE gasera='GasCaribe')
UNION
SELECT DISTINCT gestion_diaria.normalizar_texto("RESULTADO DE RETENCION"), 'outbound'
FROM gestion_diaria.caribe_outbound
WHERE gestion_diaria.normalizar_texto("RESULTADO DE RETENCION") NOT IN
  (SELECT variante FROM gestion_diaria.clasificacion WHERE gasera='GasCaribe');
```

Nueva gasera futura: solo `INSERT` sus 4 canonicos + alias con su nombre en `gasera`. Cero tablas nuevas.

Entregable: `context/Clasificacion.md`.

---
## 7. Fase 5 — Verificacion final

```sql
SELECT hoja_origen, clasificacion, COUNT(*) FROM gestion_diaria.v_caribe_inbound_clasificado GROUP BY 1,2 ORDER BY 1,2;
SELECT date_trunc('month', fecha_base) AS mes, clasificacion, COUNT(*) FROM gestion_diaria.v_caribe_outbound_clasificado GROUP BY 1,2 ORDER BY 1,2;
SELECT * FROM gestion_diaria.v_valores_sin_mapear;
```

Checklist cierre:
- [ ] inbound 9 meses = Excel, outbound ene–sep = Excel, abandono septiembre sumado
- [ ] `v_valores_sin_mapear` vacia o explicada
- [ ] Solo 1 tabla nueva (`clasificacion`) en `gestion_diaria`, ningun esquema nuevo
- [ ] `context/` con Diagnostico, Validacion, Clasificacion, Esquema_BD, Bitacora
- [ ] Scripts idempotentes, backup guardado, cero secretos

**Orden:** Fase 0 → 1 → 2 → 3 → 4 → 5. Plan 02 solo con Plan 01 APROBADO.
