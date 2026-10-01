import GasCaribe from './GasCaribe/config.js';
import type { GaseraConfig } from './GasCaribe/config.js';

export const registry: Record<string, GaseraConfig> = {
  GasCaribe,
};

export function getGasera(codigo: string): GaseraConfig | null {
  return registry[codigo] ?? null;
}
