#!/usr/bin/env bash
#
# Prepara la INFRAESTRUCTURA de un ambiente: el proyecto de Firebase, el plan, las APIs, la base
# de Firestore y la cuenta de servicio con la que despliega GitHub Actions.
#
# SOLO INFRAESTRUCTURA. Este script no sabe nada de OAuth: no crea el cliente de Google, no lee
# ningún Client ID, no toca environments.json y no enciende las APIs de Sheets ni Drive. Crear el
# cliente es `deploy/create-google-client-id.sh` y repartir sus valores es
# `deploy/wire-environment.sh`. Lo de aquí es permiso para desplegar y ejecutar TU
# infraestructura: otra cosa, que solo coincide con OAuth en el número de proyecto.
#
# Cubre los cinco requisitos de manual/api.md y los pasos 1, 3 y 4 de manual/firebase-deploy.md:
#   1. Firebase añadido al proyecto de Cloud (sin esto no hay Hosting)
#   2. plan Blaze (facturación enlazada)
#   3. las seis APIs de infraestructura, incluida secretmanager, que el CLI NO enciende solo
#   4. la base de Firestore creada
#   5. la cuenta de servicio de despliegue, sus diez roles y su clave, volcada en
#      deploy/.env-secret y subida al environment secret FIREBASE_SERVICE_ACCOUNT
#
# Es IDEMPOTENTE: comprueba antes de actuar y trata "ya existe" como éxito, así que se puede
# relanzar sobre un ambiente a medias sin romper nada.
#
# Uso:  ./deploy/setup-firebase-project.sh [-h]
#
# Documentación: manual/api.md · manual/firebase-deploy.md

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
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

# Se resuelve UNA vez: los dos pasos que suben secretos lo consultan. `gh` resuelve el
# repositorio por el directorio actual, así que se comprueba desde dentro del repo.
GH_DISPONIBLE="no"
if command -v gh >/dev/null 2>&1 && (cd "${REPO_ROOT}" && gh auth status >/dev/null 2>&1); then
    GH_DISPONIBLE="si"
fi
GH_HECHO="no"

FIREBASE_CLI="npx --yes firebase-tools@latest"
SA_ID="clapastedyke-deploy"

# Los diez. El primero es el del frontend; los nueve siguientes, los del backend. Se conceden de
# golpe porque cada uno que falte es otro despliegue fallido de veinte minutos (manual/api.md).
ROLES="roles/firebasehosting.admin
roles/serviceusage.serviceUsageAdmin
roles/cloudfunctions.admin
roles/run.admin
roles/cloudbuild.builds.editor
roles/artifactregistry.admin
roles/iam.serviceAccountUser
roles/secretmanager.admin
roles/firebaserules.admin
roles/firebase.developAdmin"

APIS="secretmanager.googleapis.com
cloudfunctions.googleapis.com
run.googleapis.com
cloudbuild.googleapis.com
artifactregistry.googleapis.com
firestore.googleapis.com"

command -v gcloud >/dev/null 2>&1 || die "Hace falta la CLI de Google Cloud (gcloud). Instálala con:

    brew install --cask google-cloud-sdk

  o desde https://cloud.google.com/sdk/docs/install , y vuelve a lanzar el script."

command -v node >/dev/null 2>&1 || die "Hace falta Node para leer deploy/firebase/environments.json."
command -v npx >/dev/null 2>&1 || die "Hace falta npx para usar firebase-tools."

[[ -f "${ENVIRONMENTS}" ]] || die "No encuentro ${ENVIRONMENTS}."

env_keys() {
    node -e 'process.stdout.write(Object.keys(require(process.argv[1])).join(" "))' "${ENVIRONMENTS}"
}

env_project_id() {
    node -e 'const e=require(process.argv[1])[process.argv[2]];process.stdout.write(e&&e.projectId?e.projectId:"")' \
        "${ENVIRONMENTS}" "$1"
}

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
# 2 · Ambiente
# ─────────────────────────────────────────────────────────────────────────────
step "2 · Ambiente"

