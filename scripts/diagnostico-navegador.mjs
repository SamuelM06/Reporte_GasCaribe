/*
  Diagnostico REAL de navegador: lanza Chrome headless, se conecta por CDP y
  lee la consola, las excepciones no capturadas y las peticiones fallidas.

  Esto es lo que faltaba: las pruebas por HTTP solo confirman que el HTML llega.
  No dicen si React monta, si el tema responde ni si hay un error en tiempo de
  ejecucion. Aqui si.

  Uso: node scripts/diagnostico-navegador.mjs [url] [--visible]
*/
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_PRUEBA = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://127.0.0.1:4399/';
const RUTAS = ['/', '/gestion-diaria', '/abandono'];
const PUERTO_CDP = 9333;

const perfil = mkdtempSync(join(tmpdir(), 'diag-chrome-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PUERTO_CDP}`,
  `--user-data-dir=${perfil}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--window-size=1440,900',
  'about:blank',
]);
chrome.stderr.on('data', () => {});

const limpiar = () => {
  try {
    chrome.kill('SIGKILL');
  } catch {
    /* ya no esta */
  }
  try {
    rmSync(perfil, { recursive: true, force: true });
  } catch {
    /* temporal */
  }
};
process.on('exit', limpiar);

// Espera a que el puerto de depuracion responda.
let wsUrl = null;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    const res = await fetch(`http://127.0.0.1:${PUERTO_CDP}/json/version`);
    wsUrl = (await res.json()).webSocketDebuggerUrl;
    if (wsUrl) break;
  } catch {
    /* todavia no */
  }
}
if (!wsUrl) {
  console.error('No se pudo conectar con Chrome por CDP.');
  limpiar();
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
let id = 0;
const pendientes = new Map();
const oyentes = [];

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pendientes.has(msg.id)) {
    pendientes.get(msg.id)(msg);
    pendientes.delete(msg.id);
  } else if (msg.method) {
    for (const f of oyentes) f(msg);
  }
});
await new Promise((r, rej) => {
  ws.addEventListener('open', r, { once: true });
  ws.addEventListener('error', rej, { once: true });
});

const enviar = (method, params = {}, sessionId) =>
  new Promise((res) => {
    const msgId = ++id;
    pendientes.set(msgId, res);
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
  });

// Crea una pestana y engancha los oyentes de errores.
const { targetId } = (await enviar('Target.createTarget', { url: 'about:blank' })).result;
const { sessionId } = (await enviar('Target.attachToTarget', { targetId, flatten: true })).result;

const consola = [];
const excepciones = [];
const fallos = [];
const cargadas = new Set();

oyentes.push((msg) => {
  if (msg.sessionId !== sessionId) return;
  if (msg.method === 'Runtime.consoleAPICalled') {
    const t = msg.params.type;
    if (t === 'error' || t === 'warning') {
      consola.push({
        tipo: t,
        texto: msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' '),
      });
    }
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    excepciones.push(d.exception?.description ?? d.text);
  }
  if (msg.method === 'Network.loadingFailed') {
    fallos.push(`${msg.params.type} :: ${msg.params.errorText} (${msg.params.blockedReason ?? 'sin motivo'})`);
  }
  if (msg.method === 'Network.responseReceived') {
    cargadas.add(msg.params.response.url);
  }
});

await enviar('Runtime.enable', {}, sessionId);
await enviar('Network.enable', {}, sessionId);
await enviar('Page.enable', {}, sessionId);

const probar = async (ruta) => {
  consola.length = 0;
  excepciones.length = 0;
  fallos.length = 0;
  const url = `${URL_PRUEBA.replace(/\/$/, '')}${ruta}`;
  await enviar('Page.navigate', { url }, sessionId);
  // Espera a que se asiente el render y las peticiones.
  await new Promise((r) => setTimeout(r, 6500));

  const q = (expr) =>
    enviar('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId).then(
      (r) => r.result?.result?.value,
    );

  // Lo que el usuario REALMENTE ve:
  const info = await q(`(() => {
    const main = document.querySelector('main');
    const islotes = document.querySelectorAll('astro-island');
    const vacios = [...islotes].filter(i => i.children.length === 0).length;
    const cuerpo = document.body.innerText.trim();
    const estilos = getComputedStyle(document.body);
    return JSON.stringify({
      alturaBody: document.body.scrollHeight,
      textoVisible: cuerpo.length,
      muestra: cuerpo.slice(0, 60),
      islas: islotes.length,
      islasVacias: vacios,
      mainVisible: main ? estilos.visibility !== 'hidden' && getComputedStyle(main).display !== 'none' : false,
      altoMain: main ? main.getBoundingClientRect().height : 0,
      colorFondo: estilos.backgroundColor,
      hayHeader: !!document.querySelector('header'),
      hayFooter: !!document.querySelector('footer'),
    });
  })()`);

  const d = info ? JSON.parse(info) : {};
  return { ruta, ...d, consola: [...consola], excepciones: [...excepciones], fallos: [...fallos] };
};

console.log(`Navegador real contra ${URL_PRUEBA}\n`);
let problemas = 0;

for (const ruta of RUTAS) {
  const r = await probar(ruta);
  const roto = r.textoVisible < 120 || r.islasVacias > 0 || r.excepciones.length > 0;
  if (roto) problemas++;
  console.log(
    `${roto ? 'FALLA' : 'OK   '} ${ruta.padEnd(13)} texto=${String(r.textoVisible).padStart(5)}  islas=${r.islas} (vacias ${r.islasVacias})  altoBody=${String(r.alturaBody).padStart(5)}  main ${r.alturaAlto ?? r.altoMain}px`,
  );
  console.log(`       fondo=${r.colorFondo}  header=${r.hayHeader ? 'si' : 'NO'}  footer=${r.hayFooter ? 'si' : 'NO'}`);
  if (r.textoVisible < 120) console.log(`       TEXTO VISIBLE: "${r.muestra}"`);
  for (const e of r.excepciones) console.log(`       EXCEPCION: ${e.split('\n').slice(0, 3).join(' | ')}`);
  for (const c of r.consola) console.log(`       CONSOLA[${c.tipo}]: ${c.texto.slice(0, 200)}`);
  for (const f of r.fallos) console.log(`       PETICION FALLIDA: ${f}`);
  console.log('');
}

// Prueba funcional del tema: simula el clic y comprueba que cambia.
const pruebaTema = await (async () => {
  await enviar('Page.navigate', { url: `${URL_PRUEBA.replace(/\/$/, '')}/` }, sessionId);
  await new Promise((r) => setTimeout(r, 5500));
  return enviar(
    'Runtime.evaluate',
    {
      expression: `(async () => {
        const antes = document.documentElement.className;
        const btn = document.querySelector('astro-island button, button[aria-label*="tema" i], button[title*="tema" i]');
        if (!btn) return JSON.stringify({ error: 'no se encontro el boton de tema', botones: document.querySelectorAll('button').length });
        btn.click();
        await new Promise(r => setTimeout(r, 900));
        return JSON.stringify({ antes, despues: document.documentElement.className, guardado: localStorage.getItem('xuma_tema') });
      })()`,
      awaitPromise: true,
      returnByValue: true,
    },
    sessionId,
  ).then((r) => r.result?.result?.value);
})();

console.log('=== PRUEBA DEL TEMA (clic real en el boton) ===');
console.log(`  ${pruebaTema ?? 'sin respuesta'}`);

console.log(`\n=== RUTAS CON PROBLEMAS: ${problemas} / ${RUTAS.length} ===`);
limpiar();
process.exit(0);