// Generador multi-gasera. Uso:
//   npm run nueva-gasera -- --nombre=Nueva --prefijo=nueva --inboundUrl=... --outboundUrl=...
// Hace: copia _template, crea data/raw/<Nueva>, inserta 4 APTA en clasificacion,
// registra en registry.ts y Bitacora.md. No crea tablas de datos (siguen prefijo).
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args: Record<string, string> = {};
for (const a of process.argv.slice(2)) {
  const m = /^--([^=]+)=(.*)$/.exec(a);
  if (m) args[m[1]] = m[2];
}
const nombre = args['nombre'];
const prefijo = args['prefijo'];
if (!nombre || !prefijo || !/^[A-Za-z][A-Za-z0-9_]*$/.test(nombre) || !/^[a-z_][a-z0-9_]*$/.test(prefijo)) {
  console.error('Uso: npm run nueva-gasera -- --nombre=<Nombre> --prefijo=<prefijo> [--inboundUrl=..] [--outboundUrl=..]');
  process.exit(1);
}
const dest = join(root, 'src', 'gaseras', nombre);
if (existsSync(dest)) {
  console.error(`Ya existe src/gaseras/${nombre}`);
  process.exit(1);
}
cpSync(join(root, 'src', 'gaseras', '_template'), dest, { recursive: true });
let tpl = readFileSync(join(dest, 'config.ts'), 'utf8');
tpl = tpl.replaceAll('__CODIGO__', nombre).replaceAll('__NOMBRE__', nombre).replaceAll('__PREFIJO__', prefijo);
writeFileSync(join(dest, 'config.ts'), tpl);
mkdirSync(join(root, 'data', 'raw', nombre), { recursive: true });

// registry.ts
const regPath = join(root, 'src', 'gaseras', 'registry.ts');
let reg = readFileSync(regPath, 'utf8');
reg = reg.replace(`import GasCaribe from './GasCaribe/config.js';`, `import GasCaribe from './GasCaribe/config.js';\nimport ${nombre} from './${nombre}/config.js';`);
reg = reg.replace('  GasCaribe,', `  GasCaribe,\n  ${nombre},`);
writeFileSync(regPath, reg);

// SQL pendiente (ejecutar con usuario ETL):
const sql = `INSERT INTO gestion_diaria.clasificacion (gasera, variante, resultado_normalizado, clasificacion) VALUES
 ('${nombre}','cancelado','cancelado','APTA'),
 ('${nombre}','retenido','retenido','APTA'),
 ('${nombre}','cancelado + reintegro','cancelado + reintegro','APTA'),
 ('${nombre}','cancelado + venta','cancelado + venta','APTA')
ON CONFLICT (gasera, variante) DO NOTHING;`;
console.log('--- Ejecutar este SQL con usuario ETL ---');
console.log(sql);

// Bitacora
const bit = join(root, 'context', 'Bitacora.md');
const line = `| ${new Date().toISOString().slice(0, 10)} | Nueva gasera | Scaffold ${nombre} (prefijo ${prefijo}) + data/raw/${nombre}/ + registro | Ejecutar SQL de 4 APTA arriba. |\n`;
writeFileSync(bit, readFileSync(bit, 'utf8').replace('---\n<!-- Agregar', line + '---\n<!-- Agregar'));
console.log(`OK: src/gaseras/${nombre}/ creado. Tablas de datos: ${prefijo}_inbound/outbound/abandono (crearlas al cargar).`);
