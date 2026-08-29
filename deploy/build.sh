#!/usr/bin/env bash
#
# Compila el artefacto de un ambiente dentro de `deploy/dist/`.
#
#   npm run build -- [ambiente] [--only hosting|functions]        (ambiente por defecto: local)
#   ./deploy/build.sh [ambiente] [--only hosting|functions]
#
# Al terminar, `deploy/` se basta sola para publicar: dentro de `deploy/dist/` queda TODO lo que
# `firebase deploy` necesita, y nada de fuera hace falta.
#
#   deploy/dist/hosting/              la app compilada + su config.json del ambiente
#   deploy/dist/functions/auth/       la función compilada + package.json + .env.<projectId>
#
# El FUENTE no vive aquí: la app está en `src/` y las funciones en `api/`, cada una con su paquete.
# `deploy/` solo tiene lo que declara y lo que produce el despliegue.
#
# El ambiente se decide AQUÍ, al compilar, y no en el despliegue: así el artefacto que se prueba es
# exactamente el que se sube. Los valores salen del bloque `front`/`back` de ese ambiente en
# `deploy/environments.json`, copiados tal cual a los destinos con rol `artefacto`.
#
# `--only` compila una sola mitad, sin borrar la otra. Es para los dos casos en los que compilar la
# otra no aporta nada y cuesta mucho: los E2E (`--only hosting`, que se ahorran un `npm ci`) y el
# workflow de backend (`--only functions`, que se ahorra el bundle de Angular).
#
# Ningún secreto entra en el artefacto. El client secret lo resuelve la función en ejecución desde
# Secret Manager; ver deploy/README.md.
#
# Documentación: deploy/README.md · manual/firebase-deploy.md

set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    ayuda "${BASH_SOURCE[0]}"
    exit 0
fi

PEDIDO=""
SOLO="todo"

while [[ $# -gt 0 ]]; do
    case "$1" in
    --only)
        SOLO="${2:-}"
        shift 2
        ;;
    -*) die "Opción desconocida: $1. Usa -h para ver el uso." ;;
    *)
        PEDIDO="$1"
        shift
        ;;
    esac
done

case "${SOLO}" in
todo | hosting | functions) ;;
*) die "--only acepta 'hosting' o 'functions', no \"${SOLO}\"." ;;
esac

resolver_ambiente "${PEDIDO}"

DIST="${DEPLOY_DIR}/dist"

if [[ "${SOLO}" == "todo" ]]; then
    bold "Compilando el ambiente '${AMBIENTE}' (proyecto ${PROJECT_ID})"
else
    bold "Compilando '${SOLO}' del ambiente '${AMBIENTE}' (proyecto ${PROJECT_ID})"
fi

avisar_variables_vacias

# Se borra a propósito la mitad que se va a rehacer: un `dist/` incremental puede conservar el
# config.json o un chunk de OTRO ambiente, y eso no se ve hasta que está publicado.
step "Limpiando deploy/dist"
if [[ "${SOLO}" == "todo" ]]; then
    rm -rf "${DIST}"
    info "deploy/dist"
else
    rm -rf "${DIST}/${SOLO}"
    info "deploy/dist/${SOLO}"
fi

# ─────────────────────────────────────────────────────────────────────────────

if [[ "${SOLO}" == "todo" || "${SOLO}" == "hosting" ]]; then

step "Frontend — ng build → deploy/dist/hosting"

(cd "${REPO_ROOT}" && npx ng build)

RUTA_CONFIG="$(env_destino front artefacto)"
[[ -n "${RUTA_CONFIG}" ]] || die "El ambiente \"${AMBIENTE}\" no declara front.destino.artefacto en deploy/environments.json."

# Pisa la copia que `ng build` trajo de `public/` (que es la de desarrollo, ambiente `local`).
contenido_config_json >"${REPO_ROOT}/${RUTA_CONFIG}"
info "${RUTA_CONFIG}"

fi

# ─────────────────────────────────────────────────────────────────────────────

# La carpeta de la función sale de la ruta del .env: `deploy/dist/functions/auth/.env.<id>`.
RUTA_ENV="$(env_destino back artefacto)"
[[ -n "${RUTA_ENV}" ]] || die "El ambiente \"${AMBIENTE}\" no declara back.destino.artefacto en deploy/environments.json."

FUNCION_DIST="${REPO_ROOT}/$(dirname "${RUTA_ENV}")"
FUNCION_NOMBRE="$(basename "${FUNCION_DIST}")"
FUNCION_SRC="${REPO_ROOT}/api/${FUNCION_NOMBRE}"

if [[ "${SOLO}" == "todo" || "${SOLO}" == "functions" ]]; then

step "Backend — tsc → deploy/dist/functions"

[[ -d "${FUNCION_SRC}" ]] || die "No encuentro el fuente de la función en ${FUNCION_SRC}."

npm --prefix "${FUNCION_SRC}" ci
npm --prefix "${FUNCION_SRC}" run build

# Lo que Firebase empaqueta: el código compilado y el manifiesto. `node_modules` lo instala Cloud
# Build a partir del lockfile, así que no se copia.
#
# `lib/` trae DOS árboles —`lib/auth/` y `lib/_common/`— porque el tsconfig de la función usa
# `rootDir: ".."`. Es deliberado: sin eso, un `require("../_common/http")` no encontraría nada en
# producción, donde solo se sube la carpeta de la función.
mkdir -p "${FUNCION_DIST}"
cp -R "${FUNCION_SRC}/lib" "${FUNCION_DIST}/lib"
cp "${FUNCION_SRC}/package.json" "${FUNCION_DIST}/package.json"
cp "${FUNCION_SRC}/package-lock.json" "${FUNCION_DIST}/package-lock.json"
info "$(dirname "${RUTA_ENV}")/ (lib/, package.json, package-lock.json)"

contenido_env_funcion >"${REPO_ROOT}/${RUTA_ENV}"
info "${RUTA_ENV}"

fi

# ─────────────────────────────────────────────────────────────────────────────

ok "deploy/dist listo para el ambiente '${AMBIENTE}' (proyecto ${PROJECT_ID})."

cat <<CIERRE

  Publicar el frontend:  ./deploy/deploy.sh ${AMBIENTE} --only hosting
  Publicar el backend:   ./deploy/deploy.sh ${AMBIENTE} --only functions:${FUNCION_NOMBRE},firestore:rules

CIERRE
