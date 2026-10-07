import { motion } from 'motion/react';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Shield,
  TrendingUp,
  BarChart2,
  Building,
  Target,
} from 'lucide-react';

export function Panel({
  titulo,
  subtitulo,
  children,
  className = '',
  delay = 0,
  auto = false,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  auto?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`${auto ? 'glass flex flex-col overflow-hidden rounded-3xl p-3' : 'glass flex h-full min-h-0 flex-col overflow-hidden rounded-3xl p-3'} ${className}`}
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <h3 className="truncate text-sm font-extrabold tracking-tight">{titulo}</h3>
        {subtitulo && <span className="shrink-0 text-[11px] font-semibold text-tinta/55">{subtitulo}</span>}
      </div>
      <div className={auto ? '' : 'min-h-0 flex-1'}>{children}</div>
    </motion.section>
  );
}

// Iconos por columna semántica
const COLUMN_ICONS: Record<string, React.ReactNode> = {
  mes: <Calendar className="h-3.5 w-3.5" />,
  registros: <Users className="h-3.5 w-3.5" />,
  aptos: <CheckCircle className="h-3.5 w-3.5" />,
  no_aptos: <XCircle className="h-3.5 w-3.5" />,
  canc_venta: <ShoppingBag className="h-3.5 w-3.5" />,
  retenido: <Shield className="h-3.5 w-3.5" />,
  retenciones: <Target className="h-3.5 w-3.5" />,
  pct_retencion: <TrendingUp className="h-3.5 w-3.5" />,
  aseguradora: <Building className="h-3.5 w-3.5" />,
  resultado: <BarChart2 className="h-3.5 w-3.5" />,
  total: <TrendingUp className="h-3.5 w-3.5" />,
};

const COLUMN_ALIGN: Record<string, 'left' | 'center' | 'right'> = {
  mes: 'center',
  resultado: 'center',
  registros: 'center',
  aptos: 'center',
  no_aptos: 'center',
  canc_venta: 'center',
  retenido: 'center',
  retenciones: 'center',
  pct_retencion: 'center',
  aseguradora: 'center',
  total: 'center',
};

const COLUMN_WIDTH: Record<string, string> = {
  mes: '120px',
  resultado: '160px',
  pct_retencion: '90px',
};

export function TablaGlass({
  columns,
  rows,
  headers,
  format,
  auto = false,
}: {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  headers?: Record<string, string>;
  format?: (col: string, value: unknown) => string;
  auto?: boolean;
}) {
  const cell = (c: string, v: unknown): string => {
    if (format) return format(c, v);
    if (v == null) return '—';
    return String(v);
  };

  const getAlign = (c: string) => COLUMN_ALIGN[c] ?? 'center';
  const getWidth = (c: string) => COLUMN_WIDTH[c] ?? 'auto';

  return (
    <div className={`${auto ? 'overflow-x-auto' : 'h-full overflow-auto'} rounded-xl border border-tinta/10 bg-white/30 shadow-xl backdrop-blur-md dark:bg-white/3`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  style={{ width: getWidth(c), minWidth: getWidth(c) }}
                  className="whitespace-nowrap border-b border-tinta/15 bg-gradient-to-b from-tinta/5 to-transparent px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-tinta/70 dark:text-tinta/60"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {COLUMN_ICONS[c] && <span className="text-tinta/40 dark:text-tinta/50">{COLUMN_ICONS[c]}</span>}
                    <span>{headers?.[c] ?? c}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className="border-b border-tinta/5 transition-all duration-150 last:border-0 even:bg-tinta/3 hover:bg-tinta/10 dark:even:bg-white/3 dark:hover:bg-white/5"
              >
                {columns.map((c) => {
                  const align = getAlign(c);
                  const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
                  return (
                    <td
                      key={c}
                      className={`whitespace-nowrap px-3 py-2 font-medium ${alignClass} text-tinta/75`}
                    >
                      {cell(c, r[c])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface HeatCell {
  mes: string;
  mes_key: string;
  hora: number;
  n: number;
}

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function mesCorto(mesKey: string): string {
  const m = parseInt(mesKey.split('-')[1], 10);
  return MESES_CORTOS[m - 1] ?? mesKey;
}

export function HeatmapAbandono({ data }: { data: HeatCell[] }) {
  const meses = [...new Set(data.map((d) => d.mes_key))].sort();
  const max = Math.max(1, ...data.map((d) => d.n));
  const val = (mk: string, h: number) => data.find((d) => d.mes_key === mk && d.hora === h)?.n ?? 0;
  if (!meses.length) return <p className="text-xs">Sin datos.</p>;
  return (
    <div className="h-full overflow-auto">
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `52px repeat(24, 1fr)` }}>
        <span className="text-[9px] font-bold text-tinta/50">Mes / Hora</span>
        {Array.from({ length: 24 }, (_, h) => (
          <span key={`h${h}`} className="text-center text-[8px] font-bold text-tinta/50">{h}</span>
        ))}
        {meses.map((mk) => [
          <span key={`m${mk}`} className="flex items-center text-[10px] font-extrabold text-tinta/70">{mesCorto(mk)}</span>,
          ...Array.from({ length: 24 }, (_, h) => {
            const n = val(mk, h);
            const a = n === 0 ? 0 : 0.15 + 0.85 * (n / max);
            return (
              <span
                key={`${mk}-${h}`}
                title={`${mesCorto(mk)} ${h}h: ${n} casos`}
                className="flex min-h-[18px] items-center justify-center rounded text-[8px] font-bold"
                style={{
                  background: n === 0 ? 'transparent' : `rgba(220,38,38,${a.toFixed(2)})`,
                  color: a > 0.5 ? '#fff' : 'var(--c-tinta, #333)',
                }}
              >
                {n > 0 ? n : ''}
              </span>
            );
          }),
        ])}
      </div>
    </div>
  );
}
