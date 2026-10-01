import { normalizarTexto } from './normalizarTexto.js';

// Espejo TS de gestion_diaria.normalizar_producto(). Misma tabla de decision.
export function normalizarProducto(input: string | null | undefined): string {
  const v = normalizarTexto(input);
  if (v == null) return 'SIN REGISTRO';
  if (['sin registro', 'no aplica', 'no apto', 'datos incompletos', 'pendiente vuelve a llamar', 'ojo se callo llamada'].includes(v) || /^[0-9 ]+$/.test(v)) {
    return 'SIN REGISTRO';
  }
  if (/practiseguro|practisegruo|practi plus/.test(v)) return 'PRACTISEGURO';
  if (/funerario|fuenrario|furnrario|eguro funerario|aeguro funerario/.test(v)) return 'SEGURO FUNERARIO';
  if (/futuro protegido plus|futuroprotegido/.test(v)) return 'FUTURO PROTEGIDO PLUS';
  if (/futuro protegid|futuroprotetor|futuro protector/.test(v)) return 'FUTURO PROTEGIDO';
  if (/seguro protector|protector brilla/.test(v)) return 'SEGURO PROTECTOR';
  if (/mascota/.test(v)) return 'MASCOTA';
  if (/proexequi|exequial|servicio exequial/.test(v)) return 'PROEXEQUIAL';
  if (/factura protegida|salva factura/.test(v)) return 'FACTURA PROTEGIDA';
  if (/deudor/.test(v)) return 'DEUDOR';
  if (/brilla/.test(v)) return 'SEGURO BRILLA';
  if (/paz y salvo/.test(v)) return 'PAZ Y SALVO';
  if (/cancer/.test(v)) return 'SEGURO CANCER';
  if (/vida|itp/.test(v)) return 'SEGURO VIDA';
  if (/microseguro/.test(v)) return 'MICROSEGURO';
  return 'OTROS';
}

export function normalizarAseguradora(input: string | null | undefined): string {
  const v = normalizarTexto(input);
  if (v == null) return 'SIN REGISTRO';
  if (['sin registro', 'sin registros', 'no aplica', 'no apto'].includes(v) || /gnp|ike|llamada caida/.test(v) || /^[0-9 ]+$/.test(v)) {
    return 'NO APLICA';
  }
  if (/alfa/.test(v)) return 'ALFA';
  if (/hdi|liberty/.test(v)) return 'HDI';
  if (/sura|suramericana/.test(v)) return 'SURAMERICANA';
  if (/proexequi/.test(v)) return 'PROEXEQUIAL';
  return 'OTROS';
}
