#!/usr/bin/env bash
#
# Crea el cliente de Google (OAuth) que la app usa para Drive, Sheets y el login.
#
# SOLO OAUTH, Y NADA DE DESPLIEGUE. Este script produce dos valores —el Client ID y el client
# secret— y los deja en `deploy/.env-secret`. Ahí acaba su trabajo: no toca `environments.json`,
# no genera `config.json` ni el `.env` de ninguna función, no escribe el secreto del emulador y
# no sube nada a GitHub. Todo eso es cablear un ambiente, y lo hace
# `deploy/setup-firebase-project.sh`, que es quien sabe qué es un ambiente.
#
# Lo de aquí es el permiso que concede EL USUARIO sobre SU cuenta —openid, email, profile y
# drive.file—, y para eso al proyecto de Cloud solo le hacen falta dos APIs: Sheets y Drive.
#
# Qué deja hecho:
#   · la cuenta, el proyecto de Cloud y esas dos APIs
#   · el Client ID y el client secret volcados en deploy/.env-secret (que NO se versiona)
#
# El ÚNICO paso manual es la consola: Google no tiene API ni comando para crear un OAuth client
# de tipo "Web application" con Authorized JavaScript origins (`gcloud alpha iap oauth-clients`
# solo crea clientes de IAP, sin orígenes JS, que no sirven para el flujo popup de Google
# Identity Services). El script te deja esa pantalla abierta y los datos listos para pegar.
#
# Uso:  ./deploy/create-google-client-id.sh [-h]
#
# Documentación: deploy/google-client-id.md

set -euo pipefail

# Toda expansión va con llaves — `${VAR}`, no `$VAR`. El bash 3.2 que trae macOS, con un locale
# UTF-8, se traga el primer byte del carácter siguiente dentro del nombre de la variable: un
# `"Creando $PROJECT_ID…"` se lee como la variable `PROJECT_ID<0xE2>` y con `set -u` aborta.

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    # Sin números de línea: imprime el bloque de comentarios de la cabecera hasta que se acaba.
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

# Lo único que escribe, y por eso lo único que necesita saber del repositorio.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_SECRET="${REPO_ROOT}/deploy/.env-secret"
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

command -v gcloud >/dev/null 2>&1 || die "Hace falta la CLI de Google Cloud (gcloud). Instálala con:

    brew install --cask google-cloud-sdk

  o desde https://cloud.google.com/sdk/docs/install , y vuelve a lanzar el script."

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
#
# Es donde viven la pantalla de consentimiento y el cliente. NO se pregunta por «ambiente»: eso
# es vocabulario de despliegue, y aquí no se despliega nada.
# ─────────────────────────────────────────────────────────────────────────────
step "2 · Proyecto de Google Cloud"

info "Proyectos de esta cuenta:"
gcloud projects list --format='table(projectId, name)' 2>/dev/null | sed 's/^/    /' || true

read -r -p "  Project ID a usar (vacío = crear uno nuevo): " PROJECT_ID
PROJECT_ID="$(trim "${PROJECT_ID}")"

if [[ -z "${PROJECT_ID}" ]]; then
    read -r -p "  Project ID del proyecto NUEVO (minúsculas, guiones): " PROJECT_ID
    PROJECT_ID="$(trim "${PROJECT_ID}")"
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
#
# Solo estas dos, y a propósito: son las que hacen que EXISTAN los scopes de Sheets y Drive. Las
# APIs de infraestructura (Functions, Run, Secret Manager…) no tienen nada que ver con el
# consentimiento del usuario y las enciende deploy/setup-firebase-project.sh.
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
#
# Es un campo DEL CLIENTE, no del despliegue: Google solo abre la ventana si la página que la
# pide viene de uno de estos orígenes.
# ─────────────────────────────────────────────────────────────────────────────
step "5 · Authorized JavaScript origins"

cat <<'EOF'
  El origen es el dominio SIN ruta. Son orígenes distintos, y cada uno cuenta:
    · localhost y 127.0.0.1
    · cada puerto
    · el dominio de publicación y su alias, si el hosting sirve dos

  En desarrollo suelen ser  http://localhost:4200  y  http://127.0.0.1:4200 .

  Escribe uno por línea. Línea vacía para terminar.

EOF

