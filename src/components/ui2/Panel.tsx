import { motion } from 'motion/react';

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
  // auto: altura natural sin scroll interno (para vistas con scroll de página).
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
  // auto: sin alto fijo ni scroll vertical interno (crece con el contenido).
  auto?: boolean;
}) {
  const cell = (c: string, v: unknown): string => {
    if (format) return format(c, v);
    if (v == null) return '—';
    return String(v);
  };
  return (
    <div className={`${auto ? 'overflow-x-auto' : 'h-full overflow-auto'} rounded-xl border border-tinta/10 bg-white/40 shadow-lg backdrop-blur-md dark:bg-white/5`}>
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr>
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap border-b border-white/20 bg-xuma-azul px-2.5 py-2 text-center text-[11px] font-bold text-white shadow first:text-left dark:bg-xuma-azul-2">
                {headers?.[c] ?? c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-tinta/10 transition-colors last:border-0 even:bg-tinta/5 hover:bg-tinta/10">
              {columns.map((c) => (
                <td key={c} className="whitespace-nowrap px-2.5 py-1.5 text-center font-bold first:text-left">
                  {cell(c, r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface HeatCell {
  mes: string;
  hora: number;
  n: number;
}

export function HeatmapAbandono({ data }: { data: HeatCell[] }) {
  const meses = [...new Set(data.map((d) => d.mes))].sort();
  const max = Math.max(1, ...data.map((d) => d.n));
  const val = (mes: string, h: number) => data.find((d) => d.mes === mes && d.hora === h)?.n ?? 0;
  if (!meses.length) return <p className="text-xs">Sin datos.</p>;
  return (
    <div className="h-full overflow-auto">
      <div className="grid gap-1" style={{ gridTemplateColumns: `34px repeat(${meses.length}, 1fr)` }}>
        <span />
        {meses.map((m) => (
          <strong key={m} className="text-center text-[10px]">{m.slice(5)}</strong>
        ))}
        {Array.from({ length: 24 }, (_, h) => [
          <span key={`h${h}`} className="text-[10px] font-extrabold">{h}h</span>,
          ...meses.map((m) => {
            const n = val(m, h);
            const a = 0.06 + 0.94 * (n / max);
            return (
              <span
                key={`${m}${h}`}
                title={`${m} ${h}h: ${n}`}
                className="min-h-[15px] rounded"
                style={{ background: `rgba(0,205,147,${a.toFixed(2)})` }}
              />
            );
          }),
        ])}
      </div>
    </div>
  );
}
