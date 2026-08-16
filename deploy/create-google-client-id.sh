#!/usr/bin/env bash
#
# Crea el Client ID de Google (OAuth) para la sincronización con Sheets/Drive.
#
# El script no lee nada del repositorio: TODO lo que necesita te lo pregunta —
# la cuenta, el proyecto, el nombre del cliente y los orígenes autorizados.
#
# Automatiza lo que Google deja automatizar: login desde la terminal, proyecto y APIs.
# El ÚNICO paso manual es pulsar "Create client" en la consola: Google no tiene API ni
# comando para crear un OAuth client de tipo "Web application" con Authorized JavaScript
# origins (`gcloud alpha iap oauth-clients` solo crea clientes de IAP, sin orígenes JS,
# que no sirven para el flujo popup de Google Identity Services). El script te deja esa
# pantalla abierta y los datos listos para pegar.
#
# Uso:  ./deploy/create-google-client-id.sh [-h]
#
# Documentación: deploy/google-client-id.md

set -euo pipefail

# Toda expansión va con llaves — `${VAR}`, no `$VAR`. El bash 3.2 que trae macOS, con un locale
# UTF-8, se traga el primer byte del carácter siguiente dentro del nombre de la variable: un
# `"Creando $PROJECT_ID…"` se lee como la variable `PROJECT_ID<0xE2>` y con `set -u` aborta.

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    sed -n '3,17p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
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

open_url() {
    if command -v open >/dev/null 2>&1; then
        open "$1" >/dev/null 2>&1 || true
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$1" >/dev/null 2>&1 || true
    fi
}

copy_clipboard() {
    if command -v pbcopy >/dev/null 2>&1; then
        printf '%s' "$1" | pbcopy && return 0
    elif command -v xclip >/dev/null 2>&1; then
        printf '%s' "$1" | xclip -selection clipboard && return 0
    fi
    return 1
}

if ! command -v gcloud >/dev/null 2>&1; then
    die "Hace falta la CLI de Google Cloud (gcloud). Instálala con:

    brew install --cask google-cloud-sdk

  o desde https://cloud.google.com/sdk/docs/install , y vuelve a lanzar el script."
fi

# ─────────────────────────────────────────────────────────────────────────────
# 1 · Cuenta de Google
# ─────────────────────────────────────────────────────────────────────────────
step "1 · Cuenta de Google"

ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -1)"

if [[ -n "${ACCOUNT}" ]]; then
    info "Ya hay sesión iniciada: ${ACCOUNT}"
    read -r -p "  ¿Usar esta cuenta? [S/n] " USE_ACCOUNT
    case "$(lower "${USE_ACCOUNT}")" in
        n | no) ACCOUNT="" ;;
    esac
fi

if [[ -z "${ACCOUNT}" ]]; then
    info "Se abrirá el navegador para iniciar sesión…"
    gcloud auth login
    ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -1)"
    [[ -n "${ACCOUNT}" ]] || die "El login no ha terminado bien."
fi

bold "  ✓ ${ACCOUNT}"

# ─────────────────────────────────────────────────────────────────────────────
# 2 · Proyecto de Google Cloud
# ─────────────────────────────────────────────────────────────────────────────
step "2 · Proyecto de Google Cloud"

info "Proyectos de esta cuenta:"
gcloud projects list --format='table(projectId, name)' 2>/dev/null | sed 's/^/    /' || true

read -r -p "  Project ID a usar (vacío = crear uno nuevo): " PROJECT_ID

if [[ -z "${PROJECT_ID}" ]]; then
    read -r -p "  Project ID del proyecto NUEVO (minúsculas, guiones): " PROJECT_ID
    [[ -n "${PROJECT_ID}" ]] || die "Hace falta un Project ID."
    read -r -p "  Nombre visible del proyecto: " PROJECT_NAME
    [[ -n "${PROJECT_NAME}" ]] || die "Hace falta un nombre de proyecto."
    info "Creando ${PROJECT_ID}…"
    gcloud projects create "${PROJECT_ID}" --name="${PROJECT_NAME}"
fi

gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1 ||
    die "El proyecto '${PROJECT_ID}' no existe o esta cuenta no lo ve."

bold "  ✓ ${PROJECT_ID}"

# ─────────────────────────────────────────────────────────────────────────────
# 3 · APIs
# ─────────────────────────────────────────────────────────────────────────────
step "3 · Habilitando Sheets API y Drive API"

# Antes del consentimiento: los scopes solo se ofrecen si su API está habilitada.
gcloud services enable sheets.googleapis.com drive.googleapis.com --project "${PROJECT_ID}"
bold "  ✓ sheets.googleapis.com · drive.googleapis.com"

