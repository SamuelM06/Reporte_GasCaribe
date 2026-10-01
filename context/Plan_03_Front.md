# Plan 03: Front — Dashboard GasCaribe

> Prerrequisitos: Plan 01 + 02 terminados. BD: inbound 6797, outbound 1305, abandono 5064, clasificacion 40, `sin_mapear`=0.
> Ejemplo interno (red local, no accesible desde fuera): http://70.7.15.217:4321/

## 1. Principios (no negociables)

- **Sin scroll:** cada vista cabe en una pantalla (100dvh, grid compacto, tipografías y paddings reducidos). Sin scroll lateral nunca.
- **Animaciones e iconos:** transiciones CSS en KPIs/gráficos, iconos SVG propios (lucide-style inline, sin emojis).
- **Rendimiento:** gráficos SVG propios (sin librerías pesadas), un fetch por vista (endpoints agregados), `Cache-Control: no-store` en API (sin caché).
- **Seguridad:** todo dato sale de endpoints servidor con SQL parametrizado. Nada de `.env` en cliente.
- **Tema claro/oscuro** con toggle, persistido en `localStorage`.
- **Marca Xuma** (`context/manual-marca/`): Azul Reflex `#120180`, Verde Claro `#5AE280`, Verde Oscuro `#00CD93`, Gris `#333333`, tipografía **Raleway**.

## 2. Navegación y filtros globales

Rutas: `/` (Inicio), `/gestion-diaria`, `/abandono`. Navegador superior con logo + tabs + toggle tema.
Filtros globales (aplican a KPIs y gráficos): **Mes, Cabina, Clasificación, Producto**. Opciones desde `GET /api/:gasera/filtros/opciones`.

⚠️ Dato real: `cabina` viene 100% vacía en el Excel. Fase 0 verifica `operador`/`gestor` como fuente de cabina; si tampoco hay dato, el filtro muestra "Sin registro" y los KPIs de cabina en 0 (documentado, no inventado).

## 3. Vista Inicio (`/`)

Contexto: qué es el reporte, gasera, periodo cubierto (ene–sep 2026), conteos totales, semáforo de calidad (`sin-mapear`=0), links a vistas.

## 4. Vista Gestión diaria (`/gestion-diaria`)

### 4.1 KPIs (fila 1, 8 tarjetas)
Total general | Total Inbound | Total Outbound | Total Abandono* | Aptas | No aptas | Total Retenciones | % Retención

- `Total Abandono` = registros únicos por teléfono (duplicados contados aparte, no sumados).
- `Total Retenciones` = `retenido` + `cancelado + venta` (normalizados).
- `% Retención = Retenciones / Aptos` (0 si Aptos=0).

### 4.2 Sub-pestañas internas (debajo de KPIs, sin salir de la vista)
1. **Tendencia** — barras Outbound/Inbound/Retenciones por mes + línea % Retención (SVG animado estilo BI: gradientes, etiquetas, línea con área).
2. **Retenciones por cabina** — líneas por mes: Inbound vs Outbound (usa cabina o fallback Fase 0).
3. **Gestión mensual** — tabla Mes | Registros | Aptos | No aptos | Cancelado+Venta | Retenido | Retenciones | % Ret.
4. **Detalle aptos** — tabla 4 resultados APTA × meses.
5. **Detalle no aptos** — tabla resultados NO APTA × meses.
6. **Aseguradoras** — tabla aseguradora × meses + Total + % (fila "No aplica" consolida Gnp/Ike/No aplica/No apto/Sin registro).
7. **Productos** — top 10 barras + highlight del top (normalización de escritura en `lib/productos.ts` + tests).
8. **Cabinas** — dona por cabina (o fallback).

Endpoints: `GET /api/:gasera/gestion/kpis`, `/tendencia`, `/gestion-mensual`, `/detalle?clase=apta|noapta`, `/aseguradoras`, `/productos`, `/cabinas`. Todos aceptan `?mes=&cabina=&clasificacion=&producto=`.

## 5. Vista Abandono (`/abandono`)

Reglas (del negocio):
- **Duplicados se conservan** para contar: teléfono que aparece N veces = N registros, 1 único + (N-1) duplicados.
- **Gestionado** = teléfono de abandono que aparece en inbound (columna física `gestionado_inbound` en `caribe_abandono`, como se hizo con clasificación). **No gestionado** = nunca aparece.
- Solo únicos para % y mapa de calor; duplicados solo se cuentan.
- Fórmulas: `% Recuperación = (Duplicados + Gestionados) / Total Abn`; `% Abandono real = NoContactoÚnico / Total Abn`.

### 5.1 KPIs
Total | Únicos | Duplicados | Gestionados (inbound) | No gestionados | % Recuperación | % Abandono real. Filtro Mes.

### 5.2 Gráficos
1. **Tendencia** — barras por mes con drilldown animado a días al filtrar un mes + líneas % recuperación y % abandono.
2. **Tabla mensual** — Mes | Únicos | Duplicados | Gestionados | No gestionados | % Rec | % Abn + total.
3. **Mapa de calor por hora** — solo únicos no gestionados (0–23h × mes).

Endpoints: `GET /api/:gasera/abandono/kpis`, `/tendencia?mes=`, `/tabla`, `/heatmap`. Más `gestionado_inbound BOOLEAN` en BD (script `15_abandono_gestionado.py`).

## 6. Fases de ejecución

- **Fase 0.** Verificación: `operador`/`gestor` como cabina, nulos de teléfono en abandono, distincts para normalización de producto.
- **Fase 1.** Base: tema (CSS vars + toggle), layout sin scroll, navegador, filtros globales, `context/manual-marca` + logos a `public/`.
- **Fase 2.** Endpoints gestión (7) + columna `gestionado_inbound` + endpoints abandono (4) + opciones filtros.
- **Fase 3.** Componentes: KPI card, SVG trend, tablas, heatmap, donut, barras producto + páginas Inicio/Gestión/Abandono.
- **Fase 4.** Verificación: build, tests, auditoría secretos, commit a `main`.

## 7. Decisiones abiertas

1. Cabina vacía → ¿`operador` como proxy o mostrar "Sin registro"? (Fase 0 lo cierra con datos).
2. `Total Retenciones` = retenido + cancelado+venta (este plan). ¿Incluye cancelado+reintegro? (default: no).
