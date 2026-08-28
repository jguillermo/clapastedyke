#!/usr/bin/env bash
#
# Prepara la INFRAESTRUCTURA de un ambiente: el proyecto de Firebase, el plan, las APIs, la base
# de Firestore y la cuenta de servicio con la que despliega GitHub Actions.
#
# SOLO INFRAESTRUCTURA. Este script no sabe nada de OAuth: no crea el cliente de Google, no lee
# ningún Client ID ni ningún client secret, y no enciende las APIs de Sheets ni Drive. De
# environments.json escribe UNA sola clave, el `projectId` del ambiente, que es dato de
# DESPLIEGUE; el bloque `config` —lo que la app lee— no lo toca siquiera.
# Crear el cliente es `deploy/create-google-client-id.sh` y
# repartir sus valores es `deploy/wire-environment.sh`. Lo de aquí es permiso para desplegar y
# ejecutar TU infraestructura: otra cosa, que solo coincide con OAuth en el número de proyecto.
#
# Empieza donde tú quieras: si el ambiente no existe en deploy/firebase/environments.json, LO
# DECLARA —su nombre y su projectId, creando el proyecto si hace falta—, así que montar uno desde
# cero no exige haber editado ningún fichero antes. El bloque `config` lo estrena el cableado.
#
# Lo que deja hecho:
#   1. el ambiente declarado en environments.json, con su projectId
#   2. el proyecto de Firebase (creado o con Firebase añadido)
#   3. plan Blaze (facturación enlazada)
#   4. las seis APIs de infraestructura, incluida secretmanager, que el CLI NO enciende solo
#   5. la base de Firestore creada
#   6. la cuenta de servicio de despliegue, sus diez roles y su clave, volcada en
#      deploy/.env-secret y subida al environment secret FIREBASE_SERVICE_ACCOUNT
#
# Son los cinco requisitos de manual/api.md y los pasos 1 a 4 de manual/firebase-deploy.md.
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
command -v git >/dev/null 2>&1 || die "Hace falta git para comprobar que el cuaderno no se versiona."

[[ -f "${ENVIRONMENTS}" ]] || die "No encuentro ${ENVIRONMENTS}."

# Se comprueba al arrancar y no en el paso que escribe: morir después de haber creado el
# proyecto, enlazado la facturación y generado una clave privada sería un desastre evitable.
if ! (cd "${REPO_ROOT}" && git check-ignore -q "deploy/.env-secret"); then
    die "deploy/.env-secret NO está ignorado por git. Añádelo al .gitignore antes de seguir."
fi

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

# Un ambiente es una CLAVE de environments.json y el proyecto al que apunta. Si no existe, se
# crea aquí: `projectId` es dato de DESPLIEGUE, y este es el script de despliegue. Lo que NO
# escribe es el bloque `config` —ni siquiera vacío—, porque eso es configuración de la app y la
# pone ./deploy/wire-environment.sh. Aquí no se nombra ningún valor de OAuth.
AMBIENTES="$(env_keys)"

if [[ -n "${AMBIENTES}" ]]; then
    info "Ambientes ya declarados en deploy/firebase/environments.json:"
    for CLAVE in ${AMBIENTES}; do
        printf '    %-10s → %s\n' "${CLAVE}" "$(env_project_id "${CLAVE}")"
    done
else
    info "Todavía no hay ningún ambiente declarado."
fi

read -r -p "  Ambiente a preparar (un nombre nuevo se crea): " AMBIENTE
AMBIENTE="$(lower "$(trim "${AMBIENTE}")")"
[[ -n "${AMBIENTE}" ]] || die "Hace falta un ambiente."
[[ "${AMBIENTE}" =~ ^[a-z][a-z0-9-]*$ ]] ||
    die "'${AMBIENTE}' no vale como nombre: minúsculas, dígitos y guiones, empezando por letra."

PROJECT_ID="$(env_project_id "${AMBIENTE}")"
case "${PROJECT_ID}" in
    TU-PROJECT-ID*)
        warn "El ambiente '${AMBIENTE}' tiene el marcador '${PROJECT_ID}'. Se le pondrá el real."
        PROJECT_ID=""
        ;;
