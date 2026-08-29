#!/usr/bin/env bash
#
# Lo que comparten los scripts de `deploy/`: estilo de salida y lectura de `environments.json`.
#
# No se ejecuta: se hace `source`. Existe porque `wire-environment.sh`, `build.sh`, `deploy.sh` y
# `emulators.sh` hacen las mismas cuatro preguntas al mismo fichero, y tres copias de la misma
# función `node -e` es exactamente el tipo de divergencia que este rediseño viene a quitar.
#
#   source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
#   resolver_ambiente "${AMBIENTE}"      # deja AMBIENTE, AMBIENTE_JSON, PROJECT_ID y REGION puestos

# Toda expansión va con llaves — `${VAR}`, no `$VAR`. El bash 3.2 que trae macOS, con un locale
# UTF-8, se traga el primer byte del carácter siguiente dentro del nombre de la variable.

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
step() { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }
info() { printf '  %s\n' "$1"; }
warn() { printf '\033[33m  ! %s\033[0m\n' "$1"; }
ok() { printf '\n\033[32m✔ %s\033[0m\n' "$1"; }
die() {
    printf '\n\033[31m✗ %s\033[0m\n' "$1" >&2
    exit 1
}

lower() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }
trim() { printf '%s' "$1" | tr -d '[:space:]'; }

