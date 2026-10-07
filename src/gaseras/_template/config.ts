import type { GaseraConfig } from '../GasCaribe/config.js';

// Plantilla para nueva gasera: copiar esta carpeta a src/gaseras/<Nueva>/,
// cambiar codigo/nombre/prefijo de tablas. Ver scripts/nueva-gasera.ts.
const config: GaseraConfig = {
  codigo: '__CODIGO__',
  nombre: '__NOMBRE__',
  tablas: {
    inbound: '__PREFIJO___inbound',
    outbound: '__PREFIJO___outbound',
  },
  vistas: {
    inbound: 'v___PREFIJO___inbound_clasificado',
    outbound: 'v___PREFIJO___outbound_clasificado',
  },
};

export default config;
