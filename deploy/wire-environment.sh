#!/usr/bin/env bash
#
# Reparte los valores PÚBLICOS de un ambiente a los ficheros LOCALES que los necesitan.
#
# No procesa nada: coge lo que hay en `deploy/environments.json` y lo copia tal cual a los destinos
# que ese mismo fichero declara en su campo `destino`. Si un valor está mal, aquí se copia mal — el
# sitio para arreglarlo es siempre `environments.json`, nunca el fichero generado.
#
#   ./deploy/wire-environment.sh [ambiente]            escribe los destinos locales (defecto: local)
#   ./deploy/wire-environment.sh --check [ambiente]    no escribe: compara y falla si algo difiere
#
# Qué escribe — los destinos con rol `desarrollo`, `emulador` y `proxy`:
#
#   public/config.json                ← el bloque `front.valores`, serializado tal cual
#   api/<fn>/.env.<projectId>  ← el bloque `back.valores`, una línea CLAVE=valor por entrada
#   deploy/proxy.config.json          ← el proxy de `ng serve` hacia el emulador de funciones
#
# Los destinos con rol `artefacto` NO se tocan aquí: los escribe `deploy/build.sh` dentro de
# `deploy/dist/`, que es lo único que se publica.
#
# NO toca secretos y no habla con ninguna nube. `environments.json` solo declara DÓNDE va cada
# secreto; el reparto se hace a mano y este script lo recuerda al terminar. El cuaderno local es
# `deploy/.env-secret`, que no se versiona.
#
# Documentación: deploy/README.md · manual/firebase-deploy.md

set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    ayuda "${BASH_SOURCE[0]}"
    exit 0
fi

MODO="escribir"
PEDIDO=""

for arg in "$@"; do
    case "${arg}" in
    --check) MODO="comprobar" ;;
    -*) die "Opción desconocida: ${arg}. Usa -h para ver el uso." ;;
    *) PEDIDO="${arg}" ;;
    esac
done

resolver_ambiente "${PEDIDO}"

# ─────────────────────────────────────────────────────────────────────────────
# Aplicar: escribir, o comparar sin tocar nada
# ─────────────────────────────────────────────────────────────────────────────

DIFERENCIAS=0

# aplicar <ruta-relativa-al-repo> <generador-de-contenido>
aplicar() {
    local ruta="$1" generador="$2" absoluta contenido
    absoluta="${REPO_ROOT}/${ruta}"
    contenido="$("${generador}")"

    if [[ "${MODO}" == "comprobar" ]]; then
        if [[ ! -f "${absoluta}" ]]; then
            warn "${ruta} no existe"
            DIFERENCIAS=$((DIFERENCIAS + 1))
            return 0
        fi
        if ! printf '%s\n' "${contenido}" | diff -q - "${absoluta}" >/dev/null 2>&1; then
            warn "${ruta} no coincide con el ambiente '${AMBIENTE}'"
            printf '%s\n' "${contenido}" | diff -u "${absoluta}" - | sed 's/^/    /' || true
            DIFERENCIAS=$((DIFERENCIAS + 1))
            return 0
        fi
        info "${ruta} al día"
        return 0
    fi

    mkdir -p "$(dirname "${absoluta}")"
    printf '%s\n' "${contenido}" >"${absoluta}"
    info "${ruta}"
}

# ─────────────────────────────────────────────────────────────────────────────

if [[ "${MODO}" == "comprobar" ]]; then
    bold "Comprobando el ambiente '${AMBIENTE}' (proyecto ${PROJECT_ID}) — no se escribe nada"
else
    bold "Cableando el ambiente '${AMBIENTE}' (proyecto ${PROJECT_ID})"
fi

step "Frontend — el config.json que lee el navegador"

RUTA_CONFIG="$(env_destino front desarrollo)"
if [[ -n "${RUTA_CONFIG}" ]]; then
    aplicar "${RUTA_CONFIG}" contenido_config_json
else
    info "sin destino de desarrollo: '${AMBIENTE}' solo se publica desde deploy/dist (npm run build)"
fi

step "Backend — los parámetros de la función"

RUTA_ENV="$(env_destino back emulador)"
if [[ -n "${RUTA_ENV}" ]]; then
    aplicar "${RUTA_ENV}" contenido_env_funcion
else
    info "sin destino de emulador: '${AMBIENTE}' solo se publica desde deploy/dist (npm run build)"
fi

RUTA_PROXY="$(env_destino back proxy)"
if [[ -n "${RUTA_PROXY}" ]]; then
    aplicar "${RUTA_PROXY}" contenido_proxy
fi

if [[ "${MODO}" == "comprobar" ]]; then
    if ((DIFERENCIAS > 0)); then
        die "${DIFERENCIAS} fichero(s) no coinciden con deploy/environments.json.
  Regenéralos con:  ./deploy/wire-environment.sh ${AMBIENTE}"
    fi
    ok "Todo coincide con el ambiente '${AMBIENTE}'."
    exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# Los secretos NO los toca este script: solo recuerda a dónde van.
# ─────────────────────────────────────────────────────────────────────────────

step "Secretos — a mano; este script no los toca"

node -e '
  const amb = JSON.parse(process.argv[1]);
  const secretos = amb.secretos ?? {};
  for (const clave of secretos.claves ?? []) console.log("  · " + clave);
  console.log("");
  for (const [rol, destino] of Object.entries(secretos.destino ?? {})) {
    console.log("  " + rol.padEnd(11) + String(destino).replace("<projectId>", amb.projectId));
  }
' "${AMBIENTE_JSON}"

cat <<CIERRE

$(bold "Listo.")

  Ambiente   ${AMBIENTE}
  Proyecto   ${PROJECT_ID}
  Región     ${REGION}

  Comprobar que nadie los editó a mano:  ./deploy/wire-environment.sh --check ${AMBIENTE}
  Levantar el emulador:                  npm run emulators
  Levantar la app:                       npm start

CIERRE
