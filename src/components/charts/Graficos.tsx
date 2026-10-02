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
function etiquetaFondo(color: string, fmt: (v: unknown) => string = (v) => String(v ?? ''), lado: 'arriba' | 'derecha' = 'arriba') {
  return (props: unknown) => {
    const p = (props ?? {}) as Record<string, unknown>;
    const x = Number(p.x ?? 0);
    const y = Number(p.y ?? 0);
    const texto = fmt(p.value);
    const w = texto.length * 6.8 + 14;
    const h = 18;
    if (lado === 'derecha') {
      return (
        <g>
          <rect x={x + 3} y={y - h / 2} width={w} height={h} rx={h / 2} fill={color} fillOpacity={0.22} />
          <text x={x + 3 + w / 2} y={y + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} fill="currentColor">{texto}</text>
        </g>
      );
    }
    return (
      <g>
        <rect x={x - w / 2} y={y - h - 3} width={w} height={h} rx={h / 2} fill={color} fillOpacity={0.22} />
        <text x={x} y={y - 3 - h / 2 + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} fill="currentColor">{texto}</text>
      </g>
    );
  };
}

export function TrendRetencion({ data }: { data: TrendPunto[] }) {
  const rows = data.map((d) => ({
    ...d,
    mesCorto: short(d.mes),
    pct: +(d.pct_retencion * 100).toFixed(1),
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
          <LabelList dataKey="outbound" position="top" content={etiquetaFondo('#3b82f6')} />
        </Bar>
        <Bar yAxisId="vol" dataKey="inbound" name="Inbound" fill="#94a3b8" radius={[6, 6, 0, 0]} animationDuration={700}>
          <LabelList dataKey="inbound" position="top" content={etiquetaFondo('#94a3b8')} />
        </Bar>
        <Bar yAxisId="vol" dataKey="retenciones" name="Retenciones" fill="#00cd93" radius={[6, 6, 0, 0]} animationDuration={700}>
          <LabelList dataKey="retenciones" position="top" content={etiquetaFondo('#00cd93')} />
        </Bar>
        <Line yAxisId="pct" type="monotone" dataKey="pct" name="% Retención" stroke="#047857" strokeWidth={3} dot={{ r: 4, fill: '#047857', strokeWidth: 2, stroke: '#fff' }} animationDuration={900}>
          <LabelList dataKey="pct" position="top" content={etiquetaFondo('#047857', (v) => `${v}%`)} />
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
          <Pie data={data} dataKey="n" nameKey="etiqueta" innerRadius="62%" outerRadius="92%" paddingAngle={2} animationDuration={800}>
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
