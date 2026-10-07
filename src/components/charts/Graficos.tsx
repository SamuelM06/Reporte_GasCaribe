import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GLASS_TOOLTIP } from './palette.jsx';

export interface TrendPunto {
  mes: string;
  inbound: number;
  outbound: number;
  retenciones: number;
  pct_retencion: number;
}

const short = (m: string) => m.split(' ')[0].slice(0, 3);

// Etiqueta negrita con píldora translúcida del color de la serie (queda bien en claro y oscuro).
// OJO recharts: a content personalizado le llegan x/y del elemento, NO el ancla;
// el ancla real se calcula aquí desde viewBox (geometría del sector/punto).
function etiquetaFondo(color: string, fmt: (v: unknown) => string = (v) => String(v ?? ''), lado: 'arriba' | 'derecha' = 'arriba') {
  return (props: unknown) => {
    const p = (props ?? {}) as Record<string, unknown>;
    const vb = (p.viewBox ?? {}) as { x?: unknown; y?: unknown; width?: unknown; height?: unknown };
    const nums = [vb.x, vb.y, vb.width, vb.height].map((v) => (typeof v === 'number' ? v : NaN));
    const caja = nums.every((v) => !Number.isNaN(v));
    const texto = fmt(p.value);
    const w = texto.length * 6.8 + 14;
    const h = 18;
    if (lado === 'derecha') {
      const ax = caja ? (nums[0] as number) + (nums[2] as number) : Number(p.x ?? 0);
      const ay = caja ? (nums[1] as number) + (nums[3] as number) / 2 : Number(p.y ?? 0);
      return (
        <g>
          <rect x={ax + 4} y={ay - h / 2} width={w} height={h} rx={h / 2} fill={color} fillOpacity={0.22} />
          <text x={ax + 4 + w / 2} y={ay + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} fill="currentColor">{texto}</text>
        </g>
      );
    }
    const ax = caja ? (nums[0] as number) + (nums[2] as number) / 2 : Number(p.x ?? 0);
    const ay = caja ? (nums[1] as number) : Number(p.y ?? 0);
    return (
      <g>
        <rect x={ax - w / 2} y={ay - h - 4} width={w} height={h} rx={h / 2} fill={color} fillOpacity={0.22} />
        <text x={ax} y={ay - 4 - h / 2 + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} fill="currentColor">{texto}</text>
      </g>
    );
  };
}

// Valor dentro de cada porción de la dona (blanco negrita sobre el color).
function etiquetaDona(props: unknown) {
  const p = (props ?? {}) as Record<string, unknown>;
  const vb = (p.viewBox ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number => (typeof v === 'number' ? v : 0);
  const cx = num(vb.cx ?? p.cx);
  const cy = num(vb.cy ?? p.cy);
  const ri = num(vb.innerRadius ?? p.innerRadius);
  const ro = num(vb.outerRadius ?? p.outerRadius);
  const a0 = num(vb.startAngle ?? p.startAngle);
  const a1 = num(vb.endAngle ?? p.endAngle);
  const mid = ((a0 + a1) / 2) * (Math.PI / 180);
  const r = ri + (ro - ri) / 2;
  const x = cx + r * Math.cos(-mid);
  const y = cy + r * Math.sin(-mid);
  const v = p.value;
  const texto = typeof v === 'number' ? v.toLocaleString('es-CO') : String(v ?? '');
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={800} fill="#fff">
      {texto}
    </text>
  );
}

