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
import { CHART_COLORS, GLASS_TOOLTIP } from './palette.jsx';

export interface TrendPunto {
  mes: string;
  inbound: number;
  outbound: number;
  retenciones: number;
  pct_retencion: number;
}

const short = (m: string) => m.split(' ')[0].slice(0, 3);

export function TrendRetencion({ data }: { data: TrendPunto[] }) {
  const rows = data.map((d) => ({
    ...d,
    mesCorto: short(d.mes),
    pct: +(d.pct_retencion * 100).toFixed(1),
    pctTxt: `${+(d.pct_retencion * 100).toFixed(1)}%`,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={rows} margin={{ top: 20, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--cglass-borde)" vertical={false} />
        <XAxis dataKey="mesCorto" tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={false} />
        <YAxis yAxisId="vol" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
        <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} unit="%" />
        <Tooltip contentStyle={GLASS_TOOLTIP} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="vol" dataKey="outbound" name="Outbound" fill="#3b82f6" radius={[6, 6, 0, 0]} animationDuration={700}>
          <LabelList dataKey="outbound" position="top" fontSize={10} fontWeight={700} />
        </Bar>
        <Bar yAxisId="vol" dataKey="inbound" name="Inbound" fill="#94a3b8" radius={[6, 6, 0, 0]} animationDuration={700}>
          <LabelList dataKey="inbound" position="top" fontSize={10} fontWeight={700} />
        </Bar>
        <Bar yAxisId="vol" dataKey="retenciones" name="Retenciones" fill="#00cd93" radius={[6, 6, 0, 0]} animationDuration={700}>
          <LabelList dataKey="retenciones" position="top" fontSize={10} fontWeight={700} />
        </Bar>
        <Line yAxisId="pct" type="monotone" dataKey="pct" name="% Retención" stroke="#047857" strokeWidth={3} dot={{ r: 4, fill: '#047857', strokeWidth: 2, stroke: '#fff' }} animationDuration={900}>
          <LabelList dataKey="pctTxt" position="top" fontSize={10} fontWeight={800} fill="#047857" />
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
          <LabelList dataKey="inbound" position="top" fontSize={10} fontWeight={700} fill="#3b82f6" />
        </Line>
        <Line type="monotone" dataKey="outbound" name="Outbound" stroke="#00cd93" strokeWidth={3} dot={{ r: 3 }} animationDuration={700}>
          <LabelList dataKey="outbound" position="top" fontSize={10} fontWeight={700} fill="#047857" />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DonutCabinas({ data }: { data: Array<{ cabina: string; n: number }> }) {
  const top = data.slice(0, 7);
  const total = data.reduce((a, d) => a + d.n, 0) || 1;
  return (
    <div className="flex h-full items-center gap-3">
      <ResponsiveContainer width="45%" height="100%">
        <PieChart>
          <Pie data={top} dataKey="n" nameKey="cabina" innerRadius="62%" outerRadius="92%" paddingAngle={2} animationDuration={800}>
            {top.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={GLASS_TOOLTIP} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-auto text-xs font-bold">
        {top.map((d, i) => (
          <span key={d.cabina} className="truncate">
            <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            {d.cabina} — {d.n.toLocaleString('es-CO')} ({((d.n / total) * 100).toFixed(1)}%)
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
          <LabelList dataKey="n" position="right" fontSize={11} fontWeight={800} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
