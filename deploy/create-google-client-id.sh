#!/usr/bin/env bash
#
# Crea un cliente OAuth con permiso para Drive, Sheets y la identidad del usuario, dentro de un
# proyecto de Google Cloud —uno que ya tengas, o uno nuevo que crea él.
#
# Esa es TODA su responsabilidad. Lo que concede aquí es el permiso que da EL USUARIO sobre SU
# cuenta —openid, email, profile y drive.file—, y para que esos permisos existan al proyecto solo
# le hacen falta dos APIs: Sheets y Drive.
#
# UN PROYECTO ADMITE VARIOS CLIENTES. La pantalla de consentimiento —el nombre que ve el usuario,
# los scopes y el estado de publicación— es UNA por proyecto y la comparten todos sus clientes.
# Por eso reutilizar un proyecto ya configurado ahorra volver a publicarla, que es la parte cara;
# y por eso cada cliente solo aporta su par ID/secret y su lista de orígenes.
#
# Qué deja hecho:
#   · la cuenta y el proyecto de Cloud (creado o reutilizado)
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

# Las pantallas de la consola se nombran en cada paso, para poder mirar —o deshacer— a mano lo
# que el script va dejando. `cloud-resource-manager` es la única desde la que se BORRA un
# proyecto: la lista normal no ofrece esa acción.
PROJECTS_URL="https://console.cloud.google.com/cloud-resource-manager"

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
# UN PROYECTO ADMITE MUCHOS CLIENTES, y esa es la razón de poder reutilizar uno: la pantalla de
# consentimiento es UNA por proyecto y la comparten todos sus clientes, así que configurarla y
# publicarla —que es la parte cara— se hace una sola vez. Cada cliente solo aporta su par
# ID/secret y su lista de orígenes.
# ─────────────────────────────────────────────────────────────────────────────
step "2 · Proyecto de Google Cloud"

cat <<'EOF'
  Un proyecto puede tener VARIOS clientes. Lo que comparten es la pantalla de consentimiento:
  el nombre que ve el usuario, los scopes y el estado de publicación son del proyecto, no del
  cliente. Por eso reutilizar un proyecto ya configurado te ahorra volver a publicarla.

EOF

info "Proyectos de esta cuenta:"
gcloud projects list --format='table(projectId, name)' 2>/dev/null | sed 's/^/    /' || true

printf '\n'
info "Verlos y BORRARLOS en la consola:"
info "    ${PROJECTS_URL}"
printf '\n'

read -r -p "  Project ID a usar (vacío = crear uno nuevo): " PROJECT_ID
PROJECT_ID="$(trim "${PROJECT_ID}")"

if [[ -n "${PROJECT_ID}" ]]; then
    PROYECTO_NUEVO="no"
    gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1 ||
        die "El proyecto '${PROJECT_ID}' no existe o esta cuenta no lo ve."
else
    PROYECTO_NUEVO="si"
    cat <<'EOF'

  El Project ID es único en TODO Google, no solo en tu cuenta, así que el que quieras puede
  estar cogido. Reglas: 6 a 30 caracteres, minúsculas, dígitos y guiones, empieza por letra y
  no acaba en guion.

EOF
    # Se valida ANTES de llamar a Google: su API responde a un identificador mal formado con un
    # error que no dice cuál de las reglas has roto. Y se reintenta, porque acertar con uno libre
    # es prueba y error por definición.
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
fi

bold "  ✓ ${PROJECT_ID}"

# Ya se sabe el proyecto, así que las pantallas que dependen de él quedan resueltas aquí y se
# nombran en los pasos siguientes.
CONSENT_URL="https://console.cloud.google.com/auth/overview?project=${PROJECT_ID}"
CLIENTS_LIST_URL="https://console.cloud.google.com/auth/clients?project=${PROJECT_ID}"
CLIENTS_URL="https://console.cloud.google.com/auth/clients/create?project=${PROJECT_ID}"

info "Clientes de este proyecto (verlos y borrarlos):"
info "    ${CLIENTS_LIST_URL}"

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

info "Los que ya tiene el proyecto: ${CLIENTS_LIST_URL}"
printf '\n'

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
# 6 · La pantalla de consentimiento (primer paso manual)
#
# VA ANTES QUE EL CLIENTE, y no es un detalle de orden: Google se niega a crear un OAuth client
# mientras el proyecto no tenga pantalla de consentimiento —«To create an OAuth client ID, you
# must first configure your consent screen»—. En un proyecto recién creado no la hay nunca, así
# que abrir directamente la pantalla de crear el cliente sería mandarte a un muro.
# ─────────────────────────────────────────────────────────────────────────────
step "6 · La pantalla de consentimiento"

# Un proyecto recién creado nunca la tiene. Uno reutilizado casi siempre sí — y entonces este
# paso sobra: la pantalla es del proyecto, no del cliente, así que el cliente nuevo hereda su
# nombre, sus scopes y su estado de publicación sin tocar nada.
CONSENT_PENDIENTE="si"
if [[ "${PROYECTO_NUEVO}" == "no" ]]; then
    read -r -p "  ¿'${PROJECT_ID}' ya tiene pantalla de consentimiento? [S/n] " YA_HAY_CONSENT
    case "$(lower "${YA_HAY_CONSENT}")" in
        n | no) ;;
        *) CONSENT_PENDIENTE="no" ;;
    esac
