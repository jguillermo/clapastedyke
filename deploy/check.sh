#!/usr/bin/env bash
#
# Comprueba lo que copiar no puede garantizar.
#
# `deploy/wire-environment.sh` copia valores; no los inventa ni los deriva. Eso deja dos huecos que
# solo se pueden cerrar comprobando:
#
#   1. El Client ID lo necesitan las dos mitades —el navegador como `front.googleClientId` y la
#      función como `back.GOOGLE_OAUTH_CLIENT_ID`— y NO está en este fichero: cada bloque declara en
#      `delEntorno` de qué variable lo saca. Tienen que declarar LA MISMA, o volvería a poder
#      divergir, y cuando eso pasa Google rechaza el canje con `invalid_client` sin decir por qué.
#
#   2. Que ninguna credencial se haya colado en `valores`, que sí se versiona.
#
#   3. Valores que viven en ficheros ESTÁTICOS, que ningún script genera: la región está en
#      `deploy/firebase.json` (el rewrite de Hosting) y en `api/auth/index.ts`
#      (`setGlobalOptions`). Fingir que se derivan sería mentira; comprobarlas es honesto.
#
# Además exige que todo ambiente ya montado esté completo. Un ambiente a medias (`projectId` todavía
# con el marcador) se SALTA, no falla: montar un ambiente es trabajo en curso y no debe poner el CI
# en rojo.
#
#   ./deploy/check.sh
#
# Documentación: deploy/README.md

set -euo pipefail

# Toda expansión va con llaves — `${VAR}`, no `$VAR`. El bash 3.2 que trae macOS, con un locale
# UTF-8, se traga el primer byte del carácter siguiente dentro del nombre de la variable.

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    awk 'NR < 3 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "${BASH_SOURCE[0]}"
    exit 0
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

command -v node >/dev/null 2>&1 || {
    printf '\033[31m✗ Hace falta Node.\033[0m\n' >&2
    exit 1
}

cd "${REPO_ROOT}"

node - <<'NODE'
const { readFileSync } = require('node:fs');

const ENVIRONMENTS = 'deploy/environments.json';
const FIREBASE_JSON = 'deploy/firebase.json';
const FUNCION_INDEX = 'api/auth/index.ts';

const errores = [];
const notas = [];

const doc = JSON.parse(readFileSync(ENVIRONMENTS, 'utf8'));

/** Un ambiente cuyo projectId sigue siendo el marcador todavía no está montado. */
const montado = (amb) => amb.projectId && !amb.projectId.startsWith('TU-PROJECT-ID');

for (const [nombre, amb] of Object.entries(doc)) {
  if (!montado(amb)) {
    notas.push(`${nombre} saltado: todavía sin montar (projectId = ${amb.projectId}).`);
    continue;
  }

  // Estructura completa
  for (const bloque of ['front', 'back', 'secretos']) {
    if (!amb[bloque]) errores.push(`${nombre}: falta el bloque "${bloque}".`);
  }
  for (const bloque of ['front', 'back']) {
    if (amb[bloque] && !amb[bloque].destino) errores.push(`${nombre}.${bloque}: falta "destino".`);
  }
  if (!amb.region) errores.push(`${nombre}: falta "region".`);

  // 1 · las dos mitades tienen que sacar el Client ID de LA MISMA variable
  const variable = (bloque, clave) => {
    const spec = amb[bloque]?.delEntorno?.[clave];
    return spec ? String(spec).split('—')[0].trim() : undefined;
  };
  const front = variable('front', 'googleClientId');
  const back = variable('back', 'GOOGLE_OAUTH_CLIENT_ID');

  if (!front) errores.push(`${nombre}.front.delEntorno: falta "googleClientId".`);
  if (!back) errores.push(`${nombre}.back.delEntorno: falta "GOOGLE_OAUTH_CLIENT_ID".`);
  if (front && back && front !== back) {
    errores.push(
      `${nombre}: front y back sacan el Client ID de variables DISTINTAS.\n` +
        `    front.delEntorno.googleClientId          → ${front}\n` +
        `    back.delEntorno.GOOGLE_OAUTH_CLIENT_ID   → ${back}\n` +
        `    Es el MISMO cliente: dos variables es dos valores, y eso da "invalid_client".`,
    );
  }

  // 2 · ningún valor de este fichero puede ser una credencial: los valores versionados son
  //     configuración de la app, y lo que no debe versionarse va en `delEntorno`.
  for (const bloque of ['front', 'back']) {
    for (const clave of Object.keys(amb[bloque]?.valores ?? {})) {
      if (/client_?id|secret|token|key/i.test(clave)) {
        errores.push(
          `${nombre}.${bloque}.valores.${clave}: eso no va en environments.json, que se versiona.\n` +
            `    Declara de qué variable de entorno sale, en ${bloque}.delEntorno.`,
        );
      }
    }
  }
}

// 3 · la región, contra los dos ficheros estáticos que la llevan literal
const regiones = new Set(
  Object.values(doc).filter(montado).map((amb) => amb.region),
);

const firebase = JSON.parse(readFileSync(FIREBASE_JSON, 'utf8'));
const regionRewrite = firebase.hosting?.rewrites?.find((r) => r.function)?.function?.region;
const regionFuncion = readFileSync(FUNCION_INDEX, 'utf8').match(/region:\s*'([^']+)'/)?.[1];

for (const [ruta, valor] of [
  [`${FIREBASE_JSON} (rewrite de Hosting)`, regionRewrite],
  [`${FUNCION_INDEX} (setGlobalOptions)`, regionFuncion],
]) {
  if (!valor) {
    errores.push(`No he sabido leer la región en ${ruta}.`);
  } else if (!regiones.has(valor)) {
    errores.push(
      `${ruta} dice región "${valor}", y ningún ambiente montado la declara.\n` +
        `    Declaradas en ${ENVIRONMENTS}: ${[...regiones].join(', ')}`,
    );
  }
}

for (const nota of notas) console.log(`· ${nota}`);

if (errores.length > 0) {
  console.error('');
  for (const error of errores) console.error(`\x1b[31m✗ ${error}\x1b[0m`);
  console.error('');
  process.exit(1);
}

console.log(`\x1b[32m✔ deploy/environments.json coherente (${[...regiones].join(', ')}).\x1b[0m`);
NODE
