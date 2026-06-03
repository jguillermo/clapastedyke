#!/usr/bin/env node
/**
 * Smoke-test de los src/XForm.html generados por el export.
 * Comprueba el contrato GAS: ids del DOM, funciones servidor, sin rastros
 * de Angular, scaffold correcto. Falla (exit 1) ante cualquier deriva.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = resolve(AQUI, '..', '..');
const SRC = join(RAIZ_REPO, 'src');

// Contrato por formulario: ids del DOM y funciones servidor que DEBEN estar.
const CONTRATOS = JSON.parse(readFileSync(join(AQUI, 'contratos-export.json'), 'utf8'));

// Nota: los scriptlets de valor (<?= pedidoId ?>) SÍ se permiten — viven en la
// lógica verbatim y los resuelve HtmlService. Solo se prohíbe el include().
const PROHIBIDO = [/<app-/, /\sng-reflect/, /_ngcontent/, /_nghost/, /ng-version/, /data-onclick/, /<\?!?=\s*include/];
const OBLIGATORIO = [
  'ARCHIVO GENERADO',
  '<base target="_top">',
  'fonts.googleapis.com/css2?family=Fraunces',
  'class="gas-form"',
  'google.script.run',
  'var S = {',
];

let errores = 0;
const fallo = (archivo, msg) => {
  console.error(`✗ ${archivo}: ${msg}`);
  errores++;
};

for (const [archivo, contrato] of Object.entries(CONTRATOS)) {
  let html;
  try {
    html = readFileSync(join(SRC, `${archivo}.html`), 'utf8');
  } catch {
    fallo(archivo, 'no existe en src/');
    continue;
  }

  for (const re of PROHIBIDO) {
    if (re.test(html)) fallo(archivo, `contiene patrón prohibido ${re}`);
  }
  for (const texto of OBLIGATORIO) {
    if (!html.includes(texto)) fallo(archivo, `falta «${texto}»`);
  }
  for (const id of contrato.ids) {
    if (!html.includes(`id="${id}"`)) fallo(archivo, `falta id="${id}"`);
  }
  for (const fn of contrato.servidor) {
    if (!html.includes(fn)) fallo(archivo, `falta función servidor «${fn}»`);
  }
  const definicionesS = html.match(/var S = \{/g) || [];
  if (definicionesS.length !== 1) fallo(archivo, `objeto S definido ${definicionesS.length} veces`);
}

if (errores) {
  console.error(`\n${errores} problema(s) en el export.`);
  process.exit(1);
}

// El preview del repo debe seguir funcionando sobre los generados.
execFileSync('node', [join(RAIZ_REPO, 'scripts', 'render-preview.js')], { stdio: 'inherit' });

console.log(`✓ Export verificado: ${Object.keys(CONTRATOS).length} formulario(s) cumplen el contrato GAS.`);
