#!/usr/bin/env bash
#
# Crea un proyecto de Google Cloud y, dentro de él, el cliente OAuth con permiso para Drive,
# Sheets y la identidad del usuario.
#
# Esa es TODA su responsabilidad. Lo que concede aquí es el permiso que da EL USUARIO sobre SU
# cuenta —openid, email, profile y drive.file—, y para que esos permisos existan al proyecto solo
# le hacen falta dos APIs: Sheets y Drive.
#
# Qué deja hecho:
#   · la cuenta y un proyecto de Cloud nuevo
#   · Sheets API y Drive API habilitadas en él
#   · el Client ID y el client secret anotados en deploy/.env-secret (que NO se versiona)
#
# Y ahí para: los dos valores quedan escritos, sin repartir. Quién los usa después y dónde acaba
# cada uno no es asunto de este script.
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

command -v git >/dev/null 2>&1 || die "Hace falta git para comprobar que el cuaderno no se versiona."

# Se comprueba AQUÍ, antes de tocar nada, y no en el paso que escribe. La consola enseña el
# client secret UNA sola vez: morir después de habértelo pedido te obligaría a volver a la
# consola a generar otro. Lo que puede fallar al final, se comprueba al principio.
if ! (cd "${REPO_ROOT}" && git check-ignore -q "deploy/.env-secret"); then
    die "deploy/.env-secret NO está ignorado por git. Añádelo al .gitignore antes de seguir:
  un secreto versionado hay que rotarlo, no borrarlo."
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
#
# Es donde viven la pantalla de consentimiento y el cliente, y siempre se crea uno: este script
# da de alta un cliente nuevo, no añade credenciales a un proyecto que ya tuvieras.
# ─────────────────────────────────────────────────────────────────────────────
step "2 · Proyecto de Google Cloud"

cat <<'EOF'
  El Project ID es único en TODO Google, no solo en tu cuenta, así que el que quieras puede
  estar cogido. Reglas: 6 a 30 caracteres, minúsculas, dígitos y guiones, empieza por letra y
  no acaba en guion.

EOF

# Se valida ANTES de llamar a Google: su API responde a un identificador mal formado con un error
# que no dice cuál de las reglas has roto. Y se reintenta, porque acertar con un identificador
# libre es prueba y error por definición.
while true; do
    read -r -p "  Project ID del proyecto nuevo (vacío = salir): " PROJECT_ID
    PROJECT_ID="$(trim "${PROJECT_ID}")"
    [[ -n "${PROJECT_ID}" ]] || die "Sin proyecto no hay dónde crear el cliente."

    if [[ "${#PROJECT_ID}" -lt 6 || "${#PROJECT_ID}" -gt 30 ]]; then
        warn "'${PROJECT_ID}' tiene ${#PROJECT_ID} caracteres: tienen que ser entre 6 y 30."
        continue
    fi
    if [[ ! "${PROJECT_ID}" =~ ^[a-z][a-z0-9-]*[a-z0-9]$ ]]; then
        warn "'${PROJECT_ID}' no vale: minúsculas, dígitos y guiones, empezando por letra y sin acabar en guion."
        continue
    fi

    read -r -p "  Nombre visible del proyecto: " PROJECT_NAME
    [[ -n "${PROJECT_NAME}" ]] || die "Hace falta un nombre de proyecto."

    info "Creando ${PROJECT_ID}…"
    if gcloud projects create "${PROJECT_ID}" --name="${PROJECT_NAME}"; then
        break
    fi
    warn "No se ha podido crear '${PROJECT_ID}'. Si el identificador ya está cogido, prueba otro."
done

bold "  ✓ ${PROJECT_ID}"

# ─────────────────────────────────────────────────────────────────────────────
# 3 · APIs
#
# Solo estas dos, y a propósito: son las que hacen que EXISTAN los scopes de Sheets y Drive. Lo
# que un proyecto necesite encendido para otras cosas no es asunto de este script.
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

  Ejemplo:  Migo web

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

  ⚠️  Publish app no es opcional: en "Testing", Google CADUCA LOS REFRESH TOKENS A LOS 7 DÍAS,
      así que el permiso concedido se cae solo cada semana y sin avisar. Además hay que dar de
      alta a mano el correo de cada persona que vaya a conectar (máximo 100).
      Publicar sale gratis: drive.file no exige verificación de Google.

EOF

CLIENTS_URL="https://console.cloud.google.com/auth/clients/create?project=${PROJECT_ID}"
info "Abriendo ${CLIENTS_URL}"
open_url "${CLIENTS_URL}"

# Se reintenta en vez de morir: una errata al pegar no debería costarte volver a empezar, con lo
# que cuesta llegar hasta aquí. Línea vacía para salir.
echo
while true; do
    read -r -p "  Pega aquí el Client ID (vacío = salir): " CLIENT_ID
    CLIENT_ID="$(trim "${CLIENT_ID}")"
    [[ -n "${CLIENT_ID}" ]] || die "Sin Client ID no hay nada que guardar. El proyecto y las APIs quedan hechos."
    [[ "${CLIENT_ID}" == *.apps.googleusercontent.com ]] && break
    warn "Eso no parece un Client ID: tiene que acabar en .apps.googleusercontent.com."
done

echo
info "Ahora el Client secret. La consola solo lo enseña una vez; no se verá al teclearlo."
read -r -s -p "  Client secret: " CLIENT_SECRET
echo
CLIENT_SECRET="$(trim "${CLIENT_SECRET}")"
[[ -n "${CLIENT_SECRET}" ]] ||
    die "Hace falta el client secret: sin él el cliente queda a medias y hay que generar otro."

# ─────────────────────────────────────────────────────────────────────────────
# 7 · Volcar los dos valores, y parar
#
# Van los DOS al mismo sitio aunque solo uno sea secreto: son la pareja que produce una misma
# visita a la consola, y separarlos obligaría a acordarse de cuál iba dónde. Anotarlos es el
# final del trabajo de este script; repartirlos, el principio de otro.
# ─────────────────────────────────────────────────────────────────────────────
step "7 · Guardando el resultado"

# Que el cuaderno no se versiona ya se comprobó en el arranque, antes de pedirte nada.

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

  El Client ID y el client secret están en deploy/.env-secret, en el último lote.

EOF
