# Clasificacion APTA / NO APTA — Base oficial (todas las gaseras)

> Fuente de verdad para clasificar `RESULTADO DE RETENCION`.
> Una sola tabla: `gestion_diaria.clasificacion`. Nada en otro esquema. Nada en codigo duro.

## 1. Regla oficial

- **APTA = solo estos 4 canonicos.** Todo lo demas = **NO APTA**. Sin excepciones.
- La clasificacion NO se escribe en `caribe_inbound / outbound`. Vive en `clasificacion` + vistas `v_caribe_*_clasificado`.
- Valor no catalogado → `NO APTA` + aparece en `v_valores_sin_mapear` para revision.

## 2. Los 4 APTA (canonicos)

| # | `resultado_normalizado` | `clasificacion` |
|---|---|---|
| 1 | `cancelado` | APTA |
| 2 | `retenido` | APTA |
| 3 | `cancelado + reintegro` | APTA |
| 4 | `cancelado + venta` | APTA |

Mismos 4 para las 6 gaseras. Solo cambia la columna `gasera`.

## 3. NO APTA (todo lo demas)

Lista base conocida — se amplia tras Fase 1 con los `DISTINCT` reales. Cada uno va como fila explicita en la tabla para catalogo completo:

| `resultado_normalizado` | `clasificacion` | Nota |
|---|---|---|
| `cancelacion previa` | NO APTA |  |
| `informacion` | NO APTA | incluye variantes `informacion general`, etc. |
| `no apto` | NO APTA |  |
| `no aplica` | NO APTA |  |
| `tercero` | NO APTA |  |
| `venta` (sola) | NO APTA | solo es APTA si es `cancelado + venta` |
| `reintegro` (solo) | NO APTA | solo es APTA si es `cancelado + reintegro` |
| ` (vacio / nulo)` | NO APTA | entra a `v_valores_sin_mapear` |
| cualquier otro texto | NO APTA | regla por defecto |

> Si en el diagnostico aparece un valor nuevo (ej. `gestion comercial`), se inserta como NO APTA salvo que direccion indique lo contrario.

## 4. Normalizacion `normalizar_texto()` (SQL = TS)

1. minusculas
2. quitar tildes (`á→a`, `ñ→n` se conserva como `n` segun `translate`)
3. `+` siempre como ` + ` (`cancelado+venta` → `cancelado + venta`)
4. colapsar espacios, trim

Ejemplos:

| Entrada Excel | Normalizado | Canonico | Clasificacion |
|---|---|---|---|
| `Cancelado` | `cancelado` | `cancelado` | APTA |
| `cancelada` | `cancelada` | `cancelado` | APTA |
| `cancelao` | `cancelao` | `cancelado` | APTA |
| `Retenida` | `retenida` | `retenido` | APTA |
| `RETENIDO` | `retenido` | `retenido` | APTA |
| `Cancelado + Venta` | `cancelado + venta` | `cancelado + venta` | APTA |
| `cancelao+venta` | `cancelao + venta` | `cancelado + venta` | APTA |
| `Cancelación Previa` | `cancelacion previa` | `cancelacion previa` | NO APTA |
| `Información` | `informacion` | `informacion` | NO APTA |

## 5. Tabla unica (DDL oficial)

```sql
CREATE TABLE IF NOT EXISTS gestion_diaria.clasificacion (
  gasera TEXT NOT NULL,
  variante TEXT NOT NULL,
  resultado_normalizado TEXT NOT NULL,
  clasificacion TEXT NOT NULL CHECK (clasificacion IN ('APTA','NO APTA')),
  PRIMARY KEY (gasera, variante)
);
```

Seed GasCaribe (canonicos + alias conocidos):

```sql
INSERT INTO gestion_diaria.clasificacion (gasera, variante, resultado_normalizado, clasificacion) VALUES
 ('GasCaribe','cancelado','cancelado','APTA'),
 ('GasCaribe','retenido','retenido','APTA'),
 ('GasCaribe','cancelado + reintegro','cancelado + reintegro','APTA'),
 ('GasCaribe','cancelado + venta','cancelado + venta','APTA'),
 ('GasCaribe','cancelada','cancelado','APTA'),
 ('GasCaribe','cancelao','cancelado','APTA'),
 ('GasCaribe','retenida','retenido','APTA'),
 ('GasCaribe','cancelado+venta','cancelado + venta','APTA'),
 ('GasCaribe','cancelao + venta','cancelado + venta','APTA'),
 ('GasCaribe','cancelacion previa','cancelacion previa','NO APTA'),
 ('GasCaribe','informacion','informacion','NO APTA'),
 ('GasCaribe','no apto','no apto','NO APTA'),
 ('GasCaribe','no aplica','no aplica','NO APTA'),
 ('GasCaribe','tercero','tercero','NO APTA')
ON CONFLICT (gasera, variante) DO NOTHING;
```

## 6. Mantenimiento (para siempre)

1. Nuevo valor en `v_valores_sin_mapear` → revisar → `INSERT` en `clasificacion` con su `gasera`.
2. Nueva gasera → copiar los 4 canonicos + alias con su nombre en `gasera`. Cero tablas nuevas.
3. Nunca clasificar en codigo. Siempre por join a esta tabla.
4. Cualquier cambio se registra en `Bitacora.md` con fecha.
