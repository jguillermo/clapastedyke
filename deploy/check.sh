#!/usr/bin/env bash
#
# Comprueba lo que copiar no puede garantizar.
#
# `deploy/wire-environment.sh` copia valores; no los inventa ni los deriva. Eso deja dos huecos que
# solo se pueden cerrar comprobando:
#
#   1. Valores escritos DOS VECES a propósito. El Client ID de Google lo necesitan el navegador
#      (`front.valores.googleClientId`) y la función (`back.valores.GOOGLE_OAUTH_CLIENT_ID`), y cada
#      bloque declara el suyo. Si divergen, Google rechaza el canje con `invalid_client` y el mensaje
#      no dice por qué.
#
#   2. Valores que viven en ficheros ESTÁTICOS, que ningún script genera: la región está en
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
    if (amb[bloque] && !amb[bloque].valores) errores.push(`${nombre}.${bloque}: falta "valores".`);
  }
  if (!amb.region) errores.push(`${nombre}: falta "region".`);

  // 1 · el Client ID está escrito dos veces y tiene que decir lo mismo
  const front = amb.front?.valores?.googleClientId;
  const back = amb.back?.valores?.GOOGLE_OAUTH_CLIENT_ID;
  if (front !== back) {
    errores.push(
      `${nombre}: el Client ID de Google no coincide entre front y back.\n` +
        `    front.valores.googleClientId          = ${JSON.stringify(front)}\n` +
        `    back.valores.GOOGLE_OAUTH_CLIENT_ID   = ${JSON.stringify(back)}\n` +
        `    Los dos son el MISMO cliente: divergir da "invalid_client" al canjear el código.`,
    );
  }
  if (!front) {
    errores.push(`${nombre}: montado pero sin googleClientId. Cablea el cliente (deploy/README.md).`);
  }
}

// 2 · la región, contra los dos ficheros estáticos que la llevan literal
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
