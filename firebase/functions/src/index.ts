/**
 * Punto de entrada del backend.
 *
 * UNA función = UN `export` de este fichero. No se crea una carpeta por función: añadir una función
 * es añadir aquí otro `export`.
 *
 * Hoy solo está `auth`, el **cliente confidencial de OAuth** de la app: custodia el refresh token de
 * cada persona y emite tokens de acceso frescos. No hace nada más — ni toca la hoja de cálculo, ni
 * sabe qué es una receta. **Es un backend de identidad, nunca de datos**: la sincronización del
 * recetario sigue entera en el navegador, hablando directamente con Sheets y Drive.
 *
 * El contrato de sus tres rutas está en `src/auth/router.ts` y explicado en `README.md`.
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import {route} from "./auth/router";

// Control de coste: tope de contenedores simultáneos, por función.
setGlobalOptions({maxInstances: 10});

/**
 * El servicio de sesión.
 *
 * Sin `cors` de `onRequest`: esta función refleja el origen y responde el preflight ella misma (ver
 * `auth/cors.ts`), porque necesita `Access-Control-Allow-Credentials`, que la opción del framework
 * no cubre con la política que se quiere aquí.
 */
export const auth = onRequest(
  {
    region: "us-central1",
    // La app la llama en cada arranque; que alguien espere un arranque en frío es aceptable, pero no
    // diez segundos colgado de una llamada a Google que no responde.
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (req, res) => {
    await route(req, res);
  },
);
