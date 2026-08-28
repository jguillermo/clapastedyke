#!/usr/bin/env bash
#
# Cablea un ambiente con su cliente de Google: coge el último lote de `deploy/.env-secret` y
# reparte sus dos valores por donde tienen que estar.
#
# Es el tercer paso de montar un ambiente, y existe porque repartir no es ni crear ni
# provisionar:
#
#   1. ./deploy/create-google-client-id.sh    crea el cliente en Google  → .env-secret
#   2. ./deploy/setup-firebase-project.sh     monta la infraestructura del proyecto
#   3. ./deploy/wire-environment.sh           ESTE: reparte los valores al ambiente
#
# El (1) solo sabe de Drive, Sheets y auth; el (2) solo de Firebase. Repartir necesita las dos
# cosas a la vez —qué bloque de environments.json tocar, qué ficheros se derivan y a qué
# environment de GitHub va el secreto—, así que vive aparte en vez de ensuciar a uno de los dos.
#
# A dónde va cada valor:
#   · Client ID     → environments.json, y de ahí public/config.json y api/<fn>/.env.<projectId>
#   · Client secret → api/auth/.secret.local (emulador) y el environment secret de GitHub, que es
#                     de donde lo toma deploy-backend.yml para ponerlo en Secret Manager
#
# NO despliega nada y NO habla con Google Cloud: solo escribe ficheros del repositorio y, si hay
# `gh`, un environment secret. Es idempotente.
#
# Uso:  ./deploy/wire-environment.sh [-h]
#
# Documentación: deploy/google-client-id.md · manual/firebase-deploy.md

set -euo pipefail

# Toda expansión va con llaves — `${VAR}`, no `$VAR`. El bash 3.2 que trae macOS, con un locale
# UTF-8, se traga el primer byte del carácter siguiente dentro del nombre de la variable.

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    awk 'NR < 3 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "${BASH_SOURCE[0]}"
    exit 0
fi

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
step() { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }
info() { printf '  %s\n' "$1"; }
warn() { printf '\033[33m  ! %s\033[0m\n' "$1"; }
die() {
    printf '\n\033[31m✗ %s\033[0m\n' "$1" >&2
    exit 1
}

lower() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }
trim() { printf '%s' "$1" | tr -d '[:space:]'; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENTS="${REPO_ROOT}/deploy/firebase/environments.json"
ENV_SECRET="${REPO_ROOT}/deploy/.env-secret"
SECRET_LOCAL="${REPO_ROOT}/api/auth/.secret.local"

command -v node >/dev/null 2>&1 || die "Hace falta Node para leer y escribir environments.json."
[[ -f "${ENVIRONMENTS}" ]] || die "No encuentro ${ENVIRONMENTS}."

GH_DISPONIBLE="no"
# `gh` resuelve el repositorio por el directorio actual, así que se comprueba desde dentro.
if command -v gh >/dev/null 2>&1 && (cd "${REPO_ROOT}" && gh auth status >/dev/null 2>&1); then
    GH_DISPONIBLE="si"
fi
GH_HECHO="no"

env_keys() {
    node -e 'process.stdout.write(Object.keys(require(process.argv[1])).join(" "))' "${ENVIRONMENTS}"
}

env_project_id() {
    node -e 'const e=require(process.argv[1])[process.argv[2]];process.stdout.write(e&&e.projectId?e.projectId:"")' \
        "${ENVIRONMENTS}" "$1"
}

env_client_id() {
    node -e 'const e=require(process.argv[1])[process.argv[2]];process.stdout.write(e&&e.config&&e.config.googleClientId?e.config.googleClientId:"")' \
        "${ENVIRONMENTS}" "$1"
}

# El último valor de una clave en el cuaderno. `deploy/.env-secret` es append-only y con
# semántica .env gana el último, así que `tail -1` ES la respuesta correcta. `cut -f2-` conserva
# los '=' que pueda llevar el valor.
secret_note() {
    [[ -f "${ENV_SECRET}" ]] || return 1
    local value
    value="$(grep -E "^$1=" "${ENV_SECRET}" 2>/dev/null | tail -1 | cut -d= -f2-)"
    [[ -n "${value}" ]] || return 1
    printf '%s' "${value}"
}

# ─────────────────────────────────────────────────────────────────────────────
# 1 · Ambiente
# ─────────────────────────────────────────────────────────────────────────────
step "1 · Ambiente"

AMBIENTES="$(env_keys)"
info "Ambientes en deploy/firebase/environments.json:"
for CLAVE in ${AMBIENTES}; do
    printf '    %-10s → %s\n' "${CLAVE}" "$(env_project_id "${CLAVE}")"
done

read -r -p "  Ambiente a cablear: " AMBIENTE
AMBIENTE="$(lower "$(trim "${AMBIENTE}")")"
[[ -n "${AMBIENTE}" ]] || die "Hace falta un ambiente."

PROJECT_ID="$(env_project_id "${AMBIENTE}")"
[[ -n "${PROJECT_ID}" ]] ||
    die "El ambiente '${AMBIENTE}' no está en deploy/firebase/environments.json. Los que hay: ${AMBIENTES}."

# El projectId decide cómo se llama el .env de la función, así que sin él no se puede cablear. Y
# este script NO lo rellena: es dato de despliegue, y lo pone ./deploy/setup-firebase-project.sh.
case "${PROJECT_ID}" in
    TU-PROJECT-ID*)
        die "El ambiente '${AMBIENTE}' todavía tiene el marcador '${PROJECT_ID}'.

  Escribe su projectId real en deploy/firebase/environments.json (manual/firebase-deploy.md,
  paso 2), o monta el ambiente con ./deploy/setup-firebase-project.sh.

  No se ha escrito nada."
        ;;