ORIGINS=""
ORIGIN_COUNT=0
while true; do
    read -r -p "  origen> " ORIGIN
    ORIGIN="$(trim "${ORIGIN}")"
    [[ -z "${ORIGIN}" ]] && break

    if [[ ! "${ORIGIN}" =~ ^https?://[^/]+$ ]]; then
        warn "'${ORIGIN}' no vale: tiene que empezar por http:// o https:// y no llevar ruta ni / final."
        continue
    fi

    if [[ -z "${ORIGINS}" ]]; then
        ORIGINS="${ORIGIN}"
    else
        ORIGINS="${ORIGINS}
${ORIGIN}"
    fi
    ORIGIN_COUNT=$((ORIGIN_COUNT + 1))
done

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
       Branding      → App name, User support email, Developer contact.
                       NO subas App logo: obliga a pasar la verificación de Google.
       Audience      → User type: External
       Data Access   → los 4 scopes, y solo esos:
                         openid
                         https://www.googleapis.com/auth/userinfo.email
                         https://www.googleapis.com/auth/userinfo.profile
                         https://www.googleapis.com/auth/drive.file
       Audience      → Publish app   ← NO es opcional, ver abajo

    2. Clients → Create client
       Application type:  Web application
       Name:              ${CLIENT_NAME}
       Authorized JavaScript origins:  los ${ORIGIN_COUNT} de arriba
       Authorized redirect URIs:       ninguno
                                       (el flujo popup canjea contra el 'postmessage'
                                        reservado, que no se da de alta aquí)

  ⚠️  Publish app no es opcional: en "Testing", Google CADUCA LOS REFRESH TOKENS A LOS 7 DÍAS.
      Como es el backend quien los custodia, con el proyecto en Testing la sesión se perdería
      cada semana — justo el fallo que este diseño arregla, y sin ninguna pista de por qué.
      Publicar sale gratis: drive.file no exige verificación de Google.

EOF

CLIENTS_URL="https://console.cloud.google.com/auth/clients/create?project=${PROJECT_ID}"
info "Abriendo ${CLIENTS_URL}"
open_url "${CLIENTS_URL}"

echo
read -r -p "  Pega aquí el Client ID: " CLIENT_ID
CLIENT_ID="$(trim "${CLIENT_ID}")"

[[ "${CLIENT_ID}" == *.apps.googleusercontent.com ]] ||
    die "Eso no parece un Client ID (tiene que acabar en .apps.googleusercontent.com)."

echo
info "Ahora el Client secret. La consola solo lo enseña una vez; no se verá al teclearlo."
read -r -s -p "  Client secret: " CLIENT_SECRET
echo
CLIENT_SECRET="$(trim "${CLIENT_SECRET}")"
[[ -n "${CLIENT_SECRET}" ]] ||
    die "Hace falta el client secret: sin él el backend no puede canjear el código."

# ─────────────────────────────────────────────────────────────────────────────
# 7 · Volcar los dos valores, y parar
#
# Van los DOS al mismo sitio aunque solo uno sea secreto: son la pareja que produce una misma
# visita a la consola, y separarlos obligaría a acordarse de cuál iba dónde. Dónde acaba cada uno
# lo decide el cableado del ambiente, que es otro script.
# ─────────────────────────────────────────────────────────────────────────────
step "7 · Guardando el resultado"

if ! (cd "${REPO_ROOT}" && git check-ignore -q "deploy/.env-secret"); then
    die "deploy/.env-secret NO está ignorado por git. Añádelo al .gitignore antes de seguir:
  un secreto versionado hay que rotarlo, no borrarlo."
fi

# El cuaderno: se AÑADE, nunca se reescribe. Si el cliente se rota, el lote nuevo va debajo y el
# viejo queda como registro de que existió. Con semántica .env, gana el último.
{
    printf '\n# ─── %s · proyecto %s · cliente %s · %s\n' \
        "$(date '+%Y-%m-%d %H:%M')" "${PROJECT_ID}" "${CLIENT_NAME}" "${SCRIPT_NAME}"
    printf 'GOOGLE_OAUTH_CLIENT_ID=%s\n' "${CLIENT_ID}"
    printf 'GOOGLE_OAUTH_CLIENT_SECRET=%s\n' "${CLIENT_SECRET}"
} >>"${ENV_SECRET}"

unset CLIENT_SECRET

bold "  ✓ deploy/.env-secret ← lote nuevo"
warn "Ese fichero lleva un secreto en claro: no se versiona y no se pega en un chat."

# ─────────────────────────────────────────────────────────────────────────────
step "Listo"

cat <<EOF

  Cuenta:      ${ACCOUNT}
  Proyecto:    ${PROJECT_ID}
  Cliente:     ${CLIENT_NAME}
  Client ID:   ${CLIENT_ID}

  Los dos valores están en deploy/.env-secret. Este script no los reparte: repartirlos es
  cablear un ambiente, y lo hace

    ./deploy/setup-firebase-project.sh

  que coge el último lote y lo lleva a environments.json, a los ficheros generados, al emulador
  y a los environment secrets de GitHub.

EOF