esac

# ─────────────────────────────────────────────────────────────────────────────
# 3 · El proyecto de Firebase
#
# Con la CLI de Firebase, no con gcloud: `projects:create` crea el proyecto de Cloud Y le añade
# Firebase en un solo paso, que es justo lo que hace falta aquí. Con `gcloud projects create` el
# proyecto nace sin Firebase, no hay Hosting, y `firebase deploy` muere con «Failed to get
# Firebase project» sin decir que le falta ese paso.
# ─────────────────────────────────────────────────────────────────────────────
step "3 · Proyecto de Firebase"

info "Consultando (la primera llamada a firebase-tools tarda)…"
if ! ${FIREBASE_CLI} login:list 2>/dev/null | grep -q '@'; then
    info "No hay sesión de firebase-tools. Se abrirá el navegador…"
    ${FIREBASE_CLI} login
fi

es_proyecto_firebase() {
    ${FIREBASE_CLI} projects:list --json 2>/dev/null |
        node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{try{const r=JSON.parse(s).result||[];process.exit(r.some(p=>p.projectId===process.argv[1])?0:1)}catch{process.exit(1)}})' "$1"
}

if [[ -z "${PROJECT_ID}" ]]; then
    info "Proyectos de Firebase de esta cuenta:"
    ${FIREBASE_CLI} projects:list 2>/dev/null | sed 's/^/    /' || true

    read -r -p "  Project ID para '${AMBIENTE}' (vacío = crear uno nuevo): " PROJECT_ID
    PROJECT_ID="$(trim "${PROJECT_ID}")"

    if [[ -z "${PROJECT_ID}" ]]; then
        read -r -p "  Project ID del proyecto NUEVO: " PROJECT_ID
        PROJECT_ID="$(trim "${PROJECT_ID}")"
        # Las reglas son de Google, y saltárselas da un error del API que no dice cuál falló.
        [[ "${#PROJECT_ID}" -ge 6 && "${#PROJECT_ID}" -le 30 ]] ||
            die "Un Project ID de Google tiene entre 6 y 30 caracteres; '${PROJECT_ID}' tiene ${#PROJECT_ID}."
        [[ "${PROJECT_ID}" =~ ^[a-z][a-z0-9-]*[a-z0-9]$ ]] ||
            die "Un Project ID lleva minúsculas, dígitos y guiones, empieza por letra y no acaba en guion."
        read -r -p "  Nombre visible del proyecto: " PROJECT_NAME
        [[ -n "${PROJECT_NAME}" ]] || die "Hace falta un nombre de proyecto."
        info "Creando ${PROJECT_ID} con Firebase incluido…"
        ${FIREBASE_CLI} projects:create "${PROJECT_ID}" --display-name "${PROJECT_NAME}"
    fi
fi

if es_proyecto_firebase "${PROJECT_ID}"; then
    info "'${PROJECT_ID}' ya es un proyecto de Firebase."
else
    # No se sabe si existe en Cloud sin Firebase o si no existe: `projects:list` solo enseña los
    # que YA tienen Firebase. Lo dirá `addfirebase`, que es quien puede distinguirlo.
    info "'${PROJECT_ID}' no aparece como proyecto de Firebase: intentando añadírselo…"
    ${FIREBASE_CLI} projects:addfirebase "${PROJECT_ID}" ||
        die "No se ha podido añadir Firebase a '${PROJECT_ID}'.
  Si el proyecto no existe, déjalo vacío en el paso anterior para crearlo, o créalo tú.
  Si existe y es de otra cuenta, entra con la que lo administra."
fi

# El bloque del ambiente: SOLO el projectId. Sin `config` — ese lo crea wire-environment.sh.
if [[ "$(env_project_id "${AMBIENTE}")" != "${PROJECT_ID}" ]]; then
    node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const [file, ambiente, projectId] = process.argv.slice(1);
