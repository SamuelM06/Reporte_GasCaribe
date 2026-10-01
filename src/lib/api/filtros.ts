export const MESES_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

export interface Filtros {
  anio?: number;
  mesNombre?: string;
  cabina?: string;
  clasificacion?: 'APTA' | 'NO APTA';
  producto?: string;
}

export function leerFiltros(url: URL): { f?: Filtros; error?: string } {
  const f: Filtros = {};
  const anioRaw = url.searchParams.get('anio');
  const mesRaw = url.searchParams.get('mes');
  const cabina = url.searchParams.get('cabina');
  const clas = url.searchParams.get('clasificacion');
  const prod = url.searchParams.get('producto');
  if (anioRaw != null) {
    const n = Number(anioRaw);
    if (!Number.isInteger(n)) return { error: 'anio invalido' };
    f.anio = n;
  }
  if (mesRaw != null) {
    const n = Number(mesRaw);
    if (!Number.isInteger(n) || n < 1 || n > 12) return { error: 'mes invalido (1-12)' };
    f.mesNombre = MESES_ES[n - 1];
  }
  if (cabina) f.cabina = cabina;
  if (clas) {
    if (clas !== 'APTA' && clas !== 'NO APTA') return { error: 'clasificacion invalida' };
    f.clasificacion = clas;
  }
  if (prod) f.producto = prod;
  return { f };
}

export interface WhereBuilt {
  where: string;
  params: unknown[];
}

// Filtros sobre inbound/outbound (alias de tabla opcional).
// Cabina = operador (cabina viene vacia del Excel). Producto via normalizar_producto().
export function whereGestion(f: Filtros, alias = '', base = 1): WhereBuilt {
  const p = alias ? `${alias}.` : '';
  const conds: string[] = [];
  const params: unknown[] = [];
  // OJO: el placeholder se calcula ANTES del push: base + cantidad actual.
  const add = (cond: (ph: string) => string, v: unknown): void => {
    const ph = `$${base + params.length}`;
    params.push(v);
    conds.push(cond(ph));
  };
  if (f.anio !== undefined) add((ph) => `${p}anio = ${ph}`, f.anio);
  if (f.mesNombre !== undefined) add((ph) => `${p}mes ILIKE ${ph}`, `${f.mesNombre} %`);
  if (f.cabina !== undefined) add((ph) => `${p}operador = ${ph}`, f.cabina);
  if (f.clasificacion !== undefined) add((ph) => `${p}clasificacion = ${ph}`, f.clasificacion);
  if (f.producto !== undefined) {
    add((ph) => `gestion_diaria.normalizar_producto(${p}producto) = ${ph}`, f.producto);
  }
  return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

// Filtros sobre caribe_abandono (mes por fecha_llamada).
export function whereAbandono(f: Filtros, alias = '', base = 1): WhereBuilt {
  const p = alias ? `${alias}.` : '';
  const conds: string[] = [];
  const params: unknown[] = [];
  const add = (cond: (ph: string) => string, v: unknown): void => {
    const ph = `$${base + params.length}`;
    params.push(v);
    conds.push(cond(ph));
  };
  if (f.anio !== undefined) add((ph) => `EXTRACT(YEAR FROM ${p}fecha_llamada) = ${ph}`, f.anio);
  if (f.mesNombre !== undefined) {
    add((ph) => `EXTRACT(MONTH FROM ${p}fecha_llamada) = ${ph}`, MESES_ES.indexOf(f.mesNombre) + 1);
  }
  return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

export function orderMeses(expr = 'mes'): string {
  const cases = MESES_ES.map((m, i) => `WHEN split_part(${expr}, ' ', 1) = '${m}' THEN ${i + 1}`).join(' ');
  return `CASE ${cases} ELSE 13 END`;
}
