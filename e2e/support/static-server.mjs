/**
 * Servidor estático mínimo para los E2E: sirve el **build compilado** de Angular
 * (`deploy/dist/hosting`) en vez de levantar `ng serve`.
 *
 * Por qué: los tests no necesitan el dev server (watch, HMR, transformaciones por
 * petición). Sirviendo el bundle ya construido, la app carga como en producción y
 * cada navegación de cada test es un fichero estático — mucho más rápido y
 * determinista. El build lo hace `npm run test:e2e` antes de arrancar Playwright.
 *
 * Sin dependencias: solo `node:http` y `node:fs`. La app enruta **por fragmento**
 * (`/#/home`), así que la única ruta de servidor es `/`: lo que no exista como
 * fichero devuelve **404**, igual que Firebase Hosting. Ver `resolveFile`.
 *
 * Uso: `node e2e/support/static-server.mjs [--dir <ruta>] [--port <puerto>]`
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const ROOT = resolve(flag('dir', process.env.E2E_DIST ?? 'deploy/dist/hosting'));
const PORT = Number(flag('port', process.env.E2E_PORT ?? 4200));

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error(
    `[e2e] No hay build en ${ROOT}.\n` +
      `      Ejecuta "npm run build" antes de los E2E (o usa "npm run test:e2e", que lo hace por ti).`,
  );
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Resuelve la petición a un fichero dentro de ROOT.
 *
 * `'forbidden'` si la ruta intenta escapar; `'missing'` si no existe. **No hay fallback de SPA**, y
 * eso es deliberado: la app enruta por fragmento, así que la única ruta de servidor que existe es
 * `/`. Servir `index.html` para cualquier ruta haría que la suite pasara con URLs que en producción
 * dan 404 — el peor tipo de doble, el que miente en la dirección cómoda.
 */
function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  // `normalize` + prefijo obligatorio: ninguna ruta puede escapar de ROOT.
  const candidate = normalize(join(ROOT, clean === '/' ? '/index.html' : clean));
  if (!candidate.startsWith(ROOT)) {
    return 'forbidden';
  }
  return existsSync(candidate) && statSync(candidate).isFile() ? candidate : 'missing';
}

const server = createServer((request, response) => {
  const file = resolveFile(request.url ?? '/');
  if (file === 'forbidden') {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (file === 'missing') {
    response.writeHead(404).end('Not Found');
    return;
  }
  const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
  // Los assets del build llevan hash; el index nunca se cachea para no servir uno viejo.
  const cache = file.endsWith('index.html') ? 'no-store' : 'public, max-age=3600';
  response.writeHead(200, { 'content-type': type, 'cache-control': cache });
  createReadStream(file).pipe(response);
});

server.listen(PORT, () => {
  console.log(`[e2e] build servido en http://localhost:${PORT} (desde ${ROOT})`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
