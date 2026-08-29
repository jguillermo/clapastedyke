#!/usr/bin/env bash
#
# Arranca los emuladores de Firebase (funciones + Firestore) para el ambiente `local`.
#
#   npm run emulators
#   ./deploy/emulators.sh [ambiente]        (defecto: local)
#
# El proyecto sale de `deploy/environments.json`; antes estaba escrito a mano en `package.json`, que
# era el último sitio del repo donde el ambiente no salía del fichero de ambientes.
#
# Compila la función antes de arrancar, porque el emulador ejecuta el JavaScript de `lib/`, no el
# TypeScript. Los parámetros públicos los lee del `.env.<projectId>` que deja
# `./deploy/wire-environment.sh`; el client secret, de `api/<fn>/.secret.local` — si ese
# fichero no existe, el emulador arranca igual y `/exchange` contesta 500.
#
# `ng serve` llega hasta aquí por `deploy/proxy.config.json`, también generado. Arranca esto en una
# terminal y `npm start` en otra.
#
# Documentación: deploy/README.md · manual/api.md

set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    ayuda "${BASH_SOURCE[0]}"
    exit 0
fi

resolver_ambiente "${1:-local}"

RUTA_ENV="$(env_destino back emulador)"
[[ -n "${RUTA_ENV}" ]] || die "El ambiente \"${AMBIENTE}\" no declara back.destino.emulador: no está pensado para el emulador."

FUNCION_SRC="${REPO_ROOT}/$(dirname "${RUTA_ENV}")"
FUNCION_NOMBRE="$(basename "${FUNCION_SRC}")"

if [[ ! -f "${REPO_ROOT}/${RUTA_ENV}" ]]; then
    die "Falta ${RUTA_ENV}.
  Cablea el ambiente primero:  ./deploy/wire-environment.sh ${AMBIENTE}"
fi

if [[ ! -f "${FUNCION_SRC}/.secret.local" ]]; then
    warn "Falta $(dirname "${RUTA_ENV}")/.secret.local: sin el client secret, /exchange contestará 500."
    warn "Cópialo del último lote de deploy/.env-secret (ver deploy/README.md)."
fi

step "Compilando la función '${FUNCION_NOMBRE}'"
npm --prefix "${FUNCION_SRC}" run build

step "Emuladores de ${PROJECT_ID}"

# El emulador lee el fuente de la función, no `deploy/dist`: por eso se le pasa `--config` con un
# firebase.json de emulación en vez del de despliegue.
cd "${DEPLOY_DIR}"
npx --yes firebase-tools@latest emulators:start \
    --only functions,firestore \
    --config firebase.emulators.json \
    --project "${PROJECT_ID}"
