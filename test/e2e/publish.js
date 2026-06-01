#!/usr/bin/env node
// Prepara una publicacion. Argumentos:
//   test | prod  -> pone el scriptId del .env y sube la version de la app en +1
//   clear        -> vacía el scriptId (se usa después del push)
// El push va en medio, desde el script de npm.
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..', '..');
const ruta = path.join(raiz, 'src', '.clasp.json');
const clasp = JSON.parse(fs.readFileSync(ruta, 'utf8'));
const arg = process.argv[2];

if (arg === 'clear') {
  clasp.scriptId = '';
} else {
  const campo = arg === 'prod' ? 'SCRIPT_ID_PROD' : 'SCRIPT_ID_TEST';
  const env = fs.readFileSync(path.join(raiz, '.env'), 'utf8');
  const id = ((env.match(new RegExp('^' + campo + '=(.*)$', 'm')) || [])[1] || '').trim();
  if (!id || id.startsWith('PEGA_AQUI')) throw new Error('Falta ' + campo + ' en .env');
  clasp.scriptId = id;
  subirVersion();
}

fs.writeFileSync(ruta, JSON.stringify(clasp, null, 2) + '\n');
console.log('scriptId = ' + JSON.stringify(clasp.scriptId));

// Sube la version de la app en +1 en cada publicacion.
//   - Lee la version anterior de package.json (campo "appVersion").
//   - Le suma 1 y la reescribe en package.json.
//   - Genera src/Version.js para que el codigo de Apps Script (el menu) la lea.
function subirVersion() {
  const rutaPkg = path.join(raiz, 'package.json');
  const rutaVer = path.join(raiz, 'src', 'Version.js');

  const pkg = JSON.parse(fs.readFileSync(rutaPkg, 'utf8'));
  const anterior = parseInt(pkg.appVersion, 10) || 0;
  const nueva = anterior + 1;

  pkg.appVersion = nueva;
  fs.writeFileSync(rutaPkg, JSON.stringify(pkg, null, 2) + '\n');

  fs.writeFileSync(rutaVer,
    '// Generado por test/e2e/publish.js en cada publicacion. No editar a mano.\n' +
    'var VERSION_APP = ' + nueva + ';\n');

  console.log('appVersion: ' + anterior + ' -> ' + nueva);
}
