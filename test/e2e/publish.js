#!/usr/bin/env node
// Cambia el scriptId de src/.clasp.json. Argumentos:
//   test | prod  -> pone el id del .env
//   clear        -> vacía el id (se usa después del push)
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
}

fs.writeFileSync(ruta, JSON.stringify(clasp, null, 2) + '\n');
console.log('scriptId = ' + JSON.stringify(clasp.scriptId));
