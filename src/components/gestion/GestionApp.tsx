import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleX,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import KpiCard from '../KpiCard.jsx';
import FiltrosBar, { FILTRO_VACIO, qs, type FiltroValor, type Opciones } from '../filtros/FiltrosBar.jsx';
import { CabinasLines, DonutCabinas, ProductosBars, TrendRetencion } from '../charts/Graficos.jsx';
import { Panel, TablaGlass } from '../ui2/Panel.jsx';

const TABS = [
  { id: 'tendencia', label: 'Tendencia y participación' },
  { id: 'tablas', label: 'Tablas de gestión' },
] as const;

// % Retención = Retenciones / Aptos (viene del endpoint, 0..1).
const fmtPct = (_c: string, v: unknown): string =>
  typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : String(v ?? '—');
const fmtNum = (_c: string, v: unknown): string =>
  typeof v === 'number' ? v.toLocaleString('es-CO') : String(v ?? '—');

const H_GESTION: Record<string, string> = {
  mes: 'Mes', registros: 'Registros', aptos: 'Aptos', no_aptos: 'No Aptos',
  canc_venta: 'Cancelado + Venta', retenido: 'Retenido', retenciones: 'Retenciones', pct_retencion: '% Retención',
};

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

interface DetalleRow {
  resultado_normalizado: string;
  mes: string;
  n: number;
}

