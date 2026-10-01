# Esquema BD — Mapeo real (Fase 1: 2026-10-01)

## Tablas existentes (gestion_diaria)

### caribe_inbound / caribe_outbound (misma estructura)
`id, distribuidora, aseguradora, medio_de_recepcion, contrato, localidad, operador, canal, producto, tipo_de_contacto, estado, subtipificacion, motivo, fecha_de_ejecucion (date), base (varchar mixto), fecha_de_venta, asesor_de_venta, mes (varchar), cabina, anio (int, con Nones y 1900), fecha_carga, hoja_origen (agregada Fase 2)`

Mapeo plan → realidad:
- RESULTADO DE RETENCION = `estado`
- fecha base = `fecha_de_ejecucion` (+ `base` como apoyo, viene mixto `2026-01-14` y `26/01/2026`)
- mes/anio Excel → `mes`/`anio` (no confiables en BD actual, se recargan del Excel)

### caribe_abandono
`id, aseguradora, nombre_cliente, identificacion_usuario, contrato, localidad, telefono, resultado_llamada, fecha_llamada (date), hora (varchar HH:MM:SS), fecha_carga, hoja_origen (Fase 2)`

### Respaldos pre-TRUNCATE (Fase 2)
`gestion_diaria._bk20261001_caribe_inbound (4373)`, `_bk20261001_caribe_outbound (1276)`, `_bk20261001_caribe_abandono (4863)`

### Staging (vacias, listas)
`gestion_diaria.stg_caribe_inbound / stg_caribe_outbound / stg_caribe_abandono` (LIKE real INCLUDING ALL)

## Tabla unica nueva (Fase 4, aun no creada)
`gestion_diaria.clasificacion(gasera, variante, resultado_normalizado, clasificacion)` — join por `variante = normalizar_texto(estado)`. Ver `context/Clasificacion.md`.