# ─────────────────────────────────────────────────────────────────────────────
# 4 · Nombre del cliente
# ─────────────────────────────────────────────────────────────────────────────
step "4 · Nombre del OAuth client"

cat <<'EOF'
  Es solo la etiqueta con la que verás esta credencial en la lista "Clients" de la consola.
  NO es lo que ve el usuario en la pantalla de permisos (eso es el "App name" del consent
  screen). Google lo pide al crear el cliente, y se puede renombrar después.

  Ejemplos:  Clapastedyke web (dev)   ·   Clapastedyke web (prod)

EOF

read -r -p "  Nombre del OAuth client: " CLIENT_NAME
[[ -n "${CLIENT_NAME}" ]] || die "Hace falta un nombre para el cliente."

# ─────────────────────────────────────────────────────────────────────────────
# 5 · Orígenes autorizados
# ─────────────────────────────────────────────────────────────────────────────
step "5 · Authorized JavaScript origins"

cat <<'EOF'
  El origen es el dominio SIN ruta: http://localhost:4200 , https://mi-sitio.web.app
  Recuerda que son orígenes distintos:
    · localhost y 127.0.0.1
    · cada puerto
    · <projectId>.web.app y <projectId>.firebaseapp.com  (Firebase publica los dos)

  Escribe uno por línea. Línea vacía para terminar.

EOF

ORIGINS=""
ORIGIN_COUNT=0
while true; do
    read -r -p "  origen> " ORIGIN
    ORIGIN="$(printf '%s' "${ORIGIN}" | tr -d '[:space:]')"
    [[ -z "${ORIGIN}" ]] && break

    if [[ ! "${ORIGIN}" =~ ^https?://[^/]+$ ]]; then
        warn "'${ORIGIN}' no vale: tiene que empezar por http:// o https:// y no llevar ruta ni / final."
        continue
    fi

    ORIGINS="${ORIGINS}${ORIGIN}"$'\n'
    ORIGIN_COUNT=$((ORIGIN_COUNT + 1))
done

ORIGINS="$(printf '%s' "${ORIGINS}")"

if [[ "${ORIGIN_COUNT}" -eq 0 ]]; then
    warn "Sin orígenes, conectar dará 'Error 400: origin_mismatch'. Podrás añadirlos luego en la consola."
else
    printf '\n'
    printf '%s\n' "${ORIGINS}" | sed 's/^/    /'
    if copy_clipboard "${ORIGINS}"; then
        printf '\n'
        info "(${ORIGIN_COUNT} orígenes copiados al portapapeles)"
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# 6 · Crear el cliente en la consola (único paso manual)
# ─────────────────────────────────────────────────────────────────────────────
step "6 · Crear el cliente"

cat <<EOF

  Google no permite crear este cliente por CLI. En la consola que se abre ahora:

    1. Si es la primera vez, completa el consent screen (Google Auth Platform):
       Audience → User type: External
       Data Access → los 4 scopes: openid, userinfo.email, userinfo.profile, drive.file
       Audience → Test users: los correos que vayan a conectarse (o Publish app)

    2. Clients → Create client
       Application type:  Web application
       Name:              ${CLIENT_NAME}
       Authorized JavaScript origins:  los ${ORIGIN_COUNT} de arriba
       Authorized redirect URIs:       ninguno

EOF

CLIENTS_URL="https://console.cloud.google.com/auth/clients/create?project=${PROJECT_ID}"
info "Abriendo ${CLIENTS_URL}"
open_url "${CLIENTS_URL}"

echo
read -r -p "  Pega aquí el Client ID: " CLIENT_ID
CLIENT_ID="$(printf '%s' "${CLIENT_ID}" | tr -d '[:space:]')"

[[ "${CLIENT_ID}" == *.apps.googleusercontent.com ]] ||
    die "Eso no parece un Client ID (tiene que acabar en .apps.googleusercontent.com)."

# ─────────────────────────────────────────────────────────────────────────────
step "Listo"

if copy_clipboard "${CLIENT_ID}"; then
    info "(Client ID copiado al portapapeles)"
fi

cat <<EOF

  Cuenta:      ${ACCOUNT}
  Proyecto:    ${PROJECT_ID}
  Cliente:     ${CLIENT_NAME}
  Client ID:   ${CLIENT_ID}

  Pégalo como "googleClientId" en el bloque config del ambiente que corresponda
  (deploy/firebase/environments.json) y regenera public/config.json con:

    npm run config

  Para comprobarlo:  npm start  →  /cuenta  →  Conectar con Google

EOF