esac

bold "  ✓ ${AMBIENTE} → ${PROJECT_ID}"

# ─────────────────────────────────────────────────────────────────────────────
# 2 · Los valores del cliente
# ─────────────────────────────────────────────────────────────────────────────
step "2 · El cliente de Google"

CLIENT_ID="$(secret_note GOOGLE_OAUTH_CLIENT_ID || true)"
CLIENT_SECRET="$(secret_note GOOGLE_OAUTH_CLIENT_SECRET || true)"

if [[ -n "${CLIENT_ID}" ]]; then
    info "Último lote de deploy/.env-secret:"
    info "    ${CLIENT_ID}"
    read -r -p "  ¿Es el cliente de '${AMBIENTE}'? [S/n] " USE_NOTE
    case "$(lower "${USE_NOTE}")" in
        n | no)
            CLIENT_ID=""
            CLIENT_SECRET=""
            ;;
    esac
else
    warn "deploy/.env-secret no tiene ningún Client ID todavía."
    info "Créalo con ./deploy/create-google-client-id.sh, o pégalo aquí."
fi

if [[ -z "${CLIENT_ID}" ]]; then
    read -r -p "  Client ID: " CLIENT_ID
    CLIENT_ID="$(trim "${CLIENT_ID}")"
    [[ -n "${CLIENT_ID}" ]] || die "Sin Client ID no hay nada que cablear."
    info "El client secret no se verá al teclearlo. Vacío = no tocar el que ya hubiera."
    read -r -s -p "  Client secret: " CLIENT_SECRET
    echo
    CLIENT_SECRET="$(trim "${CLIENT_SECRET}")"
fi

[[ "${CLIENT_ID}" == *.apps.googleusercontent.com ]] ||
    die "Eso no parece un Client ID (tiene que acabar en .apps.googleusercontent.com)."

bold "  ✓ ${CLIENT_ID}"

# ─────────────────────────────────────────────────────────────────────────────
# 3 · El Client ID → environments.json, y de ahí los derivados
#
# Se escribe en UN solo sitio. El Client ID no es un secreto —viaja en cada petición del
# navegador—, así que va versionado; lo que no puede es estar escrito dos veces, porque en
# cuanto las copias divergen Google rechaza el canje con `invalid_client`.
# ─────────────────────────────────────────────────────────────────────────────
step "3 · Escribiendo el Client ID"

ANTERIOR="$(env_client_id "${AMBIENTE}")"

if [[ "${ANTERIOR}" == "${CLIENT_ID}" ]]; then
    info "El ambiente ya tenía este mismo Client ID."
