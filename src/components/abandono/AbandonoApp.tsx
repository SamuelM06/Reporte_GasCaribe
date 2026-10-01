import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Flame, PhoneCall, PhoneForwarded, PhoneMissed, Repeat2, Users } from 'lucide-react';
import KpiCard from '../KpiCard.jsx';
import FiltrosBar, { FILTRO_VACIO, qs, type FiltroValor, type Opciones } from '../filtros/FiltrosBar.jsx';
import { Panel, TablaGlass, HeatmapAbandono, type HeatCell } from '../ui2/Panel.jsx';
import { TrendRetencion } from '../charts/Graficos.jsx';

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

export default function AbandonoApp({ gasera }: { gasera: string }) {
  const [op, setOp] = useState<Opciones | null>(null);
  const [f, setF] = useState<FiltroValor>(FILTRO_VACIO);
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [trend, setTrend] = useState<{ drill: boolean; rows: Array<{ periodo: string; total: number; gestionados: number; pct_recuperacion: number; pct_abandono: number }> } | null>(null);
  const [tabla, setTabla] = useState<Array<Record<string, number | string>>>([]);
  const [heat, setHeat] = useState<HeatCell[]>([]);

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

  const trendChart = (trend?.rows ?? []).map((r) => ({
    mes: String(r.periodo),
    inbound: 0,
    outbound: Number(r.total),
    retenciones: Number(r.gestionados),
    pct_retencion: Number(r.pct_recuperacion),
  }));

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <FiltrosBar opciones={op} valor={f} onChange={setF} onReset={() => setF(FILTRO_VACIO)} conProducto={false} />
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        <KpiCard titulo="Total" valor={kpis?.total ?? 0} icono={<PhoneCall />} acento="azul" />
        <KpiCard titulo="Únicos" valor={kpis?.unicos ?? 0} icono={<Users />} acento="violeta" />
        <KpiCard titulo="Duplicados" valor={kpis?.duplicados ?? 0} icono={<Repeat2 />} acento="ambar" />
        <KpiCard titulo="Gestionados" valor={kpis?.gestionados ?? 0} icono={<PhoneForwarded />} acento="verde-oscuro" />
        <KpiCard titulo="No gestionados" valor={kpis?.no_gestionados ?? 0} icono={<PhoneMissed />} acento="ambar" />
        <KpiCard titulo="% Recuperación" valor={(kpis?.pct_recuperacion ?? 0) * 100} icono={<Flame />} acento="verde-claro" />
        <KpiCard titulo="% Abandono" valor={(kpis?.pct_abandono ?? 0) * 100} icono={<Clock />} acento="violeta" />
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-5">
        <Panel titulo={trend?.drill ? 'Tendencia por día' : 'Tendencia por mes'} subtitulo="Total · gestionados · % recuperación" className="xl:col-span-3">
          <TrendRetencion data={trendChart} />
        </Panel>
        <Panel titulo="Mapa de calor por hora" subtitulo="Únicos no gestionados" className="xl:col-span-2">
          <HeatmapAbandono data={heat} />
        </Panel>
      </motion.div>
      <Panel titulo="Abandono por mes" className="max-h-[32%]">
        <TablaGlass
          columns={['mes', 'total', 'unicos', 'duplicados', 'gestionados', 'no_gestionados', 'pct_recuperacion', 'pct_abandono']}
          rows={tabla}
        />
      </Panel>
    </div>
  );
}
