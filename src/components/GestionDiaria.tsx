import { useEffect, useState } from 'react';
import { DataTable, Donut, CabinaLines, ProductBars, TrendChart } from './Charts.jsx';
import { FilterBar, FILTRO_VACIO, KpiGrid, fmt, pct, qs, type FiltroValor, type Opciones } from './ui.jsx';

const TABS = ['Tendencia', 'Retenciones cabina', 'Gestión mensual', 'Detalle aptos', 'Detalle no aptos', 'Aseguradoras', 'Productos', 'Cabinas'] as const;

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

export function GestionDiaria({ gasera }: { gasera: string }) {
  const [op, setOp] = useState<Opciones | null>(null);
  const [f, setF] = useState<FiltroValor>(FILTRO_VACIO);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Tendencia');
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [data, setData] = useState<unknown>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    get<Opciones>(`/api/${gasera}/filtros/opciones`).then(setOp).catch(() => {});
  }, [gasera]);

  useEffect(() => {
    setErr('');
    const q = qs(f);
    get<Record<string, number>>(`/api/${gasera}/gestion/kpis?${q}`).then(setKpis).catch((e) => setErr(String(e)));
    const ep: Record<string, string> = {
      Tendencia: 'tendencia',
      'Retenciones cabina': 'retenciones-cabina',
      'Gestión mensual': 'gestion-mensual',
      'Detalle aptos': 'detalle?clase=apta',
      'Detalle no aptos': 'detalle?clase=noapta',
      Aseguradoras: 'aseguradoras',
      Productos: 'productos',
      Cabinas: 'cabinas',
    };
    const base = ep[tab] ?? 'tendencia';
    const sep = base.includes('?') ? '&' : '?';
    get(`/api/${gasera}/gestion/${base}${sep}${q}`).then(setData).catch((e) => setErr(String(e)));
  }, [gasera, f, tab]);

  return (
    <>
      <FilterBar opciones={op} valor={f} onChange={setF} />
      {kpis ? (
        <KpiGrid
          items={[
            { label: 'Total general', value: fmt(kpis.total_general) },
            { label: 'Inbound', value: fmt(kpis.inbound) },
            { label: 'Outbound', value: fmt(kpis.outbound) },
            { label: 'Abandono únicos', value: fmt(kpis.abandono_unicos) },
            { label: 'Aptas', value: fmt(kpis.aptas), color: 'var(--verde-osc)' },
            { label: 'No aptas', value: fmt(kpis.no_aptas) },
            { label: 'Retenciones', value: fmt(kpis.retenciones) },
            { label: '% Retención', value: pct(kpis.pct_retencion) },
          ]}
        />
      ) : null}
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="card" style={{ flex: 1 }}>
        <h3>{tab}</h3>
        {err ? <p>{err}</p> : <TabBody tab={tab} data={data} />}
      </div>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabBody({ tab, data }: { tab: string; data: any }) {
  if (!data) return <p>Cargando…</p>;
  if (tab === 'Tendencia') return <TrendChart data={data} />;
  if (tab === 'Retenciones cabina') return <CabinaLines data={data} />;
  if (tab === 'Productos') return <ProductBars data={data} />;
  if (tab === 'Cabinas') return <Donut data={data} />;
  if (tab === 'Gestión mensual') {
    return (
      <DataTable
        columns={['mes', 'registros', 'aptos', 'no_aptos', 'canc_venta', 'retenido', 'retenciones', 'pct_retencion']}
        rows={data}
      />
    );
  }
  if (tab === 'Detalle aptos' || tab === 'Detalle no aptos') {
    return <DataTable columns={['resultado_normalizado', 'mes', 'n']} rows={data} />;
  }
  if (tab === 'Aseguradoras') {
    return <DataTable columns={['aseg', 'mes', 'n']} rows={data} />;
  }
  return null;
}
