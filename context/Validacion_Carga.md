# Validacion de Carga — Fase 3 Plan 01 (2026-10-01)

Fuente: `Inbound_Caribe.xlsx` (2.7 MB) + `Outbound_Caribe.xlsx` (676 KB) en `data/raw/GasCaribe/`.
Metodo: `TRUNCATE` + `INSERT` transaccional (`scripts/etl/10_carga_fase2_real.py`). `COMMIT_OK`.

## 1. Inbound: Excel vs BD por hoja — DIFERENCIA 0

| Hoja | Excel | BD (`mes`) | Dif |
|---|---|---|---|
| ENERO 2026 | 773 | 773 | 0 |
| FEBRERO 2026 | 544 | 544 | 0 |
| MARZO 2026 | 2169 | 2169 | 0 |
| ABRIL 2026 | 503 | 503 | 0 |
| MAYO 2026 | 539 | 539 | 0 |
| JUNIO 2026 | 475 | 475 | 0 |
| JULIO 2026 | 572 | 572 | 0 |
| AGOSTO 2026 | 560 | 560 | 0 |
| SEPTIEMBRE 2026 | 662 | 662 | 0 |
| **Total** | **6797** | **6797** | **0** |

Se cargan las hojas completas (la hoja ES el mes). Notas: ENERO trae fechas 2025-01-03 a 2026-08-01 y 222 sin fecha; MARZO trae 1552 sin fecha y 1551 sin resultado (filas de relleno del Excel, se cargan tal cual).

## 2. Outbound: filtrado por `fecha de base` ene–sep 2026

| Concepto | Filas |
|---|---|
| Hoja `Outbound` total | 2545 |
| Fuera de rango o nula | 1240 |
| **Cargadas a BD** | **1305** |

Por mes en BD: ENE 147, FEB 101, MAR 127, ABR 237, MAY 206, JUN 183, JUL 150, AGO 101, SEP 53.

## 3. Calidad

- Columnas `Unnamed` (vacias) descartadas. `NBSP` y espacios limpiados en `estado`.
- Limpieza post-carga: 43373 celdas `'NaN'` (artefacto pandas/psycopg2) → `NULL`. `estado` NULL: inbound 1818 (= 224 ENE + 1551 MAR + resto), outbound 80. Coincide con vacios del Excel.
- Columnas nuevas agregadas (nombres Excel, snake_case): inbound `telefono, documento, usuario, gestor, correo_reintegro, gestion_sac, numero_solicitud, observacion_sac, fecha_legalizacion`; outbound `gestor, gestion_sac, numero_solicitud, solicitud, fecha_registro, cod_estado, observacion_retencion, fecha_gestion`.
- Mapeo: `ESTADO`/`Resultado de retencion` → `estado`; `Tipifiacion de la retencion` → `subtipificacion`; `OBSERVACION` → `motivo`; `fecha de atencion`/`Fecha de llamada` → `fecha_de_ejecucion`.
- Abandono NO tocada (4863 filas intactas): la hoja `ABANDONO` (903 filas) solo trae `fecha` + `numbercall` con datos; resto de columnas vacias. Sin registros mapeables a la tabla. Decidir con negocio.

## Dictamen: APROBADO (inbound + outbound). Abandono pendiente de decision.
