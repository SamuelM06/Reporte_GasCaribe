import { CalendarDays, Filter, RotateCcw, Building2, Tags, Package } from 'lucide-react';
import SelectXuma from '../ui2/SelectXuma.tsx';

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

const MESES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

export function qs(v: FiltroValor): string {
  const p = new URLSearchParams();
  if (v.anio) p.set('anio', v.anio);
  if (v.mes) p.set('mes', v.mes);
  if (v.cabina) p.set('cabina', v.cabina);
  if (v.clasificacion) p.set('clasificacion', v.clasificacion);
  if (v.producto) p.set('producto', v.producto);
  return p.toString();
}

export default function FiltrosBar({
  opciones,
  valor,
  onChange,
  onReset,
  conProducto = true,
}: {
  opciones: Opciones | null;
  valor: FiltroValor;
  onChange: (v: FiltroValor) => void;
  onReset: () => void;
  conProducto?: boolean;
}) {
  const set = (k: keyof FiltroValor) => (vv: string) => onChange({ ...valor, [k]: vv });
  const activos = [valor.mes, valor.cabina, valor.clasificacion, valor.producto].filter(Boolean).length;
  return (
    <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-2">
      <span className="flex items-center gap-1.5 px-2 text-xs font-bold text-tinta/60">
        <Filter className="h-4 w-4" /> Filtros
        {activos > 0 && <span className="rounded-full bg-xuma-verde-oscuro px-2 py-0.5 text-[10px] text-white">{activos}</span>}
      </span>
      <SelectXuma
        valor={valor.mes}
        opciones={MESES.map((m, i) => ({ valor: String(i + 1), etiqueta: m }))}
        alCambiar={set('mes')}
        placeholder="Mes"
        icono={<CalendarDays className="h-4 w-4" />}
        compact
      />
      <SelectXuma
        valor={valor.cabina}
        opciones={(opciones?.cabinas ?? []).map((c) => ({ valor: c.cabina, etiqueta: c.cabina }))}
        alCambiar={set('cabina')}
        placeholder="Cabina"
        icono={<Building2 className="h-4 w-4" />}
        compact
      />
      <SelectXuma
        valor={valor.clasificacion}
        opciones={[
          { valor: 'APTA', etiqueta: 'Apta' },
          { valor: 'NO APTA', etiqueta: 'No apta' },
        ]}
        alCambiar={set('clasificacion')}
        placeholder="Clasificación"
        icono={<Tags className="h-4 w-4" />}
        compact
      />
      {conProducto && (
        <SelectXuma
          valor={valor.producto}
          opciones={(opciones?.productos ?? []).map((p) => ({ valor: p.producto, etiqueta: p.producto }))}
          alCambiar={set('producto')}
          placeholder="Producto"
          icono={<Package className="h-4 w-4" />}
          compact
        />
      )}
      <button
        onClick={onReset}
        className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-tinta/60 transition hover:bg-tinta/10 hover:text-tinta"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Limpiar
      </button>
    </div>
  );
}
