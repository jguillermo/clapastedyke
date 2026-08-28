#!/usr/bin/env node
/**
 * Genera el fichero de parámetros (`.env.<projectId>`) de cada función de `api/` a partir de
 * `environments.json`.
 *
 *   node deploy/firebase/api-env.mjs [ambiente]              escribe api/<fn>/.env.<projectId>
 *   node deploy/firebase/api-env.mjs --project-id <id>       el mismo, resuelto por projectId
 *   node deploy/firebase/api-env.mjs --all                   todos los ambientes ya montados
 *
 * Hermano de `config.mjs`, y por el mismo motivo: **el valor vive en un solo sitio**. El Client ID
 * estaba escrito a mano en `environments.json` y otra vez en `api/auth/.env.<projectId>`; en cuanto
 * los dos divergen, Google rechaza el canje con `invalid_client` y el mensaje no dice por qué. Aquí
 * se deriva, así que no puede divergir.
 *
 * **Un solo build; lo que cambia por entorno son estas variables.** Firebase carga el
 * `.env.<projectId>` de la carpeta de la función según el `--project` del despliegue, así que el
 * mismo código compilado sirve para todos los ambientes.
 *
 * Lo usan los tres caminos, para que no puedan divergir:
 *   · a mano      → `npm run api:env <ambiente>`
 *   · el emulador → `npm run emulators`, que lo ejecuta antes de arrancar
 *   · el deploy   → el `predeploy` de firebase.json, con `--project-id`
 *
 * **Aquí NO entra ningún secreto.** `GOOGLE_OAUTH_CLIENT_SECRET` es un `defineSecret` y vive en
 * Secret Manager; este fichero está versionado.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ENVIRONMENTS = new URL('./environments.json', import.meta.url);
const API = new URL('../../api/', import.meta.url);

/**
 * Qué variable de entorno de qué función sale de qué clave del bloque `config`.
 *
 * **Este objeto es el contrato**: una función que necesite un parámetro nuevo lo añade aquí, no en
 * el `.env` (que es generado y se pisa en el siguiente despliegue). La clave exterior es la carpeta
 * de `api/`; `key` es la clave dentro del bloque `config` del ambiente.
 */
const PARAMETERS = {
  auth: {
    GOOGLE_OAUTH_CLIENT_ID: {
      key: 'googleClientId',
      hint: 'el mismo Client ID que publica el frontend en config.json',
    },
  },
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const todos = args.includes('--all');
const indiceProjectId = args.indexOf('--project-id');
const projectIdPedido = indiceProjectId === -1 ? null : args[indiceProjectId + 1];
// El `indiceProjectId !== -1` no sobra: sin la opción, `indiceProjectId + 1` es 0 y se comería el
// ambiente posicional.
const posicionales = args.filter(
  (arg, i) => !arg.startsWith('--') && !(indiceProjectId !== -1 && i === indiceProjectId + 1),
);

if (indiceProjectId !== -1 && !projectIdPedido) {
  fail('Falta el identificador después de --project-id.');
}

const environments = JSON.parse(readFileSync(ENVIRONMENTS, 'utf8'));
const conocidos = Object.keys(environments);

// `--all` regenera los ambientes que ya están montados y SALTA los que todavía llevan el
// marcador de projectId. Es lo que usa el guardián de CI, que no puede saberse los nombres: si
// alguien edita un `.env` a mano, la comparación con lo generado lo caza en el PR.
if (todos) {
  const listos = conocidos.filter(
    (clave) => environments[clave].projectId && !environments[clave].projectId.startsWith('TU-PROJECT-ID'),
  );

  if (listos.length === 0) {
    fail('Ningún ambiente de deploy/firebase/environments.json tiene todavía un projectId real.');
  }

  for (const clave of listos) {
    write(clave);
  }
  process.exit(0);
}

// Dos formas de decir lo mismo. `--project-id` existe porque el hook `predeploy` de Firebase no
// conoce el ambiente: solo sabe a qué proyecto está desplegando.
const ambiente = projectIdPedido
  ? conocidos.find((clave) => environments[clave].projectId === projectIdPedido)
  : (posicionales[0] ?? 'dev').trim().toLowerCase();

if (projectIdPedido && !ambiente) {
  fail(
    `Ningún ambiente de deploy/firebase/environments.json apunta al proyecto "${projectIdPedido}". ` +
      `Los definidos son: ${conocidos
        .map((clave) => `${clave} → ${environments[clave].projectId}`)
        .join(', ')}.`,
  );
}

if (!Object.hasOwn(environments, ambiente)) {
  fail(
    `Ambiente "${ambiente}" desconocido. ` +
      `Los definidos en deploy/firebase/environments.json son: ${conocidos.join(', ')}.`,
  );
}

if (!environments[ambiente].projectId || environments[ambiente].projectId.startsWith('TU-PROJECT-ID')) {
  fail(
    `El ambiente "${ambiente}" no tiene un projectId real en deploy/firebase/environments.json ` +
      `(manual/firebase-deploy.md, paso 2).`,
  );
}

write(ambiente);

/**
 * Escribe el `.env.<projectId>` de cada función de `PARAMETERS` para un ambiente cuyo `projectId`
 * ya se sabe real. Es una declaración de función a propósito: se iza, así que `--all` la puede
 * llamar más arriba sin partir el fichero en dos.
 */
function write(clave) {
  const { projectId, config } = environments[clave];

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    fail(`El ambiente "${clave}" no tiene un bloque "config" en deploy/firebase/environments.json.`);
  }

  for (const [funcion, variables] of Object.entries(PARAMETERS)) {
    const lineas = [
      '# GENERADO — no edites este fichero a mano: lo reescribe deploy/firebase/api-env.mjs.',
      '#',
      `# Parámetros de la función \`${funcion}\` para el proyecto \`${projectId}\` (ambiente \`${clave}\`).`,
      '# Los valores viven en deploy/firebase/environments.json, en el bloque `config` de ese ambiente,',
      '# que es también de donde sale el config.json que publica el frontend. Para cambiarlos se edita',
      '# ese fichero y se regenera:',
      '#',
      `#   npm run api:env ${clave}`,
      '#',
      '# Nada de lo que hay aquí es secreto: este fichero está versionado. El client secret vive en',
      '# Secret Manager (GOOGLE_OAUTH_CLIENT_SECRET) y nunca pasa por aquí.',
    ];

    for (const [variable, { key, hint }] of Object.entries(variables)) {
      const value = config[key];

      if (typeof value !== 'string' || value === '') {
        fail(
          `El ambiente "${clave}" no tiene "${key}" en su bloque "config", y la función ` +
            `"${funcion}" lo necesita como ${variable} (${hint}).\n` +
            `Sin él la función se despliega y contesta 500 con «La función ${funcion} no está ` +
            `configurada». Rellénalo en deploy/firebase/environments.json ` +
            `(ver deploy/google-client-id.md).`,
        );
      }

      lineas.push('', `# ${hint}`, `${variable}=${value}`);
    }

    const salida = new URL(`${funcion}/.env.${projectId}`, API);
    writeFileSync(salida, `${lineas.join('\n')}\n`);
    console.log(
      `✔ api/${funcion}/.env.${projectId} generado desde el ambiente "${clave}" ` +
        `(${Object.keys(variables).length} parámetro(s))`,
    );
  }
}
