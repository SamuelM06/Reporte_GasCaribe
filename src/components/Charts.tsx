export interface TrendPunto {
  mes: string;
  inbound: number;
  outbound: number;
  retenciones: number;
  pct_retencion: number;
}

const C_OUT = ['#3b82f6', '#120180'];
const C_IN = ['#94a3b8', '#475569'];
const C_RET = ['#34d399', '#047857'];

function grad(id: string, c1: string, c2: string) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={c1} />
      <stop offset="100%" stopColor={c2} />
    </linearGradient>
  );
}

// Barras Outbound/Inbound/Retenciones por mes + linea % retencion (SVG animado).
export function TrendChart({ data }: { data: TrendPunto[] }) {
  const W = 900;
  const H = 300;
  const TOP = 46;
  if (!data.length) return <p>Sin datos.</p>;
  const maxV = Math.max(1, ...data.map((d) => Math.max(d.inbound, d.outbound, d.retenciones)));
  const maxP = Math.max(0.001, ...data.map((d) => d.pct_retencion));
  const step = W / data.length;
  const bw = Math.min(30, step / 4);
  const yOf = (v: number) => TOP + H - (v / maxV) * H;
  const ypOf = (p: number) => TOP + H - (p / maxP) * H * 0.55;
  const xc = (i: number) => (i + 0.5) * step;
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xc(i).toFixed(0)},${ypOf(d.pct_retencion).toFixed(0)}`).join(' ');
  const short = (m: string) => m.split(' ')[0].slice(0, 3);
  return (
    <svg viewBox={`0 0 ${W} ${TOP + H + 46}`} style={{ width: '100%', height: '100%' }} role="img">
      <defs>
        {grad('gOut', C_OUT[0], C_OUT[1])}
        {grad('gIn', C_IN[0], C_IN[1])}
        {grad('gRet', C_RET[0], C_RET[1])}
      </defs>
      <line x1="0" y1={TOP + H} x2={W} y2={TOP + H} stroke="var(--line)" strokeDasharray="4 4" />
      <path d={`${line} L${(xc(data.length - 1)).toFixed(0)},${TOP + H} L${xc(0).toFixed(0)},${TOP + H} Z`} fill="#00cd93" opacity="0.12" />
      <path d={line} fill="none" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" />
      {data.map((d, i) => {
        const bars: Array<[number, string, number]> = [
          [d.outbound, 'url(#gOut)', xc(i) - bw * 1.5 - 4],
          [d.inbound, 'url(#gIn)', xc(i) - bw / 2],
          [d.retenciones, 'url(#gRet)', xc(i) + bw / 2 + 4],
        ];
        return (
          <g key={d.mes} className="bar-group" style={{ animationDelay: `${i * 0.06}s` }}>
            {bars.map(([v, fill, x], j) => (
              <g key={j}>
                <rect x={x} y={yOf(v)} width={bw} height={Math.max(0, TOP + H - yOf(v))} rx="5" fill={fill} />
                <text x={x + bw / 2} y={Math.max(yOf(v) - 6, 12)} textAnchor="middle" fontSize="11" fontWeight="800" fill="currentColor">
                  {v.toLocaleString('es-CO')}
                </text>
              </g>
            ))}
            <text x={xc(i)} y={TOP + H + 18} textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
              {short(d.mes)}
            </text>
            <text x={xc(i)} y={ypOf(d.pct_retencion) - 10} textAnchor="middle" fontSize="12" fontWeight="900" fill="#047857">
              {(d.pct_retencion * 100).toFixed(1)}%
            </text>
            <circle cx={xc(i)} cy={ypOf(d.pct_retencion)} r="5" fill="#047857" stroke="#fff" strokeWidth="2.5" />
          </g>
        );
      })}
    </svg>
  );
}

// Lineas por cabina: serie inbound vs outbound de retenciones.
export interface CabinaSerie {
  mes: string;
  cabina: string;
  src: string;
  retenciones: number;
}

const PALETTE = ['#120180', '#00cd93', '#38bdf8', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export function CabinaLines({ data }: { data: CabinaSerie[] }) {
  const W = 900;
  const H = 260;
  const TOP = 30;
  const meses = [...new Set(data.map((d) => d.mes))];
  const cabinas = [...new Set(data.map((d) => d.cabina))].slice(0, 7);
  if (!meses.length) return <p>Sin datos.</p>;
  const maxV = Math.max(1, ...data.map((d) => d.retenciones));
  const step = W / Math.max(1, meses.length);
  const xc = (i: number) => (i + 0.5) * step;
  const yOf = (v: number) => TOP + H - (v / maxV) * H;
  const series: Array<{ key: string; color: string; pts: number[] }> = [];
  cabinas.forEach((c, ci) => {
    (['in', 'out'] as const).forEach((s, si) => {
      const pts = meses.map((m) => data.find((d) => d.mes === m && d.cabina === c && d.src === s)?.retenciones ?? 0);
      if (pts.some((v) => v > 0)) {
        series.push({
          key: `${c} ${s === 'in' ? 'IN' : 'OUT'}`,
          color: PALETTE[(ci * 2 + si) % PALETTE.length]!,
          pts,
        });
      }
    });
  });
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${TOP + H + 30}`} style={{ width: '100%', minHeight: 220 }} role="img">
        <line x1="0" y1={TOP + H} x2={W} y2={TOP + H} stroke="var(--line)" strokeDasharray="4 4" />
        {series.map((s) => (
          <polyline
            key={s.key}
            points={s.pts.map((v, i) => `${xc(i).toFixed(0)},${yOf(v).toFixed(0)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
          />
        ))}
        {meses.map((m, i) => (
          <text key={m} x={xc(i)} y={TOP + H + 18} textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
            {m.split(' ')[0].slice(0, 3)}
          </text>
        ))}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11, fontWeight: 700 }}>
        {series.map((s) => (
          <span key={s.key}>
            <span style={{ display: 'inline-block', width: 16, height: 3, background: s.color, marginRight: 4 }} />
            {s.key}
          </span>
        ))}
      </div>
    </div>
  );
}

// Dona por cabina.
export function Donut({ data }: { data: Array<{ cabina: string; n: number }> }) {
  const total = data.reduce((a, d) => a + d.n, 0) || 1;
  let acc = 0;
  const R = 70;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', height: '100%' }}>
      <svg viewBox="0 0 180 180" style={{ height: '100%', maxHeight: 220 }}>
        {data.slice(0, 8).map((d, i) => {
          const frac = d.n / total;
          const el = (
            <circle
              key={d.cabina}
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth="26"
              strokeDasharray={`${(frac * C).toFixed(1)} ${C.toFixed(1)}`}
              strokeDashoffset={(-acc * C).toFixed(1)}
              transform="rotate(-90 90 90)"
            />
          );
          acc += frac;
          return el;
        })}
        <text x="90" y="86" textAnchor="middle" fontSize="22" fontWeight="900" fill="currentColor">
          {total.toLocaleString('es-CO')}
        </text>
        <text x="90" y="106" textAnchor="middle" fontSize="11" fill="currentColor">
          registros
        </text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data.slice(0, 8).map((d, i) => (
          <span key={d.cabina}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: PALETTE[i % PALETTE.length], marginRight: 6 }} />
            {d.cabina} — {d.n.toLocaleString('es-CO')} ({((d.n / total) * 100).toFixed(1)}%)
          </span>
        ))}
      </div>
    </div>
  );
}

// Barras top productos.
export function ProductBars({ data }: { data: Array<{ producto: string; n: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  const total = data.reduce((a, d) => a + d.n, 0) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', height: '100%' }}>
      {data.map((d) => (
        <div key={d.producto} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 4, alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {d.producto} <span style={{ color: 'var(--muted)' }}>{((d.n / total) * 100).toFixed(1)}%</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 900 }}>{d.n.toLocaleString('es-CO')}</div>
          <div style={{ gridColumn: '1 / -1', height: 12, background: 'var(--line)', borderRadius: 8 }}>
            <div
              className="bar-group"
              style={{ width: `${((d.n / max) * 100).toFixed(1)}%`, height: '100%', borderRadius: 8, background: 'linear-gradient(90deg,#120180,#2563eb)' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Mapa de calor hora x mes.
export interface HeatCell {
  mes: string;
  hora: number;
  n: number;
}

export function Heatmap({ data }: { data: HeatCell[] }) {
  const meses = [...new Set(data.map((d) => d.mes))].sort();
  const max = Math.max(1, ...data.map((d) => d.n));
  const val = (mes: string, h: number) => data.find((d) => d.mes === mes && d.hora === h)?.n ?? 0;
  const alpha = (n: number) => 0.08 + 0.92 * (n / max);
  return (
    <div className="scroll-inner">
      <div className="heat" style={{ gridTemplateColumns: `52px repeat(${meses.length}, 1fr)` }}>
        <span />
        {meses.map((m) => (
          <strong key={m} style={{ fontSize: 11, textAlign: 'center' }}>
            {m.slice(5)}
          </strong>
        ))}
        {Array.from({ length: 24 }, (_, h) => (
          <>
            <span key={`h${h}`} style={{ fontSize: 11, fontWeight: 800 }}>
              {h}h
            </span>
            {meses.map((m) => {
              const n = val(m, h);
              return (
                <span
                  key={`${m}${h}`}
                  className="cell"
                  title={`${m} ${h}h: ${n}`}
                  style={{ background: `rgba(0,205,147,${alpha(n).toFixed(2)})`, border: '1px solid var(--line)' }}
                />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: Array<Record<string, unknown>> }) {
  return (
    <div className="scroll-inner">
      <table className="data">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c}>{r[c] == null ? '—' : String(r[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
