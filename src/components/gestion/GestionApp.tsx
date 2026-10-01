import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BadgeCheck,
  Building2,
  CircleX,
  LayoutGrid,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Percent,
} from 'lucide-react';
import KpiCard from '../KpiCard.jsx';
import FiltrosBar, { FILTRO_VACIO, qs, type FiltroValor, type Opciones } from '../filtros/FiltrosBar.jsx';
import { CabinasLines, DonutCabinas, ProductosBars, TrendRetencion } from '../charts/Graficos.jsx';
import { Panel, TablaGlass } from '../ui2/Panel.jsx';

const TABS = [
  { id: 'tendencia', label: 'Tendencia', icon: LayoutGrid },
  { id: 'cabinas-line', label: 'Retenciones cabina', icon: Building2 },
  { id: 'mensual', label: 'Gestión mensual', icon: PhoneCall },
  { id: 'aptos', label: 'Detalle aptos', icon: BadgeCheck },
  { id: 'noaptos', label: 'Detalle no aptos', icon: CircleX },
  { id: 'aseguradoras', label: 'Aseguradoras', icon: Building2 },
  { id: 'productos', label: 'Productos', icon: PhoneCall },
  { id: 'cabinas', label: 'Cabinas', icon: Percent },
] as const;

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

export default function GestionApp({ gasera }: { gasera: string }) {
  const [op, setOp] = useState<Opciones | null>(null);
  const [f, setF] = useState<FiltroValor>(FILTRO_VACIO);
  const [tab, setTab] = useState<string>('tendencia');
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    get<Opciones>(`/api/${gasera}/filtros/opciones`).then(setOp).catch(() => {});
  }, [gasera]);

  useEffect(() => {
    const q = qs(f);
    get<Record<string, number>>(`/api/${gasera}/gestion/kpis?${q}`).then(setKpis).catch(() => {});
    const ep: Record<string, string> = {
      tendencia: 'tendencia',
      'cabinas-line': 'retenciones-cabina',
      mensual: 'gestion-mensual',
      aptos: 'detalle?clase=apta',
      noaptos: 'detalle?clase=noapta',
      aseguradoras: 'aseguradoras',
      productos: 'productos',
      cabinas: 'cabinas',
    };
    const base = ep[tab] ?? 'tendencia';
    const sep = base.includes('?') ? '&' : '?';
    setData(null);
    get(`/api/${gasera}/gestion/${base}${sep}${q}`).then(setData).catch(() => setData([]));
  }, [gasera, f, tab]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <FiltrosBar opciones={op} valor={f} onChange={setF} onReset={() => setF(FILTRO_VACIO)} />
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        <KpiCard titulo="Total general" valor={kpis?.total_general ?? 0} icono={<PhoneCall />} acento="azul" />
        <KpiCard titulo="Inbound" valor={kpis?.inbound ?? 0} icono={<PhoneIncoming />} acento="violeta" />
        <KpiCard titulo="Outbound" valor={kpis?.outbound ?? 0} icono={<PhoneOutgoing />} acento="azul" />
        <KpiCard titulo="Abandono únicos" valor={kpis?.abandono_unicos ?? 0} icono={<PhoneOutgoing />} acento="ambar" />
        <KpiCard titulo="Aptas" valor={kpis?.aptas ?? 0} icono={<BadgeCheck />} acento="verde-oscuro" />
        <KpiCard titulo="No aptas" valor={kpis?.no_aptas ?? 0} icono={<CircleX />} acento="ambar" />
        <KpiCard titulo="Retenciones" valor={kpis?.retenciones ?? 0} icono={<BadgeCheck />} acento="verde-claro" />
        <KpiCard titulo="% Retención" valor={(kpis?.pct_retencion ?? 0) * 100} icono={<Percent />} acento="verde-oscuro" sub="ret / aptas" />
      </div>
      <div className="glass flex shrink-0 flex-wrap gap-1 rounded-2xl p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-all ${
              tab === t.id ? 'bg-xuma-azul text-white dark:bg-xuma-verde-claro/90 dark:text-[#0a1030]' : 'text-tinta/65 hover:bg-tinta/10'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-0 flex-1">
        <TabBody tab={tab} data={data} />
      </motion.div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabBody({ tab, data }: { tab: string; data: any }) {
  if (!data) return <Panel titulo="Cargando…"><p className="text-xs">Consultando la base de datos.</p></Panel>;
  if (tab === 'tendencia')
    return (
      <Panel titulo="Tendencia mensual de gestión y retenciones" subtitulo="Inbound · Outbound · Retenciones · % Retención" delay={0.05}>
        <TrendRetencion data={data} />
      </Panel>
    );
  if (tab === 'cabinas-line')
    return (
      <Panel titulo="Tendencia de retenciones por cabina" subtitulo="IN vs OUT por operador">
        <CabinasLines data={data} />
      </Panel>
    );
  if (tab === 'productos')
    return (
      <Panel titulo="Solicitudes por producto" subtitulo="Top 10 normalizado">
        <ProductosBars data={data} />
      </Panel>
    );
  if (tab === 'cabinas')
    return (
      <Panel titulo="Proporción por cabina" subtitulo="Operador (cabina vacía en Excel)">
        <DonutCabinas data={data} />
      </Panel>
    );
  if (tab === 'mensual')
    return (
      <Panel titulo="Gestión mensual">
        <TablaGlass columns={['mes', 'registros', 'aptos', 'no_aptos', 'canc_venta', 'retenido', 'retenciones', 'pct_retencion']} rows={data} />
      </Panel>
    );
  if (tab === 'aptos' || tab === 'noaptos')
    return (
      <Panel titulo={tab === 'aptos' ? 'Detalle de resultados aptos' : 'Detalle de resultados no aptos'}>
        <TablaGlass columns={['resultado_normalizado', 'mes', 'n']} rows={data} />
      </Panel>
    );
  return (
    <Panel titulo="Gestión mensual por aseguradora">
      <TablaGlass columns={['aseg', 'mes', 'n']} rows={data} />
    </Panel>
  );
}
