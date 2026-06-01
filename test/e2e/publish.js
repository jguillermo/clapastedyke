#!/usr/bin/env node
/**
 * publish.js — Despliega el código a un entorno (test o prod) con clasp.
 *
 *   node test/e2e/publish.js test    (o: npm run publish:test)
 *   node test/e2e/publish.js prod    (o: npm run publish:prod)
 *
 * Lee el scriptId del entorno desde test/e2e/targets.json, lo escribe en
 * src/.clasp.json (conservando la config de extensiones) y corre `clasp push`.
 * Así, con dos claves en targets.json, despliegas a producción o a un proyecto
 * de prueba (otra hoja) sin tocar nada a mano.
 */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var entorno = (process.argv[2] || '').toLowerCase();
if (entorno !== 'test' && entorno !== 'prod') {
  console.error('Uso: node test/e2e/publish.js <test|prod>');
  process.exit(2);
}

var raiz = path.join(__dirname, '..', '..');
var targets = JSON.parse(fs.readFileSync(path.join(__dirname, 'targets.json'), 'utf8'));
var scriptId = targets[entorno];

if (!scriptId || /^PEGA_AQUI/.test(scriptId)) {
  console.error('Falta el scriptId de "' + entorno + '" en test/e2e/targets.json.');
  if (entorno === 'test') {
    console.error('Crea un proyecto Apps Script de prueba (enlazado a otra hoja),');
    console.error('copia su Script ID y pégalo en targets.json -> "test".');
  }
  process.exit(1);
}

var claspJson = {
  scriptId: scriptId,
  rootDir: '',
  scriptExtensions: ['.js', '.gs'],
  htmlExtensions: ['.html'],
  jsonExtensions: ['.json'],
  filePushOrder: [],
  skipSubdirectories: false
};

var destino = path.join(raiz, 'src', '.clasp.json');
fs.writeFileSync(destino, JSON.stringify(claspJson, null, 2) + '\n');
console.log('[' + entorno + '] src/.clasp.json apunta a ' + scriptId);
console.log('[' + entorno + '] clasp push ...');

try {
  cp.execSync('clasp push -f', { cwd: path.join(raiz, 'src'), stdio: 'inherit' });
  console.log('\n[' + entorno + '] Listo. Abre la hoja del entorno y corre: Sistema > Mantenimiento > Instalar o reparar.');
} catch (e) {
  console.error('\nFalló el push. ¿Hiciste "clasp login"? ¿El scriptId es correcto?');
  process.exit(1);
}
