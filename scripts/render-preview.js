#!/usr/bin/env node
/*
 * render-preview.js
 * -----------------
 * Renderiza las vistas HTML de src/ resolviendo los <?!= include('Archivo'); ?>
 * (los reemplaza por el contenido real del archivo, p. ej. Estilos.html) y
 * escribe el resultado en una carpeta html/ a la altura de src/.
 *
 * Es SOLO para previsualizar en el navegador el resultado de los cambios.
 * NO toca nada de src/. La carpeta html/ esta ignorada por git.
 *
 * Uso:  node scripts/render-preview.js     (o:  npm run preview)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');
const OUT  = path.join(ROOT, 'html');

// <?!= include('X'); ?>  /  <?= include("X") ?>
const INCLUDE_RE = /<\?!?=\s*include\(\s*['"]([^'"]+)['"]\s*\)\s*;?\s*\?>/g;
// Cualquier otro scriptlet GAS que quede (p. ej. <?= pedidoId ?>): se vacia.
const SCRIPTLET_RE = /<\?[\s\S]*?\?>/g;

function leer(nombre) {
  const archivo = nombre.endsWith('.html') ? nombre : nombre + '.html';
  return fs.readFileSync(path.join(SRC, archivo), 'utf8');
}

// Resuelve includes de forma recursiva, evitando ciclos.
function resolverIncludes(contenido, pila) {
  return contenido.replace(INCLUDE_RE, (_m, nombre) => {
    if (pila.includes(nombre)) return '';
    let inc;
    try { inc = leer(nombre); }
    catch (e) { return `<!-- include('${nombre}') no encontrado -->`; }
    return resolverIncludes(inc, pila.concat(nombre));
  });
}

// Stub para que google.script.run / host no rompan la vista fuera de GAS.
// Solo se inyecta en la copia de html/, jamas en src/.
const SHIM = `
<script>
/* PREVIEW SHIM — solo en html/, no en src/. Evita errores de google.script.* */
(function () {
  if (window.google && window.google.script) return;
  var noop = function () {};
  var chain = {};
  ['withSuccessHandler', 'withFailureHandler', 'withUserObject'].forEach(function (k) {
    chain[k] = function () { return runProxy; };
  });
  var runProxy = new Proxy(chain, {
    get: function (t, p) { return (p in t) ? t[p] : noop; } // funciones de servidor: sin datos en preview
  });
  window.google = {
    script: {
      run: runProxy,
      host: { close: noop, setWidth: noop, setHeight: noop, origin: '' },
      url:  { getLocation: function (cb) { if (cb) cb({ parameter: {} }); } }
    }
  };
})();
</script>
`;

function render() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const vistas = fs.readdirSync(SRC)
    .filter(f => f.endsWith('.html') && f !== 'Estilos.html')
    .sort();

  vistas.forEach(f => {
    let html = resolverIncludes(leer(f), [f.replace(/\.html$/, '')]);
    html = html.replace(SCRIPTLET_RE, '');            // limpia scriptlets restantes
    html = /<body[^>]*>/i.test(html)
      ? html.replace(/<body[^>]*>/i, m => m + SHIM)    // inyecta shim tras <body>
      : SHIM + html;
    fs.writeFileSync(path.join(OUT, f), html, 'utf8');
  });

  // Indice para abrir comodo en el navegador.
  const index =
    `<!doctype html><meta charset="utf-8"><title>Preview de vistas</title>` +
    `<style>body{font-family:system-ui,sans-serif;background:#f7f1e8;color:#2a2420;` +
    `padding:30px;max-width:560px;margin:auto}h1{font-size:20px}` +
    `a{display:block;padding:11px 14px;margin:7px 0;background:#fff;border:1px solid #e7ddcf;` +
    `border-radius:10px;text-decoration:none;color:#bb5530;font-weight:600}` +
    `a:hover{border-color:#bb5530}small{color:#8c8278}</style>` +
    `<h1>Vistas (preview)</h1><small>Render de src/ con estilos incrustados. Solo visual.</small>` +
    vistas.map(f => `<a href="./${f}">${f.replace(/\.html$/, '')}</a>`).join('');
  fs.writeFileSync(path.join(OUT, 'index.html'), index, 'utf8');

  console.log(`Renderizadas ${vistas.length} vistas en html/  →  abre html/index.html`);
}

render();
