# Reporte GasCaribe

Dashboard de gestión diaria de retenciones — Gases del Caribe.

## Uso

```bash
npm install
npm test
npm run dev
```

Abrir http://localhost:4321

## Vistas

- **Inicio** — contexto del reporte.
- **Gestión diaria** — KPIs, tendencia mensual, gestión mensual, detalle aptos/no aptos, aseguradoras, productos, cabinas.
- **Abandono** — KPIs (únicos, duplicados, gestionados, no gestionados), tendencia con drilldown por día, tabla mensual, mapa de calor por hora.

Filtros globales: mes, cabina, clasificación, producto. Sin scroll: todo visible en una pantalla. Tema claro/oscuro.

## ETL (datos)

```bash
python scripts/etl/10_carga_fase2_real.py   # inbound + outbound
python scripts/etl/11_carga_abandono_sep.py # abandono septiembre
```

## Nueva gasera

```bash
npm run nueva-gasera -- --nombre=X --prefijo=x
```

## Estructura

- `src/pages/` — vistas y API (`/api/:gasera/...`)
- `src/components/` — KPIs, gráficos SVG, tablas, filtros
- `src/gaseras/` — configuración por gasera
- `src/lib/` — BD, transformaciones, tipos
- `context/` — documentación y bitácora
