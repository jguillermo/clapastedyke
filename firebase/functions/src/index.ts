/**
 * Punto de entrada del backend.
 *
 * UNA función = UN `export` de este fichero. No se crea una carpeta por función:
 * añadir una función es añadir aquí otro `export` (y, si tiene que ser
 * alcanzable por la app, su `rewrite` en `firebase.json`).
 *
 * Hoy solo está `health`, una función de sanidad: su único propósito es que
 * `firebase deploy` tenga algo real que publicar y se pueda validar el circuito
 * completo — lint → tsc → empaquetado → despliegue.
 *
 * ⚠️ La función `auth` que la app llama en `/api/auth/**` NO está escrita. El
 * commit `63eef49` borró la carpeta `api/` donde vivía (`api/auth/` +
 * `api/_common/`); se recupera desde `63eef49^`. Mientras no exista, la sesión
 * de Google no sobrevive a una recarga de página.
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

// Control de coste: tope de contenedores simultáneos, por función.
setGlobalOptions({maxInstances: 10});

/**
 * Sanidad del despliegue.
 *
 * Devuelve la hora del arranque del contenedor además de la del momento de la
 * petición: si ambas son viejas, lo que está publicado es una revisión
 * anterior, y eso distingue «no se desplegó» de «se desplegó y no cambió nada».
 */
const startedAt = new Date().toISOString();

export const health = onRequest((request, response) => {
  logger.info("health", {structuredData: true});
  response.json({
    status: "ok",
    startedAt,
    now: new Date().toISOString(),
  });
});