AMBIENTES="$(env_keys)"
info "Ambientes en deploy/firebase/environments.json:"
for CLAVE in ${AMBIENTES}; do
    printf '    %-10s → %s\n' "${CLAVE}" "$(env_project_id "${CLAVE}")"
done

read -r -p "  Ambiente a preparar: " AMBIENTE
AMBIENTE="$(lower "$(trim "${AMBIENTE}")")"
[[ -n "${AMBIENTE}" ]] || die "Hace falta un ambiente."

PROJECT_ID="$(env_project_id "${AMBIENTE}")"
[[ -n "${PROJECT_ID}" ]] ||
    die "El ambiente '${AMBIENTE}' no está en deploy/firebase/environments.json. Los que hay: ${AMBIENTES}."

case "${PROJECT_ID}" in
    TU-PROJECT-ID*)
        die "El ambiente '${AMBIENTE}' todavía tiene el marcador '${PROJECT_ID}'.
  Escribe su projectId real en deploy/firebase/environments.json (manual/firebase-deploy.md, paso 2)."
        ;;
esac

gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1 ||
    die "El proyecto '${PROJECT_ID}' no existe o esta cuenta no lo ve."

bold "  ✓ ${AMBIENTE} → ${PROJECT_ID}"

# ─────────────────────────────────────────────────────────────────────────────
# 3 · Firebase en el proyecto
#
# `gcloud projects create` deja un proyecto DE CLOUD, no de Firebase. Sin este paso no hay
# Hosting y `firebase deploy` muere con «Failed to get Firebase project».
# ─────────────────────────────────────────────────────────────────────────────
step "3 · Firebase en el proyecto"

info "Consultando (la primera llamada a firebase-tools tarda)…"
if ! ${FIREBASE_CLI} login:list 2>/dev/null | grep -q '@'; then
    info "No hay sesión de firebase-tools. Se abrirá el navegador…"
    ${FIREBASE_CLI} login
fi

YA_ES_FIREBASE="no"
if ${FIREBASE_CLI} projects:list --json 2>/dev/null |
    node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{try{const r=JSON.parse(s).result||[];process.exit(r.some(p=>p.projectId===process.argv[1])?0:1)}catch{process.exit(1)}})' "${PROJECT_ID}"; then
    YA_ES_FIREBASE="si"
fi

if [[ "${YA_ES_FIREBASE}" == "si" ]]; then
    info "Ya era un proyecto de Firebase."
else
    ${FIREBASE_CLI} projects:addfirebase "${PROJECT_ID}"
fi

bold "  ✓ Firebase activo en ${PROJECT_ID}"

# ─────────────────────────────────────────────────────────────────────────────
# 4 · Plan Blaze (facturación)
#
# Cloud Functions lo exige. A este volumen el coste es prácticamente cero, pero hace falta una
# cuenta de facturación enlazada.
# ─────────────────────────────────────────────────────────────────────────────
step "4 · Plan Blaze"

BILLING="$(gcloud billing projects describe "${PROJECT_ID}" --format='value(billingEnabled)' 2>/dev/null || true)"

if [[ "$(lower "${BILLING}")" == "true" ]]; then
    info "La facturación ya está enlazada."