elif [[ -n "${ANTERIOR}" ]]; then
    warn "El ambiente '${AMBIENTE}' tenía otro Client ID:"
    info "    antes:  ${ANTERIOR}"
    info "    ahora:  ${CLIENT_ID}"
    read -r -p "  ¿Reemplazarlo? [s/N] " REPLACE
    case "$(lower "${REPLACE}")" in
        s | si | sí | y | yes) ;;
        *) die "Cancelado: no se ha escrito nada." ;;
    esac
fi

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const [file, ambiente, clientId] = process.argv.slice(1);
const doc = JSON.parse(readFileSync(file, "utf8"));
doc[ambiente].config.googleClientId = clientId;
writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
' "${ENVIRONMENTS}" "${AMBIENTE}" "${CLIENT_ID}"

info "deploy/firebase/environments.json → ${AMBIENTE}.config.googleClientId"

(cd "${REPO_ROOT}" && node deploy/firebase/api-env.mjs "${AMBIENTE}" | sed 's/^/  /')

# public/config.json es el de DESARROLLO LOCAL: solo lo regenera el ambiente que lo sirve. El del
# despliegue lo genera el workflow con --out, así que aquí sería mentira.
if [[ "${AMBIENTE}" == "dev" ]]; then
    (cd "${REPO_ROOT}" && node deploy/firebase/config.mjs "${AMBIENTE}" | sed 's/^/  /')
else
    info "public/config.json no se toca: es el de desarrollo local (ambiente dev)."
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4 · El client secret → emulador y GitHub
#
# Al despliegue no llega desde aquí: llega desde el environment secret, que deploy-backend.yml
# escribe en Secret Manager antes de desplegar. Eso es lo que hace que montar un ambiente sea
# elegirlo en Actions.
# ─────────────────────────────────────────────────────────────────────────────
step "4 · El client secret"

if [[ -z "${CLIENT_SECRET}" ]]; then
    warn "Sin client secret: no se toca ni el emulador ni GitHub."
    warn "Hasta que esté, ni el emulador ni el despliegue pueden canjear el código."
else
    # Este SÍ se reescribe: es configuración del emulador, no cuaderno.
    if (cd "${REPO_ROOT}" && git check-ignore -q "api/auth/.secret.local"); then
        printf 'GOOGLE_OAUTH_CLIENT_SECRET=%s\n' "${CLIENT_SECRET}" >"${SECRET_LOCAL}"
        info "api/auth/.secret.local ← para el emulador"
    else
        warn "api/auth/.secret.local NO está ignorado por git: no lo escribo."
    fi

    if [[ "${GH_DISPONIBLE}" == "si" ]]; then
        read -r -p "  ¿Subirlo al environment '${AMBIENTE}' de GitHub? [S/n] " USE_GH
        case "$(lower "${USE_GH}")" in
            n | no) ;;
            *)
                (cd "${REPO_ROOT}" &&
                    gh api -X PUT "repos/{owner}/{repo}/environments/${AMBIENTE}" >/dev/null 2>&1) || true
                if printf '%s' "${CLIENT_SECRET}" |
                    (cd "${REPO_ROOT}" &&
                        gh secret set GOOGLE_OAUTH_CLIENT_SECRET --env "${AMBIENTE}" 2>/dev/null); then
                    info "GitHub → environment '${AMBIENTE}' → GOOGLE_OAUTH_CLIENT_SECRET"
                    GH_HECHO="si"
                else
                    warn "No se ha podido subir con gh. Hazlo a mano (abajo)."
                fi
                ;;
        esac
    fi
fi

unset CLIENT_SECRET

# ─────────────────────────────────────────────────────────────────────────────
step "Listo"

cat <<EOF

  Ambiente:    ${AMBIENTE}
  Proyecto:    ${PROJECT_ID}
  Client ID:   ${CLIENT_ID}

EOF

if [[ "${GH_HECHO}" == "no" ]]; then
    cat <<EOF
  Falta el environment secret del client secret:
    Settings → Environments → ${AMBIENTE} → Add environment secret
    Nombre: GOOGLE_OAUTH_CLIENT_SECRET
    Valor:  el último lote de deploy/.env-secret

EOF
fi

cat <<EOF
  Para probarlo en local:  npm run emulators  ·  npm start  →  /cuenta  →  Conectar con Google
  y después RECARGAR la página: tiene que seguir conectada sin pulsar nada.

  Para publicarlo:  Actions → Desplegar el BACKEND → ${AMBIENTE}, y después el frontend.

EOF
