import { useEffect, useState } from 'react';
import { DataTable, Heatmap } from './Charts.jsx';
import { FilterBar, FILTRO_VACIO, KpiGrid, fmt, pct, qs, type FiltroValor, type Opciones } from './ui.jsx';

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

export function AbandonoView({ gasera }: { gasera: string }) {
  const [op, setOp] = useState<Opciones | null>(null);
  const [f, setF] = useState<FiltroValor>(FILTRO_VACIO);
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [trend, setTrend] = useState<{ drill: boolean; rows: Array<Record<string, number | string>> } | null>(null);
  const [tabla, setTabla] = useState<Array<Record<string, number | string>>>([]);
  const [heat, setHeat] = useState<Array<{ mes: string; hora: number; n: number }>>([]);

  useEffect(() => {
    get<Opciones>(`/api/${gasera}/filtros/opciones`).then(setOp).catch(() => {});
  }, [gasera]);

  useEffect(() => {
    const q = qs({ ...f, cabina: '', clasificacion: '', producto: '' });
    get<Record<string, number>>(`/api/${gasera}/abandono/kpis?${q}`).then(setKpis).catch(() => {});
    get(`/api/${gasera}/abandono/tendencia?${q}`).then(setTrend).catch(() => {});
    get(`/api/${gasera}/abandono/tabla?anio=${f.anio}`).then(setTabla).catch(() => {});
    get(`/api/${gasera}/abandono/heatmap?anio=${f.anio}`).then(setHeat).catch(() => {});
  }, [gasera, f]);

  return (
    <>
      <FilterBar opciones={op} valor={f} onChange={setF} conProducto={false} />
      {kpis ? (
        <KpiGrid
          items={[
            { label: 'Total', value: fmt(kpis.total) },
            { label: 'Únicos', value: fmt(kpis.unicos) },
            { label: 'Duplicados', value: fmt(kpis.duplicados) },
            { label: 'Gestionados', value: fmt(kpis.gestionados), color: 'var(--verde-osc)' },
            { label: 'No gestionados', value: fmt(kpis.no_gestionados) },
            { label: '% Recuperación', value: pct(kpis.pct_recuperacion) },
            { label: '% Abandono', value: pct(kpis.pct_abandono) },
          ]}
        />
      ) : null}
      <div className="grid-2">
        <div className="card">
          <h3>Tendencia {trend?.drill ? '(por día)' : '(por mes)'}</h3>
          {trend ? (
            <DataTable columns={['periodo', 'total', 'gestionados', 'pct_recuperacion', 'pct_abandono']} rows={trend.rows} />
          ) : (
            <p>Cargando…</p>
          )}
        </div>
        <div className="card">
          <h3>Mapa de calor (únicos no gestionados)</h3>
          <Heatmap data={heat} />
        </div>
      </div>
      <div className="card" style={{ flex: 1 }}>
        <h3>Abandono por mes</h3>
        <DataTable
          columns={['mes', 'total', 'unicos', 'duplicados', 'gestionados', 'no_gestionados', 'pct_recuperacion', 'pct_abandono']}
          rows={tabla}
        />
      </div>
    </>
  );
}