else
    warn "Este proyecto está en Spark: sin facturación, Cloud Functions no despliega."
    info "Cuentas de facturación de esta cuenta:"
    gcloud billing accounts list --format='table(name, displayName, open)' 2>/dev/null | sed 's/^/    /' || true
    info "Enlazar una cuenta hace que este proyecto pueda GENERAR COSTE real."
    read -r -p "  ID de la cuenta a enlazar (vacío = saltar): " BILLING_ACCOUNT
    BILLING_ACCOUNT="$(trim "${BILLING_ACCOUNT}")"
    if [[ -n "${BILLING_ACCOUNT}" ]]; then
        gcloud billing projects link "${PROJECT_ID}" --billing-account="${BILLING_ACCOUNT}"
    else
        warn "Saltado. Hasta que lo enlaces, el despliegue del backend fallará con «Blaze plan»."
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# 5 · Las APIs de infraestructura
#
# `firebase deploy` enciende sobre la marcha las que sabe que va a necesitar, pero SECRET
# MANAGER NO ESTÁ EN ESA LISTA: para resolver GOOGLE_OAUTH_CLIENT_SECRET llama directo a la API
# sin habilitarla, y en un proyecto nuevo el despliegue muere con un 403 que NO es de permisos.
# ─────────────────────────────────────────────────────────────────────────────
step "5 · Habilitando las APIs de infraestructura"

# shellcheck disable=SC2086
gcloud services enable ${APIS} --project "${PROJECT_ID}"
bold "  ✓ secretmanager · cloudfunctions · run · cloudbuild · artifactregistry · firestore"

# ─────────────────────────────────────────────────────────────────────────────
# 6 · Base de datos de Firestore
#
# Habilitar la API no crea la base. Sin base, desplegar las reglas da
# «NOT_FOUND … database (default)».
# ─────────────────────────────────────────────────────────────────────────────
step "6 · Base de datos de Firestore"

if [[ -n "$(gcloud firestore databases list --project "${PROJECT_ID}" --format='value(name)' 2>/dev/null || true)" ]]; then
    info "Ya hay una base de datos."
else
    read -r -p "  Ubicación de la base [eur3]: " FIRESTORE_LOCATION
    FIRESTORE_LOCATION="$(trim "${FIRESTORE_LOCATION}")"
    [[ -n "${FIRESTORE_LOCATION}" ]] || FIRESTORE_LOCATION="eur3"
    info "La ubicación NO se puede cambiar después."
    gcloud firestore databases create --location="${FIRESTORE_LOCATION}" --project "${PROJECT_ID}"
fi

bold "  ✓ Firestore"

# ─────────────────────────────────────────────────────────────────────────────
# 7 · La cuenta de servicio del despliegue
#
# NO vale la clave que ofrece Firebase Console: devuelve la cuenta `firebase-adminsdk-…`, que
# viene con `firebase.sdkAdminServiceAgent` — sirve para USAR el Admin SDK en ejecución, no para
# DESPLEGAR. Recién creada no puede ni consultar si la API de Firestore está encendida.
# ─────────────────────────────────────────────────────────────────────────────
step "7 · Cuenta de servicio del despliegue"

SA_EMAIL="${SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "${SA_EMAIL}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
    info "La cuenta ${SA_EMAIL} ya existía."
else
    gcloud iam service-accounts create "${SA_ID}" \
        --project "${PROJECT_ID}" \
        --display-name="Despliegue de clapastedyke (CI)"
fi

info "Concediendo los diez roles (los repetidos no molestan)…"
for ROLE in ${ROLES}; do
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="${ROLE}" \
        --condition=None >/dev/null
    printf '    ✓ %s\n' "${ROLE}"
done

# Fuera del árbol del repositorio, siempre: es una credencial con permiso para publicar.
KEY_DIR="${HOME}/.config/clapastedyke"
KEY_FILE="${KEY_DIR}/${PROJECT_ID}-deploy.json"
mkdir -p "${KEY_DIR}"

read -r -p "  ¿Generar una clave nueva para esta cuenta? [S/n] " MAKE_KEY
case "$(lower "${MAKE_KEY}")" in
    n | no)
        KEY_FILE=""
        info "Sin clave nueva: se conserva la que ya tuvieras."
        ;;
    *)
        gcloud iam service-accounts keys create "${KEY_FILE}" \
            --iam-account "${SA_EMAIL}" \
            --project "${PROJECT_ID}"
        chmod 600 "${KEY_FILE}"
        bold "  ✓ ${KEY_FILE}"
        warn "Ese fichero abre tu proyecto. No lo commitees ni lo pegues en un chat."
        ;;
