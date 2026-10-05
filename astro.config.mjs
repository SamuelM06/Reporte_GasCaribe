import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

import { execSync } from 'node:child_process';

function buildId() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const fecha = new Date().toISOString().slice(0, 16).replace('T', ' ');
    return `${fecha} · ${hash}`;
  } catch {
    return new Date().toISOString().slice(0, 16).replace('T', ' ');
  }
}

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  server: { port: 4323, host: true },
  vite: {
    define: { __BUILD_ID__: JSON.stringify(buildId()) },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'motion/react',
        'lucide-react',
        'recharts',
      ],
    },
    plugins: [tailwindcss()],
  },
});
