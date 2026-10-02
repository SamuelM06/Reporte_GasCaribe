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

// Solo primera en mayúscula para mostrar (el valor crudo se conserva para el backend).
const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

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
  conCabina = true,
}: {
  opciones: Opciones | null;
  valor: FiltroValor;
  onChange: (v: FiltroValor) => void;
  onReset: () => void;
  conProducto?: boolean;
  conCabina?: boolean;
}) {
  const set = (k: keyof FiltroValor) => (vv: string) => onChange({ ...valor, [k]: vv });
  const activos = [valor.mes, valor.cabina, valor.clasificacion, valor.producto].filter(Boolean).length;
  return (
    <div className="glass relative z-40 flex flex-wrap items-stretch gap-2 rounded-2xl p-2">
      <span className="flex items-center gap-1.5 px-2 text-xs font-bold text-tinta/60">
        <Filter className="h-4 w-4" /> Filtros
        {activos > 0 && <span className="rounded-full bg-xuma-verde-oscuro px-2 py-0.5 text-[10px] text-white">{activos}</span>}
      </span>
      <div className="min-w-[140px] flex-1">
      <SelectXuma
        valor={valor.mes}
        opciones={MESES.map((m, i) => ({ valor: String(i + 1), etiqueta: cap(m) }))}
        alCambiar={set('mes')}
        placeholder="Mes"
        icono={<CalendarDays className="h-4 w-4" />}
        compact
        desplegableClase="w-full"
      />
      </div>
      {conCabina && (
      <div className="min-w-[140px] flex-1">
      <SelectXuma
        valor={valor.cabina}
        opciones={[
          { valor: 'in', etiqueta: 'Cabina Inbound' },
          { valor: 'out', etiqueta: 'Cabina Outbound' },
        ]}
        alCambiar={set('cabina')}
        placeholder="Cabina"
        icono={<Building2 className="h-4 w-4" />}
        compact
        desplegableClase="w-full"
      />
      </div>
      )}
      <div className="min-w-[140px] flex-1">
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
        desplegableClase="w-full"
      />
      </div>
      {conProducto && (
        <div className="min-w-[140px] flex-1">
        <SelectXuma
          valor={valor.producto}
          opciones={(opciones?.productos ?? []).map((p) => ({ valor: p.producto, etiqueta: cap(p.producto) }))}
          alCambiar={set('producto')}
          placeholder="Producto"
          icono={<Package className="h-4 w-4" />}
          compact
          desplegableClase="w-full"
        />
        </div>
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
