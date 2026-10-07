export interface GaseraConfig {
  codigo: string; // = columna gasera en tabla clasificacion
  nombre: string;
  tablas: { inbound: string; outbound: string };
  vistas: { inbound: string; outbound: string };
}

const config: GaseraConfig = {
  codigo: 'GasCaribe',
  nombre: 'Gases del Caribe',
  tablas: {
    inbound: 'caribe_inbound',
    outbound: 'caribe_outbound',
  },
  vistas: {
    inbound: 'v_caribe_inbound_clasificado',
    outbound: 'v_caribe_outbound_clasificado',
  },
};

export default config;
