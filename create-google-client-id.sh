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
#   · el fichero del cliente de Google, en pantalla, listo para pegar
#
# Y ahí para. **No escribe nada, en ningún sitio**: el Client ID y el client secret no se guardan en
# el repositorio ni en un fichero suelto, se pegan una vez en el secret `GOOGLE_OAUTH_CLIENT` del
# *environment* de GitHub del ambiente. Ese es su único domicilio.
#
# El ÚNICO paso manual es la consola: Google no tiene API ni comando para crear un OAuth client
# de tipo "Web application" con Authorized JavaScript origins (`gcloud alpha iap oauth-clients`
# solo crea clientes de IAP, sin orígenes JS, que no sirven para el flujo popup de Google
# Identity Services). El script te deja esa pantalla abierta y los datos listos para pegar.
#
# Uso:  ./deploy/create-google-client-id.sh [-h]
#
# Documentación: deploy/README.md

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
    # No basta con que `describe` responda: también responde OK para un proyecto BORRADO. Google
    # los deja 30 días en DELETE_REQUESTED antes de destruirlos, y en ese estado no admiten ni
    # habilitar una API. Sin mirar el estado, el script lo daba por bueno y moría tres pasos
    # después con un "not found or permission denied" que contradecía lo que acababa de aceptar.
    ESTADO="$(gcloud projects describe "${PROJECT_ID}" --format='value(lifecycleState)' 2>/dev/null || true)"
    [[ "${ESTADO}" == "ACTIVE" ]] ||
        die "El proyecto '${PROJECT_ID}' no está utilizable (estado: ${ESTADO:-no existe o esta cuenta no lo ve}).

  Si lo borraste, sigue 30 días en DELETE_REQUESTED y no admite cambios. Puedes restaurarlo, o
  usar otro, desde:
    ${PROJECTS_URL}"
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
BRANDING_URL="https://console.cloud.google.com/auth/branding?project=${PROJECT_ID}"
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
# 5 · La pantalla de consentimiento (primer paso manual)
#
# VA ANTES QUE EL CLIENTE, y no es un detalle de orden: Google se niega a crear un OAuth client
# mientras el proyecto no tenga pantalla de consentimiento —«To create an OAuth client ID, you
# must first configure your consent screen»—. En un proyecto recién creado no la hay nunca, así
# que abrir directamente la pantalla de crear el cliente sería mandarte a un muro.
# ─────────────────────────────────────────────────────────────────────────────
step "5 · La pantalla de consentimiento"

# Lo que se puede verificar, se verifica; lo que no, se pregunta — y con la forma de averiguarlo.
#
# SE VERIFICA: si el proyecto lo acaba de crear este script, no tiene pantalla de consentimiento.
# Ahí no hay nada que preguntar y preguntarlo sería absurdo.
#
# NO SE PUEDE VERIFICAR en un proyecto que ya existía. La única API que lo expone es la de IAP
# (`projects.brands`), y probada contra un proyecto de cuenta personal contesta:
#     { "code": 400, "message": "Project must belong to an organization." }
# Solo sirve para proyectos de Workspace. No hay otra que lo diga.
#
# Por eso el defecto es NO: enseñar las instrucciones a quien ya la tiene cuesta unas líneas;
# ocultárselas a quien no la tiene lo manda a una pantalla donde no se puede hacer nada.
if [[ "${PROYECTO_NUEVO}" == "si" ]]; then
    CONSENT_PENDIENTE="si"
    info "El proyecto acaba de crearse, así que todavía no la tiene. Instrucciones abajo."
else
    info "Para saberlo, abre esta y mira si sale el aviso amarillo:"
    info "    ${CLIENTS_URL}"
    info "        con aviso  →  falta, contesta n"
    info "        sin aviso  →  ya está, contesta s"
    echo
    read -r -p "  ¿'${PROJECT_ID}' ya tiene pantalla de consentimiento? [s/N] " YA_HAY_CONSENT
    case "$(lower "$(trim "${YA_HAY_CONSENT}")")" in
        s | si | sí | y | yes) CONSENT_PENDIENTE="no" ;;
        *) CONSENT_PENDIENTE="si" ;;
    esac
fi

if [[ "${CONSENT_PENDIENTE}" == "no" ]]; then
    info "Se salta: el cliente nuevo hereda la del proyecto (nombre, scopes y publicación)."
    info "Si le faltara algún scope, se añade en Data Access y vale para todos sus clientes."
else

