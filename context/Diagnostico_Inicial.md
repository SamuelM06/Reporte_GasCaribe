# Diagnostico Inicial — Fase 1 Plan 01 (BD real 2026-10-01)

Conexion: `20.7.15.40:5432 / DataCenter_Promigas / gestion_diaria` OK (PostgreSQL 16.14).
`.env` creado y cargado. Excel aun NO disponible en `data/raw/GasCaribe/` (vacio) — comparativa Excel vs BD pendiente.

## 1. Tablas y conteos actuales

| Tabla | Filas | Rango real |
|---|---|---|
| `caribe_inbound` | 4373 | `fecha_de_ejecucion` 2025-01-03 a 2026-08-31, 110 nulas |
| `caribe_outbound` | 1276 | `fecha_de_ejecucion` 2026-02-17 a 2026-08-20, 1024 nulas |
| `caribe_abandono` | 4863 | `fecha_llamada` 2026-05-13 a 2026-09-15, 2 nulas |

No existe `gestion_diaria.clasificacion` ni tablas `stg_*`. Solo 3 tablas caribe.

## 2. Hallazgo critico: no hay columna RESULTADO DE RETENCION

Ni inbound ni outbound tienen `RESULTADO DE RETENCION` ni `fecha base` ni `hoja_origen`.
La columna que hace de resultado es **`estado`**. El plan queda asi:

| Concepto del plan | Columna real en BD |
|---|---|
| RESULTADO DE RETENCION | `estado` (varchar) |
| fecha base / fecha ejecucion | `fecha_de_ejecucion` (date, con nulos) + `base` (varchar mixto) + `anio`/`mes` |
| hoja_origen | NO existe — crear en Fase 2 |
| fecha_carga | ya existe |

Columnas inbound/outbound (identicas entre si): `id, distribuidora, aseguradora, medio_de_recepcion, contrato, localidad, operador, canal, producto, tipo_de_contacto, estado, subtipificacion, motivo, fecha_de_ejecucion, base, fecha_de_venta, asesor_de_venta, mes, cabina, anio, fecha_carga`.
Abandono: `id, aseguradora, nombre_cliente, identificacion_usuario, contrato, localidad, telefono, resultado_llamada, fecha_llamada, hora (varchar HH:MM:SS), fecha_carga`.

## 3. Valores de `estado` (= base de clasificacion)

Inbound: `CANCELADO 2952, RETENIDO 839, CANCELADA +VENTA 226, CANCELADO + REINTEGRO 102, CANCELADO+VENTA 68, NO APTO 59, NO APLICA 53, NULL 35, CANCELACION PREVIA 16, CANCELACI�N PREVIA 7, INFORMACION 5, ...`
Outbound: `NO CONTACTO 572, CANCELADO 456, NULL 97, RETENIDO 69, CANCELADA +VENTA 34, CANCELADO + REINTEGRO 12, ...`

Confirma: variantes pegadas (`CANCELADO+VENTA`), con espacio raro (`CANCELADA +VENTA`), encoding roto (`CANCELACI�N`), mayusculas mixtas (`No apto`). Justifica `normalizar_texto()` + tabla unica `clasificacion(variante→canonico)`.

## 4. Calidad (por que se autoriza TRUNCATE)

- `anio`/`mes` contaminados: hay `anio=1900`, `2016-2025`, y `anio IS NULL` con `mes=ENERO..AGOSTO` (inbound 2534 filas sin anio, outbound 759 sin anio). No son 2026 confiables.
- Fuera de rango ene–sep 2026: inbound 115, outbound 1024 (mayoria por `fecha_de_ejecucion IS NULL`).
- Duplicados inbound (fila identica sin id): 57 grupos.
- `base` formato mixto: `'2026-01-14 00:00:00'` y `'26/01/2026'` conviviendo (outbound). En inbound similar.
- Abandono solo tiene may–sep 2026 (may 921, jun 1121, jul 1103, ago 1048, sep 668). Faltan ene–abr. `hora` varchar por segundo — apta para agrupar por franja en Plan 02.

## 5. Conclusion Fase 1

1. **BD si esta mal para el objetivo ene–sep 2026.** Se autoriza `TRUNCATE` en `caribe_inbound` y `caribe_outbound` en Fase 2.
2. **Mapeo obligatorio:** `estado` = RESULTADO DE RETENCION. Actualizar `Esquema_BD.md` y scripts con este mapeo.
3. **Bloqueador Fase 2:** faltan los 2 xlsx en `data/raw/GasCaribe/`. Sin ellos no se puede validar conteo Excel = BD ni recargar. Descargar con links del `.env` y avisar.
4. Siguiente: crear `Esquema_BD.md` con mapeo final + `normalizar_texto()` + tabla `clasificacion`, luego Fase 2.