// 'SEPTIEMBRE 2026' -> 'Septiembre' (solo mes, sin año).
const tituloMes = (m: string): string => {
  const t = (m ?? '').trim();
  if (!t) return '—';
  const soloMes = t.split(' ')[0]; // "ENERO 2026" -> "ENERO"
  return soloMes.charAt(0).toUpperCase() + soloMes.slice(1).toLowerCase();
};
const primeraMayus = (s: string): string => {
  const t = (s ?? '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : 'Sin registro';
};

const ORDEN_MES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
function mesesOrdenados(rows: Array<{ mes: string }>): string[] {
  return [...new Set(rows.map((r) => r.mes))].sort(
    (a, b) => ORDEN_MES.indexOf(a.split(' ')[0]) - ORDEN_MES.indexOf(b.split(' ')[0]),
  );
}

// Pivota detalle: filas = meses, columnas = resultados (+ Total).
function pivotarDetalleXResultado(rows: DetalleRow[]): { columns: string[]; data: Array<Record<string, unknown>> } {
  const meses = mesesOrdenados(rows);
  const resultados = [...new Set(rows.map((r) => r.resultado_normalizado ?? 'sin registro'))];
  const colsRes = resultados.map(primeraMayus);
  const data = meses.map((m) => {
    const fila: Record<string, unknown> = { mes: tituloMes(m) };
    let total = 0;
    resultados.forEach((res, i) => {
      const n = rows.filter((r) => r.mes === m && (r.resultado_normalizado ?? 'sin registro') === res).reduce((a, r) => a + r.n, 0);
      fila[colsRes[i]] = n;
      total += n;
    });
    fila['Total'] = total;
    return fila;
  });
  return { columns: ['mes', ...colsRes, 'Total'], data };
}

// Pivota detalle: filas = resultados, columnas = meses (+ Total).
function pivotarDetalleXMes(rows: DetalleRow[]): { columns: string[]; data: Array<Record<string, unknown>> } {
  const meses = mesesOrdenados(rows);
  const colsMes = meses.map(tituloMes);
  const resultados = [...new Set(rows.map((r) => r.resultado_normalizado ?? 'sin registro'))];
  const data = resultados.map((res) => {
    const fila: Record<string, unknown> = { resultado: primeraMayus(res) };
    let total = 0;
    meses.forEach((m, i) => {
      const n = rows.filter((r) => r.mes === m && (r.resultado_normalizado ?? 'sin registro') === res).reduce((a, r) => a + r.n, 0);
      fila[colsMes[i]] = n;
      total += n;
    });
    fila['Total'] = total;
    return fila;
  });
  const ft: Record<string, unknown> = { resultado: 'Total' };
  let gran = 0;
  meses.forEach((m, i) => {
    const n = rows.filter((r) => r.mes === m).reduce((a, r) => a + r.n, 0);
    ft[colsMes[i]] = n;
    gran += n;
  });
  ft['Total'] = gran;
  return { columns: ['resultado', ...colsMes, 'Total'], data: [...data, ft] };
}

interface AsegRow {
  aseg: string;
  mes: string;
  n: number;
}

// Pivota aseguradoras: filas = meses, columnas = aseguradora (+ Total).
function pivotarAseg(rows: AsegRow[]): { columns: string[]; data: Array<Record<string, unknown>> } {
  const meses = mesesOrdenados(rows);
  const asegs = [...new Set(rows.map((r) => r.aseg ?? 'Sin registro'))];
  const colsAseg = asegs.map(primeraMayus);
  const data = meses.map((m) => {
    const fila: Record<string, unknown> = { mes: tituloMes(m) };
    let total = 0;
    asegs.forEach((a, i) => {
      const n = rows.filter((r) => r.mes === m && (r.aseg ?? 'Sin registro') === a).reduce((x, r) => x + r.n, 0);
      fila[colsAseg[i]] = n;
      total += n;
    });
    fila['Total'] = total;
    return fila;
  });
  const ft: Record<string, unknown> = { mes: 'Total' };
  let gran = 0;
  asegs.forEach((a, i) => {
    const n = rows.filter((r) => (r.aseg ?? 'Sin registro') === a).reduce((x, r) => x + r.n, 0);
    ft[colsAseg[i]] = n;
    gran += n;
  });
  ft['Total'] = gran;
  return { columns: ['mes', ...colsAseg, 'Total'], data: [...data, ft] };
}

export default function GestionApp({ gasera }: { gasera: string }) {
  const [op, setOp] = useState<Opciones | null>(null);
  const [f, setF] = useState<FiltroValor>(FILTRO_VACIO);
  const [tab, setTab] = useState<string>('tendencia');
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [trend, setTrend] = useState([]);
  const [cabLine, setCabLine] = useState([]);
  const [prods, setProds] = useState([]);
  const [mensual, setMensual] = useState([]);
  const [aptos, setAptos] = useState<DetalleRow[]>([]);
  const [noaptos, setNoaptos] = useState<DetalleRow[]>([]);
  const [asegs, setAsegs] = useState<AsegRow[]>([]);
  const [pag, setPag] = useState(0);

  useEffect(() => {
    get<Opciones>(`/api/${gasera}/filtros/opciones`).then(setOp).catch(() => {});
  }, [gasera]);

  useEffect(() => {
    const q = qs(f);
    setPag(0);
    get<Record<string, number>>(`/api/${gasera}/gestion/kpis?${q}`).then(setKpis).catch(() => {});
    if (tab === 'tendencia') {
      get(`/api/${gasera}/gestion/tendencia?${q}`).then(setTrend).catch(() => setTrend([]));
      get(`/api/${gasera}/gestion/retenciones-cabina?${q}`).then(setCabLine).catch(() => setCabLine([]));
      get(`/api/${gasera}/gestion/productos?${q}`).then(setProds).catch(() => setProds([]));
    } else {
      get(`/api/${gasera}/gestion/gestion-mensual?${q}`).then(setMensual).catch(() => setMensual([]));
      get<DetalleRow[]>(`/api/${gasera}/gestion/detalle?clase=apta&${q}`).then(setAptos).catch(() => setAptos([]));
      get<DetalleRow[]>(`/api/${gasera}/gestion/detalle?clase=noapta&${q}`).then(setNoaptos).catch(() => setNoaptos([]));
      get(`/api/${gasera}/gestion/aseguradoras?${q}`).then(setAsegs).catch(() => setAsegs([]));
    }
  }, [gasera, f, tab]);

  const pivAptos = pivotarDetalleXResultado(aptos);
  const pivNo = pivotarDetalleXMes(noaptos);
  const pivAseg = pivotarAseg(asegs);

  // Proporción por cabina: % inbound vs % outbound (viene de los KPIs ya filtrados).
  const totCab = (kpis?.inbound ?? 0) + (kpis?.outbound ?? 0) || 1;
  const pctIn = (((kpis?.inbound ?? 0) / totCab) * 100).toFixed(1);
  const pctOut = (((kpis?.outbound ?? 0) / totCab) * 100).toFixed(1);
  const donut = [
    { etiqueta: 'Cabina Inbound', n: kpis?.inbound ?? 0 },
    { etiqueta: 'Cabina Outbound', n: kpis?.outbound ?? 0 },
  ];

  return (
    <div className="flex h-[calc(100dvh-150px)] min-h-[560px] flex-col gap-2">
      <FiltrosBar opciones={op} valor={f} onChange={setF} onReset={() => setF(FILTRO_VACIO)} />
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        <KpiCard titulo="Total general" valor={kpis?.total_general ?? 0} icono={<PhoneCall />} acento="azul" />
        <KpiCard titulo="Inbound" valor={kpis?.inbound ?? 0} icono={<PhoneIncoming />} acento="violeta" />
        <KpiCard titulo="Outbound" valor={kpis?.outbound ?? 0} icono={<PhoneOutgoing />} acento="azul" />
        <KpiCard titulo="Abandono" valor={kpis?.abandono_unicos ?? 0} icono={<PhoneMissed />} acento="ambar" />
        <KpiCard titulo="Aptas" valor={kpis?.aptas ?? 0} icono={<BadgeCheck />} acento="verde-oscuro" />
        <KpiCard titulo="No aptas" valor={kpis?.no_aptas ?? 0} icono={<CircleX />} acento="ambar" />
        <KpiCard titulo="Retenciones" valor={kpis?.retenciones ?? 0} icono={<ShieldCheck />} acento="verde-claro" sub="retenido + canc. + venta" />
        <KpiCard titulo="% Retención" valor={(kpis?.pct_retencion ?? 0) * 100} icono={<Percent />} acento="verde-oscuro" sufijo="%" decimales={1} sub="retenciones / aptas" />
      </div>
      <div className="glass flex shrink-0 gap-1 rounded-2xl p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
              tab === t.id ? 'bg-xuma-azul text-white dark:bg-xuma-verde-claro/90 dark:text-[#0a1030]' : 'text-tinta/65 hover:bg-tinta/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-0 flex-1">
        {tab === 'tendencia' ? (
          <div className="grid h-full min-h-0 grid-rows-[1.25fr_1fr] gap-2">
            <Panel titulo="Tendencia mensual de gestión y retenciones" subtitulo="Inbound · Outbound · Retenciones · % Retención">
              <TrendRetencion data={trend} />
            </Panel>
            <div className="grid min-h-0 grid-cols-1 gap-2 xl:grid-cols-3">
              <Panel titulo="Retenciones por cabina" subtitulo="IN vs OUT">
                <CabinasLines data={cabLine} />
              </Panel>
              <Panel titulo="Proporción por cabina" subtitulo={`${pctIn}% inbound · ${pctOut}% outbound`}>
                <DonutCabinas data={donut} />
              </Panel>
              <Panel titulo="Top productos" subtitulo="Normalizado">
                <ProductosBars data={prods} />
              </Panel>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-0 overflow-y-auto">
            <div className={pag === 0 ? 'grid grid-cols-1 gap-2 xl:grid-cols-2' : 'flex flex-col gap-2'}>
              {pag === 0 ? (
                <>
                  <Panel titulo="Gestión mensual" auto>
                    <TablaGlass columns={['mes', 'registros', 'aptos', 'no_aptos', 'canc_venta', 'retenido', 'retenciones', 'pct_retencion']} rows={mensual} headers={H_GESTION} auto format={(c, v) => (c === 'pct_retencion' ? fmtPct(c, v) : c === 'mes' ? tituloMes(String(v ?? '')) : fmtNum(c, v))} />
                  </Panel>
                  <Panel titulo="Detalle de resultados aptos" subtitulo="Meses × resultados" auto>
                    <TablaGlass columns={pivAptos.columns} rows={pivAptos.data} headers={{ mes: 'Mes' }} auto format={(c, v) => (c === 'mes' ? String(v ?? '—') : fmtNum(c, v))} />
                  </Panel>
                </>
              ) : (
                <>
                  <Panel titulo="Gestión mensual por aseguradora" subtitulo="Meses × aseguradora" auto>
                    <TablaGlass columns={pivAseg.columns} rows={pivAseg.data} headers={{ mes: 'Mes' }} auto format={(c, v) => (c === 'mes' ? String(v ?? '—') : fmtNum(c, v))} />
                  </Panel>
                  <Panel titulo="Detalle de resultados no aptos" subtitulo="Resultados × meses" auto>
                    <TablaGlass columns={pivNo.columns} rows={pivNo.data} headers={{ resultado: 'Resultado' }} auto format={(c, v) => (c === 'resultado' ? String(v ?? '—') : fmtNum(c, v))} />
                  </Panel>
                </>
              )}
            </div>
            <div className="glass mt-2 flex items-center justify-center gap-3 rounded-2xl px-3 py-1.5">
              <button
                onClick={() => setPag(0)}
                disabled={pag === 0}
                aria-label="Tablas anteriores"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-tinta transition hover:bg-tinta/10 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-tinta/70">{pag + 1} de 2</span>
              <button
                onClick={() => setPag(1)}
                disabled={pag === 1}
                aria-label="Tablas siguientes"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-tinta transition hover:bg-tinta/10 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