# Imprime la cabecera de comentarios del script que llama, sin los `# `. Se usa para `-h`.
ayuda() {
    awk 'NR < 3 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$1"
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="${REPO_ROOT}/deploy"
ENVIRONMENTS="${DEPLOY_DIR}/environments.json"

command -v node >/dev/null 2>&1 || die "Hace falta Node para leer environments.json."
[[ -f "${ENVIRONMENTS}" ]] || die "No encuentro ${ENVIRONMENTS}."

# ─────────────────────────────────────────────────────────────────────────────
# Lectores — un `node -e` por pregunta, sin dependencias externas (nada de jq)
# ─────────────────────────────────────────────────────────────────────────────

ambientes_conocidos() {
    node -e 'process.stdout.write(Object.keys(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))).join(", "))' \
        "${ENVIRONMENTS}"
}

# resolver_ambiente [nombre] — valida y deja AMBIENTE / AMBIENTE_JSON / PROJECT_ID / REGION puestos.
# Sin argumento, o vacío, usa `local`.
resolver_ambiente() {
    AMBIENTE="$(lower "$(trim "${1:-local}")")"
    AMBIENTE="${AMBIENTE:-local}"

    AMBIENTE_JSON="$(node -e '
      const doc = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
      const amb = doc[process.argv[2]];
      if (!amb) process.exit(2);
      process.stdout.write(JSON.stringify(amb));
    ' "${ENVIRONMENTS}" "${AMBIENTE}")" || die "Ambiente \"${AMBIENTE}\" desconocido. Los definidos en deploy/environments.json son: $(ambientes_conocidos)."

    PROJECT_ID="$(env_campo projectId)"
    REGION="$(env_campo region)"

    [[ -n "${PROJECT_ID}" ]] || die "El ambiente \"${AMBIENTE}\" no tiene projectId en deploy/environments.json."
    [[ -n "${REGION}" ]] || die "El ambiente \"${AMBIENTE}\" no tiene region en deploy/environments.json."

    if [[ "${PROJECT_ID}" == TU-PROJECT-ID* ]]; then
        die "El ambiente \"${AMBIENTE}\" todavía no está montado: su projectId sigue siendo el marcador
  \"${PROJECT_ID}\". Móntalo con ./deploy/setup-firebase-project.sh y vuelve a intentarlo.
  No se ha escrito nada."
    fi
}

# env_campo <clave> — un campo del ambiente que está fuera de front/back (projectId, region).
env_campo() {
    node -e '
      const amb = JSON.parse(process.argv[1]);
      process.stdout.write(String(amb[process.argv[2]] ?? ""));
    ' "${AMBIENTE_JSON}" "$1"
}

# env_destino <bloque> <rol> — la ruta declarada en `destino`, con el <projectId> ya sustituido.
# El valor describe la ruta y, tras un guion largo, por qué existe: la ruta es lo que hay antes.
# Devuelve cadena vacía si ese bloque no declara ese rol.
env_destino() {
    node -e '
      const amb = JSON.parse(process.argv[1]);
      const bloque = amb[process.argv[2]];
      const texto = bloque && bloque.destino ? bloque.destino[process.argv[3]] : undefined;
      if (!texto) process.exit(1);
      const ruta = String(texto).split("—")[0].trim();
      process.stdout.write(ruta.replace("<projectId>", amb.projectId));
    ' "${AMBIENTE_JSON}" "$1" "$2" 2>/dev/null || true
}

# ─────────────────────────────────────────────────────────────────────────────
# Generadores de contenido — cada uno imprime por stdout el fichero entero.
# Copian `valores` tal cual: si un valor está mal, el sitio para arreglarlo es environments.json.
# ─────────────────────────────────────────────────────────────────────────────

contenido_config_json() {
    node -e '
      const amb = JSON.parse(process.argv[1]);
      process.stdout.write(JSON.stringify(amb.front.valores, null, 2) + "\n");
    ' "${AMBIENTE_JSON}"
}

contenido_env_funcion() {
    node -e '
      const amb = JSON.parse(process.argv[1]);
      const ambiente = process.argv[2];
      const lineas = [
        "# GENERADO — no edites este fichero a mano: sale de deploy/environments.json.",
        "#",
        "# Parámetros públicos de la función para el proyecto `" + amb.projectId + "` (ambiente `" + ambiente + "`).",
        "# Viven en el bloque `back.valores` de ese ambiente. Para cambiarlos se edita ESE fichero y",
        "# se vuelve a ejecutar:",
        "#",
        "#   ./deploy/wire-environment.sh " + ambiente + "     (emulador)",
        "#   npm run build -- " + ambiente + "                 (artefacto de deploy/dist)",
        "#",
        "# Nada de lo que hay aquí es secreto. El client secret vive en Secret Manager en la nube y en",
        "# api/auth/.secret.local en el emulador; ninguno de los dos pasa por aquí.",
      ];
      for (const [clave, valor] of Object.entries(amb.back.valores)) {
        lineas.push("", clave + "=" + valor);
      }
      process.stdout.write(lineas.join("\n") + "\n");
    ' "${AMBIENTE_JSON}" "${AMBIENTE}"
}

contenido_proxy() {
    node -e '
      const amb = JSON.parse(process.argv[1]);
      const doc = {
        "//": [
          "GENERADO — no edites este fichero a mano: lo reescribe deploy/wire-environment.sh.",
          "",
          "El backend de la sesión durante el desarrollo.",
          "",
          "En producción /api/auth/** lo reescribe Firebase Hosting a la función `auth`. Con `ng serve` no",
          "hay Hosting, así que este proxy hace lo mismo contra el emulador — y eso importa por algo más",
          "que la comodidad: la cookie de sesión es HttpOnly y SameSite=Lax, y solo viaja si el backend se",
          "ve como MISMO ORIGEN que la app. Llamando al emulador por su URL directa (127.0.0.1:5001) la",
          "cookie no se enviaría nunca y la sesión no se reanudaría jamás en local.",
          "",
          "`pathRewrite` quita el prefijo porque la URL del emulador ya apunta a la función. La ruta llega",
          "entonces como /exchange en vez de /api/auth/exchange; las dos formas las normaliza",
          "api/_common/http.ts.",
          "",
          "El proyecto y la región salen del ambiente `local` de deploy/environments.json.",
          "",
          "Arranca el emulador con `npm run emulators` antes de `npm start`.",
        ],
        "/api/auth": {
          target: "http://127.0.0.1:5001/" + amb.projectId + "/" + amb.region + "/auth",
          secure: false,
          changeOrigin: false,
          logLevel: "warn",
          pathRewrite: { "^/api/auth": "" },
        },
      };
      process.stdout.write(JSON.stringify(doc, null, 2) + "\n");
    ' "${AMBIENTE_JSON}"
}
