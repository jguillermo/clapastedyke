#!/usr/bin/env bash
#
# Imprime un campo de un ambiente, validándolo antes.
#
#   ./deploy/env.sh <ambiente> [campo]        campo por defecto: projectId
#
#   ./deploy/env.sh dev                       → migo-dev-20b41
#   ./deploy/env.sh dev region                → us-central1
#
# Existe para que los workflows no tengan que repetir la validación con `jq`: un ambiente que no
# existe, o que todavía tiene el marcador `TU-PROJECT-ID-*` en su projectId, falla AQUÍ con el mismo
# mensaje que en local, y no cincuenta líneas más tarde en mitad de un despliegue.
#
# Escribe el valor por stdout y NADA más, para poder capturarlo. Los errores van a stderr.
#
# Documentación: deploy/README.md

set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    ayuda "${BASH_SOURCE[0]}"
    exit 0
fi

[[ -n "${1:-}" ]] || die "Falta el ambiente. Los definidos en deploy/environments.json son: $(ambientes_conocidos)."

resolver_ambiente "$1"

CAMPO="${2:-projectId}"
VALOR="$(env_campo "${CAMPO}")"

[[ -n "${VALOR}" ]] || die "El ambiente \"${AMBIENTE}\" no tiene \"${CAMPO}\" en deploy/environments.json."

printf '%s\n' "${VALOR}"
