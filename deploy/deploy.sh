#!/usr/bin/env bash
#
# Publica en Firebase lo que hay en `deploy/dist/`.
#
#   ./deploy/deploy.sh <ambiente> [--only <objetivos>]
#
#   ./deploy/deploy.sh dev --only hosting
#   ./deploy/deploy.sh dev --only functions:auth,firestore:rules
#
# Sin `--only` sube todo (hosting + funciones + reglas). Lo normal es publicar por separado: el
# frontend cambia mucho más a menudo que el backend, y el backend tarda bastante más.
#
# Es el ÚNICO sitio desde el que se invoca la CLI de Firebase. Se ejecuta con `cd deploy`, así que
# `deploy/firebase.json` y todas sus rutas (`dist/hosting`, `dist/functions/auth`,
# `firestore.rules`) quedan dentro de su propio directorio de proyecto — que es lo que hace posible
# que Firebase viva entero dentro de esta carpeta.
#
# NO compila: da por hecho que `deploy/dist` ya es del ambiente pedido. Compila antes:
#
#   npm run build -- <ambiente>
#
# Credenciales: espera `GOOGLE_APPLICATION_CREDENTIALS` apuntando a la clave de la cuenta de
# servicio del proyecto (lo pone el workflow; en local lo deja `setup-firebase-project.sh` en
# ~/.config/clapastedyke/<projectId>-deploy.json).
#
# Documentación: deploy/README.md · manual/firebase-deploy.md

set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    ayuda "${BASH_SOURCE[0]}"
    exit 0
fi

PEDIDO=""
ONLY=""

while [[ $# -gt 0 ]]; do
    case "$1" in
    --only)
        ONLY="${2:-}"
        [[ -n "${ONLY}" ]] || die "Falta la lista de objetivos después de --only."
        shift 2
        ;;
    -*) die "Opción desconocida: $1. Usa -h para ver el uso." ;;
    *)
        PEDIDO="$1"
        shift
        ;;
    esac
done

resolver_ambiente "${PEDIDO}"

DIST="${DEPLOY_DIR}/dist"

[[ -d "${DIST}" ]] || die "No hay artefacto que publicar: falta deploy/dist.
  Compílalo primero:  npm run build -- ${AMBIENTE}"

# El artefacto no dice de qué ambiente es, así que se comprueba lo único que lo delata: que el
# config.json publicado coincida con el bloque `front` del ambiente que se pide desplegar. Sin esto,
# un `build -- dev` seguido de un `deploy.sh prod` subiría el config de dev a producción.
RUTA_CONFIG="$(env_destino front artefacto)"
if [[ -n "${RUTA_CONFIG}" && -f "${REPO_ROOT}/${RUTA_CONFIG}" ]]; then
    if ! contenido_config_json | diff -q - "${REPO_ROOT}/${RUTA_CONFIG}" >/dev/null 2>&1; then
        die "deploy/dist NO es del ambiente '${AMBIENTE}': su config.json dice otra cosa.
  Recompílalo:  npm run build -- ${AMBIENTE}"
    fi
elif [[ -n "${RUTA_CONFIG}" ]]; then
    die "El artefacto está incompleto: falta ${RUTA_CONFIG}.
  Recompílalo:  npm run build -- ${AMBIENTE}"
fi

[[ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]] ||
    warn "GOOGLE_APPLICATION_CREDENTIALS sin definir: la CLI usará la sesión interactiva de firebase login."

bold "Publicando '${AMBIENTE}' en ${PROJECT_ID}${ONLY:+ (--only ${ONLY})}"

# `cd deploy` y no `--config`: así el directorio de proyecto que detecta la CLI es `deploy/`, y todas
# las rutas de firebase.json quedan dentro de él.
cd "${DEPLOY_DIR}"

if [[ -n "${ONLY}" ]]; then
    npx --yes firebase-tools@latest deploy --only "${ONLY}" --project "${PROJECT_ID}" --non-interactive
else
    npx --yes firebase-tools@latest deploy --project "${PROJECT_ID}" --non-interactive
fi

ok "Publicado en ${PROJECT_ID} — https://${PROJECT_ID}.web.app"
