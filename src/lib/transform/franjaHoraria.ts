// Agrupa horas por hora en punto: 10:00, 10:30, 10:34 -> "10 AM".
export interface Franja {
  hora: number;
  label: string;
}

export function horaAFranja(hora: number): Franja {
  const h = ((Math.floor(hora) % 24) + 24) % 24;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { hora: h, label: `${h12} ${h < 12 ? 'AM' : 'PM'}` };
}

export function horaStrAFranja(hhmmss: string | null | undefined): Franja | null {
  if (!hhmmss) return null;
  const m = /^(\d{1,2}):/.exec(hhmmss.trim());
  if (!m) return null;
  return horaAFranja(Number(m[1]));
}