const doc = JSON.parse(readFileSync(file, "utf8"));
doc[ambiente] = { ...doc[ambiente], projectId };
writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
' "${ENVIRONMENTS}" "${AMBIENTE}" "${PROJECT_ID}"
    info "deploy/firebase/environments.json → ${AMBIENTE}.projectId"
fi

bold "  ✓ ${AMBIENTE} → ${PROJECT_ID}"

# ─────────────────────────────────────────────────────────────────────────────
# 4 · Plan Blaze (facturación)
#
# Cloud Functions lo exige. A este volumen el coste es prácticamente cero, pero hace falta una
# cuenta de facturación enlazada.
#
# AQUÍ NO HAY ALTERNATIVA EN FIREBASE. La CLI de Firebase no tiene ningún comando de facturación
# —ni de APIs, ni de IAM—, así que los pasos 4, 5 y 7 usan gcloud por necesidad, no por descuido.
# Son operaciones de Google Cloud que la consola de Firebase hace por dentro sin exponerlas.
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
# Con la CLI de Firebase. Habilitar la API del paso anterior NO crea la base: sin ella, desplegar
# las reglas da «NOT_FOUND … database (default)», que parece un problema de permisos y no lo es.
# ─────────────────────────────────────────────────────────────────────────────
step "6 · Base de datos de Firestore"

if ${FIREBASE_CLI} firestore:databases:list --project "${PROJECT_ID}" 2>/dev/null | grep -q 'projects/'; then
    info "Ya hay una base de datos."
else
    info "Ubicaciones posibles:"
    ${FIREBASE_CLI} firestore:locations --project "${PROJECT_ID}" 2>/dev/null | sed 's/^/    /' || true
    read -r -p "  Ubicación de la base [eur3]: " FIRESTORE_LOCATION
    FIRESTORE_LOCATION="$(trim "${FIRESTORE_LOCATION}")"
    [[ -n "${FIRESTORE_LOCATION}" ]] || FIRESTORE_LOCATION="eur3"
    warn "La ubicación NO se puede cambiar después."
    ${FIREBASE_CLI} firestore:databases:create '(default)' \
        --location "${FIRESTORE_LOCATION}" \
        --project "${PROJECT_ID}"
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

    # Que el cuaderno no se versiona ya se comprobó al arrancar.

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

if [[ -z "${KEY_FILE}" ]]; then
    # Sin clave nueva no se pasó por el paso 8, así que aquí no se ha dicho NADA del secret. Sin
    # este aviso, un ambiente recién montado se quedaría sin credenciales y solo se sabría al
    # ver fallar el despliegue con un error de autenticación.
    cat <<EOF
  No se generó clave nueva: el environment '${AMBIENTE}' tiene que tener ya un
  FIREBASE_SERVICE_ACCOUNT válido para esta cuenta de servicio, o el despliegue fallará al
  autenticarse. Si no lo tiene, relanza este script y acepta generar la clave.

EOF
elif [[ "${GH_HECHO}" == "no" ]]; then
    cat <<EOF
  Falta subir la clave a GitHub:
    Settings → Environments → ${AMBIENTE} → Add environment secret
    Nombre: FIREBASE_SERVICE_ACCOUNT
    Valor:  el contenido íntegro de ${KEY_FILE}
            (o el último lote de deploy/.env-secret)

  En 'prod', además: Required reviewers y Deployment branches → main.

EOF
fi

# Delimitador ENTRECOMILLADO a propósito: este bloque no interpola nada y lleva acentos graves,
# que en un heredoc sin comillas Bash trataría como sustitución de comandos.
cat <<'EOF'
  ⚠️  Las APIs y los roles tardan un par de minutos en propagarse. Si lanzas el despliegue al
      instante, puede dar un 403 que ya no es real.

  Este ambiente todavía no tiene bloque `config`: lo escribe el cableado, junto con el cliente
  de Google (Client ID en environments.json, secreto en el emulador y en GitHub):

    ./deploy/wire-environment.sh

  Y el orden al desplegar es BACKEND PRIMERO y frontend después: la app llama a /api/auth/token
  desde su arranque.

EOF
