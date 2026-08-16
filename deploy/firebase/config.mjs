#!/usr/bin/env node
/**
 * Genera el `config.json` de un ambiente a partir de `environments.json`.
 *
 *   node deploy/firebase/config.mjs [ambiente] [--out <ruta>]   escribe el config.json
 *   node deploy/firebase/config.mjs <ambiente> --project-id      imprime su projectId
 *
 * El bloque `config` de cada ambiente **es** el fichero publicado, sin transformar: lo que se
 * añada ahí aparece tal cual en `config.json`. `projectId` queda fuera de ese bloque porque es
 * dato de despliegue —a qué proyecto de Firebase subir— y no lo lee la app.
 *
 * Lo usan los dos caminos, para que no puedan divergir:
 *   · en local  → `npm run config`, que reescribe `public/config.json` (ng serve y E2E)
 *   · en el CI  → el workflow, con `--out dist/misaevol/browser/config.json`
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ENVIRONMENTS = new URL('./environments.json', import.meta.url);
const AMBIENTE_POR_DEFECTO = 'dev';
const SALIDA_POR_DEFECTO = 'public/config.json';

function fail(message) {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const soloProjectId = args.includes('--project-id');
const indiceOut = args.indexOf('--out');
const salida = indiceOut === -1 ? SALIDA_POR_DEFECTO : args[indiceOut + 1];
// El `indiceOut !== -1` no sobra: sin `--out`, `indiceOut + 1` es 0 y se comería el ambiente.
const posicionales = args.filter(
  (arg, i) => !arg.startsWith('--') && !(indiceOut !== -1 && i === indiceOut + 1),
);
const ambiente = (posicionales[0] ?? AMBIENTE_POR_DEFECTO).trim().toLowerCase();

if (indiceOut !== -1 && !salida) {
  fail('Falta la ruta después de --out.');
}

const environments = JSON.parse(readFileSync(ENVIRONMENTS, 'utf8'));
const conocidos = Object.keys(environments);

if (!Object.hasOwn(environments, ambiente)) {
  fail(
    `Ambiente "${ambiente}" desconocido. ` +
      `Los definidos en deploy/firebase/environments.json son: ${conocidos.join(', ')}.`,
  );
}

const { projectId, config } = environments[ambiente];

if (soloProjectId) {
  if (!projectId || projectId.startsWith('TU-PROJECT-ID')) {
    fail(
      `El ambiente "${ambiente}" no tiene un projectId real en deploy/firebase/environments.json ` +
        `(manual/firebase-deploy.md, paso 2).`,
    );
  }
  process.stdout.write(`${projectId}\n`);
  process.exit(0);
}

if (!config || typeof config !== 'object' || Array.isArray(config)) {
  fail(
    `El ambiente "${ambiente}" no tiene un bloque "config" en deploy/firebase/environments.json.`,
  );
}

writeFileSync(salida, `${JSON.stringify(config, null, 2)}\n`);

// Nunca el Client ID entero: en el log del CI no aporta y lo enseña sin necesidad.
const conectaConGoogle = typeof config.googleClientId === 'string' && config.googleClientId !== '';
console.log(
  `✔ ${salida} generado desde el ambiente "${ambiente}" ` +
    `(debug: ${config.debug === true}, Google: ${conectaConGoogle ? 'sí' : 'no'})`,
);
