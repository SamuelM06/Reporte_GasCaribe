export interface ResumenMensual {
  mes: string;
  clasificacion: 'APTA' | 'NO APTA';
  n: number;
}

export interface ResultadoRow {
  resultado_normalizado: string | null;
  clasificacion: 'APTA' | 'NO APTA';
  n: number;
}


