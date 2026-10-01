export interface KpiItem {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <div className="kpis">
      {items.map((k) => (
        <div className="kpi" key={k.label}>
          <div className="label">{k.label}</div>
          <div className="value" style={k.color ? { color: k.color } : undefined}>
            {k.value}
          </div>
          {k.sub ? <div className="sub">{k.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}

export interface Opciones {
  meses: Array<{ anio: number; mes: string }>;
  cabinas: Array<{ cabina: string }>;
  clasificaciones: string[];
  productos: Array<{ producto: string }>;
}

export interface FiltroValor {
  anio: string;
  mes: string;
  cabina: string;
  clasificacion: string;
  producto: string;
}

export const FILTRO_VACIO: FiltroValor = { anio: '2026', mes: '', cabina: '', clasificacion: '', producto: '' };

const MESES_NOMBRE = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

export function FilterBar({
  opciones,
  valor,
  onChange,
  conProducto = true,
}: {
  opciones: Opciones | null;
  valor: FiltroValor;
  onChange: (v: FiltroValor) => void;
  conProducto?: boolean;
}) {
  const set = (k: keyof FiltroValor) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...valor, [k]: e.target.value });
  return (
    <div className="filters">
      <select value={valor.anio} onChange={set('anio')} aria-label="Año">
        <option value="2026">2026</option>
      </select>
      <select value={valor.mes} onChange={set('mes')} aria-label="Mes">
        <option value="">Todos los meses</option>
        {MESES_NOMBRE.map((m, i) => (
          <option key={m} value={String(i + 1)}>
            {m}
          </option>
        ))}
      </select>
      <select value={valor.cabina} onChange={set('cabina')} aria-label="Cabina">
        <option value="">Todas las cabinas</option>
        {(opciones?.cabinas ?? []).map((c) => (
          <option key={c.cabina} value={c.cabina}>
            {c.cabina}
          </option>
        ))}
      </select>
      <select value={valor.clasificacion} onChange={set('clasificacion')} aria-label="Clasificación">
        <option value="">Apta + No apta</option>
        <option value="APTA">Apta</option>
        <option value="NO APTA">No apta</option>
      </select>
      {conProducto ? (
        <select value={valor.producto} onChange={set('producto')} aria-label="Producto">
          <option value="">Todos los productos</option>
          {(opciones?.productos ?? []).map((p) => (
            <option key={p.producto} value={p.producto}>
              {p.producto}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

export function qs(v: FiltroValor): string {
  const p = new URLSearchParams();
  if (v.anio) p.set('anio', v.anio);
  if (v.mes) p.set('mes', v.mes);
  if (v.cabina) p.set('cabina', v.cabina);
  if (v.clasificacion) p.set('clasificacion', v.clasificacion);
  if (v.producto) p.set('producto', v.producto);
  return p.toString();
}

export function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('es-CO');
}

export function pct(x: number | null | undefined): string {
  if (x == null) return '—';
  return `${(Number(x) * 100).toFixed(1)}%`;
}