fi

if [[ "${CONSENT_PENDIENTE}" == "no" ]]; then
    info "Se salta: el cliente nuevo hereda la del proyecto (nombre, scopes y publicación)."
    info "Si le faltara algún scope, se añade en Data Access y vale para todos sus clientes."
else

cat <<'EOF'

  Es lo que el usuario lee cuando le pides permiso, y el proyecto no la tiene todavía.
  Sin ella Google NO deja crear el cliente.

  En la consola que se abre ahora (Google Auth Platform → Get started):

    App name              el nombre que verá quien dé el permiso
    User support email    tu correo
    Audience              External
    Contact information   tu correo

    NO subas App logo: obliga a pasar la verificación de Google.

  Y después, en el menú de la izquierda:

    Data Access → Add or remove scopes → los 4, y solo esos:
                    openid
                    https://www.googleapis.com/auth/userinfo.email
                    https://www.googleapis.com/auth/userinfo.profile
                    https://www.googleapis.com/auth/drive.file

    Audience    → Publish app

  ⚠️  Publish app no es opcional: en "Testing", Google CADUCA LOS REFRESH TOKENS A LOS 7 DÍAS,
      así que el permiso concedido se cae solo cada semana y sin avisar. Además hay que dar de
      alta a mano el correo de cada persona que vaya a conectar (máximo 100).
      Publicar sale gratis: drive.file no exige verificación de Google.

  Si la página que se abre no es ese formulario, es el mismo al que lleva el botón
  "Configure consent screen", y también está en el menú izquierdo bajo Branding.

EOF

info "Abriendo ${CONSENT_URL}"
open_url "${CONSENT_URL}"

echo
read -r -p "  Cuando la pantalla de consentimiento esté creada, pulsa Enter… " _

fi

# ─────────────────────────────────────────────────────────────────────────────
# 7 · Crear el cliente en la consola
# ─────────────────────────────────────────────────────────────────────────────
step "7 · Crear el cliente"

cat <<EOF

  Google no permite crear este cliente por CLI. En la pantalla que se abre ahora:

    Application type:  Web application
    Name:              ${CLIENT_NAME}
    Authorized JavaScript origins:  los ${ORIGIN_COUNT} de arriba
    Authorized redirect URIs:       ninguno
                                    (el flujo popup canjea contra el 'postmessage'
                                     reservado, que no se da de alta aquí)

  Al guardar, Google enseña el Client ID y el client secret. El secret solo se ve UNA vez.

EOF

info "Abriendo ${CLIENTS_URL}"
info "La lista completa está en ${CLIENTS_LIST_URL}"
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

# Es el dato MÁS caro del flujo: Google no lo vuelve a enseñar. Por eso se reintenta en vez de
# morir, y por eso la salida es una palabra explícita y no una línea vacía — un Enter de más no
# puede costarte tener que regenerar el cliente.
#
# Y no se guarda un lote a medias: `wire-environment.sh` lee la última aparición de cada clave por
# separado, así que un lote con Client ID pero sin secret emparejaría ese ID nuevo con el secret
# viejo de otro cliente, y el fallo aparecería mucho después y sin relación visible.
echo
info "Ahora el Client secret. La consola solo lo enseña una vez; no se verá al teclearlo."
while true; do
    read -r -s -p "  Client secret (o 'salir' para abortar): " CLIENT_SECRET
    echo
    CLIENT_SECRET="$(trim "${CLIENT_SECRET}")"

    if [[ "${CLIENT_SECRET}" == "salir" ]]; then
        die "Cancelado: no se ha guardado nada.
  El cliente ya existe en la consola; su secret se regenera desde ahí cuando lo necesites."
    fi
    [[ -n "${CLIENT_SECRET}" ]] && break
    warn "Vacío. Cópialo de la consola, o escribe 'salir'."
done

# ─────────────────────────────────────────────────────────────────────────────
# 8 · Volcar los dos valores, y parar
#
# Van los DOS al mismo sitio aunque solo uno sea secreto: son la pareja que produce una misma
# visita a la consola, y separarlos obligaría a acordarse de cuál iba dónde. Anotarlos es el
# final del trabajo de este script; repartirlos, el principio de otro.
# ─────────────────────────────────────────────────────────────────────────────
step "8 · Guardando el resultado"

# Que el cuaderno no se versiona ya se comprobó en el arranque, antes de pedirte nada.

# `>>` crearía el fichero con el umask por defecto, que en macOS deja 644: un secreto legible por
# cualquier usuario de la máquina. Se crea vacío y se cierra ANTES de escribir nada dentro.
[[ -f "${ENV_SECRET}" ]] || : >"${ENV_SECRET}"
chmod 600 "${ENV_SECRET}"

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

  Para revisar o deshacer a mano:
    Proyectos (y borrarlos)   ${PROJECTS_URL}
    Clientes del proyecto     ${CLIENTS_LIST_URL}
    Consentimiento            ${CONSENT_URL}

EOF
