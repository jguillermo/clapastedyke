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
command -v git >/dev/null 2>&1 || die "Hace falta git para comprobar qué ficheros se versionan."
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

env_has_config() {
    node -e 'const e=require(process.argv[1])[process.argv[2]];process.exit(e&&e.config?0:1)' \
        "${ENVIRONMENTS}" "$1"
}

env_client_id() {
    node -e 'const e=require(process.argv[1])[process.argv[2]];process.stdout.write(e&&e.config&&e.config.googleClientId?e.config.googleClientId:"")' \
        "${ENVIRONMENTS}" "$1"
}

# El cuaderno es append-only y cada alta escribe un LOTE —su cabecera y sus claves— separado del
# anterior por una línea en blanco. Se lee EL LOTE ENTERO, el último que tenga un Client ID, y no
# la última aparición de cada clave por separado.
#
# La diferencia importa desde que un proyecto puede tener varios clientes: con dos altas
# anotadas, leer clave a clave puede emparejar el Client ID de una con el secret de la otra, y
# entonces Google rechaza el canje con `invalid_client` sin dar ninguna pista de por qué.
#
# `RS=""` es el modo párrafo de awk: cada registro es un lote.
ultimo_lote() {
    [[ -f "${ENV_SECRET}" ]] || return 0
    awk 'BEGIN { RS = "" }
         /GOOGLE_OAUTH_CLIENT_ID=/ { lote = $0 }
         END { if (lote != "") print lote }' "${ENV_SECRET}"
}

# Un campo del lote ya leído. El `|| true` es necesario: con `pipefail`, un grep sin resultado
# haría fallar la asignación y `set -e` mataría el script.
campo_lote() {
    printf '%s\n' "${LOTE}" | grep -E "^$1=" | head -1 | cut -d= -f2- || true
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

LOTE="$(ultimo_lote)"
CLIENT_ID="$(campo_lote GOOGLE_OAUTH_CLIENT_ID)"
CLIENT_SECRET="$(campo_lote GOOGLE_OAUTH_CLIENT_SECRET)"
LOTE_CABECERA="$(printf '%s\n' "${LOTE}" | grep -E '^# ───' | head -1 | sed 's/^# ─── //' || true)"

if [[ -n "${CLIENT_ID}" ]]; then
    info "Último cliente anotado en deploy/.env-secret:"
    # La cabecera del lote lleva fecha, proyecto y nombre del cliente — con varios anotados, es
    # lo único que permite reconocer cuál es sin ir a la consola.
    if [[ -n "${LOTE_CABECERA}" ]]; then
        info "    ${LOTE_CABECERA}"
    fi
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

# El bloque `config` ES el config.json que publica la app, así que lo crea este script y no el
# de infraestructura: allí sería configuración de la app en el sitio equivocado. Si el ambiente
# lo estrena, se clona el del primero que haya para que ninguna clave nueva se quede fuera.
DEBUG_VALOR=""
if ! env_has_config "${AMBIENTE}"; then
    info "El ambiente '${AMBIENTE}' estrena su bloque de configuración."
    DEBUG_DEFECTO="true"
    case "${AMBIENTE}" in
        prod | production) DEBUG_DEFECTO="false" ;;
    esac
    read -r -p "  ¿Trazas de depuración encendidas? [${DEBUG_DEFECTO}] " DEBUG_RESP
    case "$(lower "$(trim "${DEBUG_RESP}")")" in
        s | si | sí | y | yes | true) DEBUG_VALOR="true" ;;
        n | no | false) DEBUG_VALOR="false" ;;
        *) DEBUG_VALOR="${DEBUG_DEFECTO}" ;;
    esac
fi

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const [file, ambiente, clientId, debug] = process.argv.slice(1);
const doc = JSON.parse(readFileSync(file, "utf8"));
const entrada = doc[ambiente];

if (!entrada.config) {
  const plantilla = Object.values(doc).find((e) => e.config);
  entrada.config = plantilla
    ? { ...plantilla.config }
    : { debug: true, googleClientId: "", syncPollSeconds: 120 };
  entrada.config.debug = debug === "true";
}

entrada.config.googleClientId = clientId;
writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
' "${ENVIRONMENTS}" "${AMBIENTE}" "${CLIENT_ID}" "${DEBUG_VALOR}"

info "deploy/firebase/environments.json → ${AMBIENTE}.config.googleClientId"

(cd "${REPO_ROOT}" && node deploy/firebase/api-env.mjs "${AMBIENTE}" | sed 's/^/  /')

# public/config.json es el fichero que sirve `ng serve` y los E2E: es el de DESARROLLO LOCAL, no
# el de ningún despliegue (ese lo genera el workflow con --out). Se pregunta en vez de asumir que
# el ambiente local se llama "dev": puede no existir tal ambiente.
#
# En un ambiente de producción el defecto es NO: darle a Enter sin leer dejaría el config.json de
# desarrollo apuntando a prod, y trabajarías en local contra el proyecto de verdad sin enterarte.
LOCAL_DEFECTO="S"
case "${AMBIENTE}" in
    prod | production) LOCAL_DEFECTO="n" ;;
esac

if [[ "${LOCAL_DEFECTO}" == "S" ]]; then
    read -r -p "  ¿Es '${AMBIENTE}' el ambiente que usas en local? [S/n] " ES_LOCAL
else
    read -r -p "  ¿Es '${AMBIENTE}' el ambiente que usas en local? [s/N] " ES_LOCAL
fi
ES_LOCAL="$(lower "$(trim "${ES_LOCAL}")")"
[[ -n "${ES_LOCAL}" ]] || ES_LOCAL="$(lower "${LOCAL_DEFECTO}")"

case "${ES_LOCAL}" in
    s | si | sí | y | yes) (cd "${REPO_ROOT}" && node deploy/firebase/config.mjs "${AMBIENTE}" | sed 's/^/  /') ;;
    *) info "public/config.json no se toca." ;;
esac

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
        # Se crea vacío y se cierra ANTES de escribir el secreto dentro: con `>` a secas nacería
        # con el umask por defecto (644), legible por cualquier usuario de la máquina.
        : >"${SECRET_LOCAL}"
        chmod 600 "${SECRET_LOCAL}"
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