export function TrendRetencion({ data }: { data: TrendPunto[] }) {
  const rows = data.map((d) => ({
    ...d,
    mesCorto: short(d.mes),
    pct: +(d.pct_retencion * 100).toFixed(1),
  }));
  const maxVol = Math.max(...rows.map((r) => r.outbound + r.inbound + r.retenciones), 1);
  const maxPct = Math.max(...rows.map((r) => r.pct), 0);
  const pctScaled = rows.map((r) => ({
    ...r,
    pctScaled: (r.pct / 100) * maxVol * 3,
  }));
  const domainMax = Math.max(maxVol, (maxPct / 100) * maxVol * 3) * 1.1;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={pctScaled} margin={{ top: 20, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--cglass-borde)" vertical={false} />
        <XAxis dataKey="mesCorto" tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={false} />
        <YAxis yAxisId="vol" domain={[0, domainMax]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
        <Tooltip contentStyle={GLASS_TOOLTIP} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="vol" dataKey="outbound" name="Outbound" fill="#3b82f6" radius={[6, 6, 0, 0]} animationDuration={700}>
          <LabelList dataKey="outbound" position="top" content={etiquetaFondo('#3b82f6')} />
        </Bar>
        <Bar yAxisId="vol" dataKey="inbound" name="Inbound" fill="#94a3b8" radius={[6, 6, 0, 0]} animationDuration={700}>
          <LabelList dataKey="inbound" position="top" content={etiquetaFondo('#94a3b8')} />
        </Bar>
        <Bar yAxisId="vol" dataKey="retenciones" name="Retenciones" fill="#00cd93" radius={[6, 6, 0, 0]} animationDuration={700}>
          <LabelList dataKey="retenciones" position="top" content={etiquetaFondo('#00cd93')} />
        </Bar>
        <Line yAxisId="vol" type="monotone" dataKey="pctScaled" name="% Retención" stroke="#047857" strokeWidth={3} dot={{ r: 4, fill: '#047857', strokeWidth: 2, stroke: '#fff' }} animationDuration={900}>
          <LabelList dataKey="pctScaled" position="top" content={etiquetaFondo('#047857', (v: any) => `${((v / maxVol) * 100 / 3).toFixed(1)}%`)} />
        </Line>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export interface CabinaSerie {
  mes: string;
  cabina: string;
  src: string;
  retenciones: number;
}

// Tendencia de retenciones totales: una línea inbound y otra outbound (respeta el filtro de cabina).
export function CabinasLines({ data }: { data: CabinaSerie[] }) {
  const meses = [...new Set(data.map((d) => d.mes))];
  const rows = meses.map((m) => ({
    mes: short(m),
    inbound: data.filter((d) => d.mes === m && d.src === 'in').reduce((a, d) => a + d.retenciones, 0),
    outbound: data.filter((d) => d.mes === m && d.src === 'out').reduce((a, d) => a + d.retenciones, 0),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={{ top: 20, right: 16, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--cglass-borde)" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
        <Tooltip contentStyle={GLASS_TOOLTIP} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="inbound" name="Inbound" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} animationDuration={700}>
          <LabelList dataKey="inbound" position="top" content={etiquetaFondo('#3b82f6')} />
        </Line>
        <Line type="monotone" dataKey="outbound" name="Outbound" stroke="#00cd93" strokeWidth={3} dot={{ r: 3 }} animationDuration={700}>
          <LabelList dataKey="outbound" position="top" content={etiquetaFondo('#00cd93')} />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}

// Dona IN vs OUT por cabina: cada porción con su valor y % del total.
export function DonutCabinas({ data }: { data: Array<{ etiqueta: string; n: number }> }) {
  const total = data.reduce((a, d) => a + d.n, 0) || 1;
  const colores = ['#3b82f6', '#00cd93', '#8b5cf6', '#f59e0b'];
  return (
    <div className="flex h-full items-center gap-3">
      <ResponsiveContainer width="45%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="n" nameKey="etiqueta" innerRadius="62%" outerRadius="92%" paddingAngle={2} animationDuration={800} label={etiquetaDona} labelLine={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={colores[i % colores.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={GLASS_TOOLTIP} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-auto text-xs font-bold">
        {data.map((d, i) => (
          <span key={d.etiqueta} className="truncate" title={`${d.etiqueta} — ${d.n.toLocaleString('es-CO')} (${((d.n / total) * 100).toFixed(1)}%)`}>
            <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded" style={{ background: colores[i % colores.length] }} />
            {d.etiqueta} — {d.n.toLocaleString('es-CO')} ({((d.n / total) * 100).toFixed(1)}%)
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProductosBars({ data }: { data: Array<{ producto: string; n: number }> }) {
  const rows = [...data].sort((a, b) => b.n - a.n);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--cglass-borde)" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="producto" width={150} tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={GLASS_TOOLTIP} />
        <Bar dataKey="n" name="Casos" radius={[0, 8, 8, 0]} animationDuration={700}>
          {rows.map((_, i) => (
            <Cell key={i} fill={i === 0 ? '#00cd93' : '#3b82f6'} />
          ))}
          <LabelList dataKey="n" position="right" content={etiquetaFondo('#3b82f6', (v) => String(v ?? ''), 'derecha')} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface FunnelKpis {
  total_general: number;
  inbound: number;
  outbound: number;
  aptas: number;
  no_aptas: number;
  retenciones: number;
  pct_retencion: number;
}

const FUNNEL_STEPS = [
  { key: 'total_general', label: 'Total general', color: '#3b82f6' },
  { key: 'inbound', label: 'Inbound', color: '#8b5cf6' },
  { key: 'outbound', label: 'Outbound', color: '#06b6d4' },
  { key: 'aptas', label: 'Aptas', color: '#00cd93' },
  { key: 'no_aptas', label: 'No aptas', color: '#f59e0b' },
  { key: 'retenciones', label: 'Retenciones', color: '#047857' },
] as const;

export function FunnelGestion({ kpis }: { kpis?: Partial<FunnelKpis> | Record<string, number> | null }) {
  if (!kpis || typeof kpis !== 'object' || kpis.total_general === undefined) {
    return (
      <div className="w-full h-full flex items-center justify-center text-tinta/50 text-sm">
        Cargando embudo...
      </div>
    );
  }
  const maxVal = Math.max(kpis.total_general || 1, 1);
  const steps = FUNNEL_STEPS.map((s) => {
    const val = (kpis as Record<string, number>)[s.key] ?? 0;
    return {
      ...s,
      value: val,
      pctOfTotal: maxVal > 0 ? (val / maxVal) * 100 : 0,
      pctOfPrev: 0,
    };
  });
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1].value || 1;
    steps[i].pctOfPrev = (steps[i].value / prev) * 100;
  }
  const rawPct = (kpis as Record<string, number>).pct_retencion ?? 0;
  const pctRetencion = rawPct <= 1 ? rawPct * 100 : rawPct;
  const stepHeight = 34;
  const gap = 4;
  const svgHeight = steps.length * (stepHeight + gap) + 32;
  const svgWidth = 280;
  const maxFunnelWidth = 220;
  const minFunnelWidth = 76;
  const funnelOffsetX = (svgWidth - maxFunnelWidth) / 2;
  return (
    <div className="w-full h-full flex items-center justify-center p-1">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        <defs>
          <linearGradient id="funnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00cd93" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <g transform={`translate(${funnelOffsetX}, 6)`}>
          {steps.map((step, i) => {
            const width = Math.max((step.pctOfTotal / 100) * maxFunnelWidth, minFunnelWidth);
            const x = (maxFunnelWidth - width) / 2;
            const y = i * (stepHeight + gap);
            const isLast = i === steps.length - 1;
            const nextWidth = isLast ? Math.max(width - 8, minFunnelWidth) : Math.max((steps[i + 1].pctOfTotal / 100) * maxFunnelWidth, minFunnelWidth);
            const nextX = (maxFunnelWidth - nextWidth) / 2;
            const centerX = maxFunnelWidth / 2;
            const centerY = y + stepHeight / 2;
            return (
              <g key={step.key} className="cursor-default">
                <title>{`${step.label}: ${step.value.toLocaleString('es-CO')} (${step.pctOfTotal.toFixed(1)}%)`}</title>
                <path
                  d={isLast
                    ? `M ${x} ${y} L ${x + width} ${y} L ${x + width - 5} ${y + stepHeight} L ${x + 5} ${y + stepHeight} Z`
                    : `M ${x} ${y} L ${x + width} ${y} L ${nextX + nextWidth} ${y + stepHeight} L ${nextX} ${y + stepHeight} Z`}
                  fill={step.color}
                  fillOpacity={0.88}
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth={0.5}
                />
                <text
                  x={centerX}
                  y={centerY - 7.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={6}
                  fontWeight={700}
                  fill="white"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
                >
                  {step.label}
                </text>
                <text
                  x={centerX}
                  y={centerY + 0.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={7.5}
                  fontWeight={800}
                  fill="white"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
                >
                  {step.value.toLocaleString('es-CO')}
                </text>
                <text
                  x={centerX}
                  y={centerY + 8}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={5.2}
                  fontWeight={600}
                  fill="rgba(255,255,255,0.9)"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
                >
                  {step.pctOfTotal.toFixed(1)}%
                </text>
              </g>
            );
          })}
          <g transform={`translate(${maxFunnelWidth / 2}, ${steps.length * (stepHeight + gap) + 6})`}>
            <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={7.5} fontWeight={800} fill="currentColor">
              % Ret: {pctRetencion.toFixed(1)}%
            </text>
            <text x={0} y={10} textAnchor="middle" dominantBaseline="central" fontSize={6} fill="#94a3b8">
              (Ret/Aptas)
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