esac

# ─────────────────────────────────────────────────────────────────────────────
# 8 · El secret del despliegue
# ─────────────────────────────────────────────────────────────────────────────
if [[ -n "${KEY_FILE}" ]]; then
    step "8 · El secret de GitHub"

    if ! (cd "${REPO_ROOT}" && git check-ignore -q "deploy/.env-secret"); then
        die "deploy/.env-secret NO está ignorado por git. Añádelo al .gitignore antes de seguir."
    fi

    # El cuaderno: se AÑADE, nunca se reescribe. El JSON va en una sola línea; sus saltos ya
    # están escapados dentro de la cadena `private_key`, así que sobrevive intacto.
    {
        printf '\n# ─── %s · ambiente %s · proyecto %s · %s\n' \
            "$(date '+%Y-%m-%d %H:%M')" "${AMBIENTE}" "${PROJECT_ID}" "${SCRIPT_NAME}"
        printf 'FIREBASE_SERVICE_ACCOUNT=%s\n' \
            "$(node -e 'const fs=require("node:fs");process.stdout.write(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1],"utf8"))))' "${KEY_FILE}")"
    } >>"${ENV_SECRET}"

    info "deploy/.env-secret ← lote nuevo (FIREBASE_SERVICE_ACCOUNT)"

    if [[ "${GH_DISPONIBLE}" == "si" ]]; then
        read -r -p "  ¿Subirlo al environment '${AMBIENTE}' de GitHub? [S/n] " USE_GH
        case "$(lower "${USE_GH}")" in
            n | no) ;;
            *)
                (cd "${REPO_ROOT}" &&
                    gh api -X PUT "repos/{owner}/{repo}/environments/${AMBIENTE}" >/dev/null 2>&1) || true
                if (cd "${REPO_ROOT}" &&
                    gh secret set FIREBASE_SERVICE_ACCOUNT --env "${AMBIENTE}" <"${KEY_FILE}" 2>/dev/null); then
                    info "GitHub → environment '${AMBIENTE}' → FIREBASE_SERVICE_ACCOUNT"
                    GH_HECHO="si"
                else
                    warn "No se ha podido subir con gh. Hazlo a mano (abajo)."
                fi
                ;;
        esac
    fi

    if [[ "${GH_HECHO}" == "si" ]]; then
        read -r -p "  ¿Borrar la clave local ahora que está en GitHub? [S/n] " DROP_KEY
        case "$(lower "${DROP_KEY}")" in
            n | no) ;;
            *)
                rm -f "${KEY_FILE}"
                info "Clave local borrada. Sigue en deploy/.env-secret y en GitHub."
                ;;
        esac
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
step "Listo"

cat <<EOF

  Cuenta:      ${ACCOUNT}
  Ambiente:    ${AMBIENTE}
  Proyecto:    ${PROJECT_ID}
  Despliega:   ${SA_EMAIL}

EOF

if [[ "${GH_HECHO}" == "no" && -n "${KEY_FILE}" ]]; then
    cat <<EOF
  Falta subir la clave a GitHub:
    Settings → Environments → ${AMBIENTE} → Add environment secret
    Nombre: FIREBASE_SERVICE_ACCOUNT
    Valor:  el contenido íntegro de ${KEY_FILE}
            (o el último lote de deploy/.env-secret)

  En 'prod', además: Required reviewers y Deployment branches → main.

EOF
fi

cat <<EOF
  ⚠️  Las APIs y los roles tardan un par de minutos en propagarse. Si lanzas el despliegue al
      instante, puede dar un 403 que ya no es real.

  Falta CABLEAR este ambiente con su cliente de Google (el Client ID en environments.json, el
  secreto en el emulador y en GitHub):

    ./deploy/wire-environment.sh

  Y el orden al desplegar es BACKEND PRIMERO y frontend después: la app llama a /api/auth/token
  desde su arranque.

EOF