cat <<'EOF'

  Es el diálogo que verá quien conecte su cuenta: "Migo quiere acceder a tu cuenta", con el
  nombre de la app, tu correo de soporte y la casilla de Drive.

  LA PANTALLA ES DE GOOGLE: la pinta él y tú no la ves nunca. Lo que rellenas son sus huecos,
  porque Google no sabe cómo se llama tu app, a quién escribir si algo va mal, ni qué le vas a
  pedir al usuario. No estás creando una pantalla: estás registrando una identidad.

  Y sin ella Google no deja crear el cliente, porque el cliente es QUIEN pregunta y esto es lo
  que el usuario LEE cuando pregunta. Va una por proyecto, y la comparten todos sus clientes.

  ESTO NO SE PUEDE AUTOMATIZAR: la única API que lo haría (IAP) solo atiende a proyectos de
  una organización de Workspace, y contesta "Project must belong to an organization" a los de
  una cuenta personal. Así que son estos cinco pasos a mano, una sola vez por proyecto:

    1. La página que se abre dice "Google Auth Platform not configured yet".
       Pulsa GET STARTED  (el formulario no sale solo).
    2. App Information   → App name: el nombre que verá quien dé el permiso
                           User support email: tu correo
    3. Audience          → External   (es la única opción sin Workspace)
    4. Contact Information → tu correo
    5. Finish            → acepta la política y pulsa Create

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

  Una vez creada, esos mismos datos se editan en el menú izquierdo bajo Branding, y el botón
  "Configure consent screen" que sale al crear un cliente lleva justo aquí.

EOF

info "Abriendo ${CONSENT_URL}"
info "Si esa página no trae el formulario: ${BRANDING_URL}"
open_url "${CONSENT_URL}"

# NI SE COMPRUEBA NI SE CREA DESDE AQUÍ, y no por pereza: no se puede.
#
# La única API que lee o crea la pantalla de consentimiento es la de IAP
# (`iap.googleapis.com`, projects.brands), y contestó esto al probarla:
#
#     { "code": 400, "message": "Project must belong to an organization." }
#
# Es decir: solo atiende a proyectos que cuelgan de una organización de Workspace. Un proyecto
# de una cuenta Gmail personal no tiene organización, así que ese camino no existe — ni para
# consultarla ni para crearla. No hay otra API que lo exponga.
#
# Tampoco se te pregunta «¿ya la tienes?»: sería trasladarte una duda que tú tampoco puedes
# resolver sin ir a mirar, y una respuesta al azar te manda a una pantalla que no deja hacer nada.
#
# EL CLIENT ID ES LA PRUEBA. Si Google te deja crear el cliente, el consentimiento existía; y si
# no, la pantalla siguiente enseña el aviso amarillo con su botón para arreglarlo sin moverse de
# ahí. El script se limita a esperar en el paso 7 a que le pegues uno válido.
echo
read -r -p "  Pulsa Enter para ir a crear el cliente… " _

fi

# ─────────────────────────────────────────────────────────────────────────────
# 6 · Crear el cliente en la consola
# ─────────────────────────────────────────────────────────────────────────────
step "6 · Crear el cliente"

cat <<EOF

  Esta pantalla es además la COMPROBACIÓN del paso anterior: si sale el aviso amarillo
  "you must first configure your consent screen", es que aún no está — y su propio botón
  "Configure consent screen" te lleva a hacerlo. Si no sale, ya está.

  Google no permite crear este cliente por CLI. En la pantalla que se abre ahora:

    Application type:  Web application
    Name:              ${CLIENT_NAME}

    Authorized JavaScript origins:  uno por cada sitio desde el que se abrirá la ventana de
                                    Google. Con "Add URI", de uno en uno:

                                      http://localhost:4200     el servidor de desarrollo
                                      http://127.0.0.1:4200     el mismo, y AUN ASÍ hace falta
                                      https://tu-dominio        donde publiques la app

                                    El origen es el dominio SIN ruta, y son distintos:
                                      · localhost y 127.0.0.1
                                      · cada puerto
                                      · cada dominio y cada alias del hosting

                                    Si falta el origen desde el que entras, conectar da
                                    "Error 400: origin_mismatch". Se añaden y se quitan aquí
                                    cuando quieras, sin recrear el cliente.

    Authorized redirect URIs:       ninguno
                                    (el flujo popup canjea contra el 'postmessage'
                                     reservado, que no se da de alta aquí)

  Al guardar, Google enseña el Client ID y el client secret. El secret solo se ve UNA vez.

EOF

info "Abriendo ${CLIENTS_URL}"
info "La lista completa está en ${CLIENTS_LIST_URL}"
open_url "${CLIENTS_URL}"

# Se pide el fichero ENTERO, no los dos valores por separado: al guardar el cliente, la consola
# ofrece «Download JSON», y ese fichero ya trae la pareja. Pedir el JSON en vez de dos campos quita
# de un plumazo el fallo que más cuesta diagnosticar —emparejar el id de un cliente con el secreto
# de otro—, que Google rechaza con `invalid_client` sin decir por qué.
#
# Se reintenta en vez de morir: una errata al pegar no debería costarte volver a empezar, con lo que
# cuesta llegar hasta aquí. La salida es la palabra literal `salir` y no una línea vacía — un Enter
# de más no puede costarte tener que regenerar el secret, que Google solo enseña UNA vez.
echo
info "Descarga el JSON del cliente (botón «Download JSON» al guardarlo) y pega su contenido."
info "Es una sola línea; no se verá al pegarlo, porque lleva el client secret dentro."
while true; do
    read -r -s -p "  Pega aquí el JSON del cliente (o 'salir' para abortar): " GOOGLE_OAUTH_CLIENT
    echo
    GOOGLE_OAUTH_CLIENT="$(printf '%s' "${GOOGLE_OAUTH_CLIENT}" | tr -d '\n')"

    if [[ "${GOOGLE_OAUTH_CLIENT}" == "salir" ]]; then
        die "Cancelado: no se ha guardado nada.
  El cliente ya existe en la consola; su secret se regenera desde ahí cuando lo necesites."
    fi

    if [[ -z "${GOOGLE_OAUTH_CLIENT}" ]]; then
        warn "Vacío. Pega el contenido del fichero, o escribe 'salir'."
        continue
    fi

    # Se valida ANTES de escribir: un JSON a medias es un cliente que parece
    # anotado y no lo está.
    if ! CLIENT_ID="$(node -e '
      try {
        const web = JSON.parse(process.argv[1]).web;
        if (!web?.client_id || !web?.client_secret) throw new Error("faltan campos");
        if (!String(web.client_id).endsWith(".apps.googleusercontent.com")) throw new Error("client_id raro");
        process.stdout.write(web.client_id);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    ' "${GOOGLE_OAUTH_CLIENT}" 2>/dev/null)"; then
        warn "Eso no es el JSON de un cliente web de Google: tiene que traer web.client_id y web.client_secret."
        continue
    fi
    break
done

info "Cliente ${CLIENT_ID}"

# ─────────────────────────────────────────────────────────────────────────────
# 7 · Enseñarlo, y parar
#
# **No se escribe en ningún sitio.** El cliente tiene un único domicilio, el secret `GOOGLE_OAUTH_CLIENT`
# del *environment* de GitHub, y de ahí lo saca el pipeline al publicar. Guardar una copia en un
# fichero del repositorio —aunque estuviera en el .gitignore— solo añadiría un sitio del que puede
# escaparse y otro que puede quedarse viejo cuando el cliente se rote.
#
# Va el fichero ENTERO, no sus campos por separado: es lo que se copia y se pega de una vez, y así
# no se pueden emparejar el id de un cliente con el secreto de otro.
# ─────────────────────────────────────────────────────────────────────────────
step "7 · El cliente, para pegar"

warn "Lo que viene lleva el client secret en claro. Cópialo a GitHub y limpia la terminal."
echo
printf '%s\n' "${GOOGLE_OAUTH_CLIENT}"
echo

# ─────────────────────────────────────────────────────────────────────────────
step "Listo"

cat <<EOF

  Cuenta:      ${ACCOUNT}
  Proyecto:    ${PROJECT_ID}
  Cliente:     ${CLIENT_NAME}
  Client ID:   ${CLIENT_ID}

  LO QUE SIGUE — pegarlo. Es UNA sola cosa, y va a UN solo sitio:

    GitHub -> Settings -> Environments -> <ambiente> -> Add environment secret

       Nombre:  GOOGLE_OAUTH_CLIENT
       Valor:   el JSON de arriba, ENTERO, tal cual

  De ahí sacan los dos workflows lo que necesitan: el `client_id`, que sustituye el marcador del
  config.json y del .env de la función al publicar, y el `client_secret`, que va al .env de la
  función en esa misma copia.
  Sin ese secret, el despliegue se para antes de subir nada.

  El mismo ambiente necesita además, en ese environment:

       secret    FIREBASE_SERVICE_ACCOUNT   la clave de la cuenta de servicio de despliegue

  Y nada más: no hay variables de environment. El proyecto de Firebase sale del project_id de esa
  misma cuenta de servicio, y el detalle del flujo en la consola es una casilla del formulario de
  Run workflow del frontend.

  EN LOCAL no hace falta nada de esto: la app arranca sin cliente y funciona entera salvo conectar
  con Google. Si quieres probar ESE flujo en el emulador, pon el client_secret a mano en
  api/auth/.env.local (los dos valores) y el client_id en public/config.json,
  y acuérdate de no commitear ese cambio.

  Para revisar o deshacer a mano:
    Proyectos (y borrarlos)   ${PROJECTS_URL}
    Clientes del proyecto     ${CLIENTS_LIST_URL}
    Consentimiento            ${CONSENT_URL}

EOF
