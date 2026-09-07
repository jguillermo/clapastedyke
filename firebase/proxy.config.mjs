/**
 * Proxy del servidor de desarrollo: `/api/auth/**` → la función `auth` del emulador.
 *
 * ## Por qué existe (y por qué volvió)
 *
 * Existió antes por la cookie: era `SameSite=Lax` y exigía mismo origen. Se quitó cuando la cookie
 * pasó a `SameSite=None; Secure` con respaldo en `session_token`. **Vuelve por otra razón, que es
 * del emulador y no de la app**: el emulador de funciones arranca el runtime con
 * `FIREBASE_DEBUG_FEATURES={"enableCors":true}` (está hardcodeado en
 * `firebase-tools/lib/emulator/functionsEmulator.js`), y con ese flag `firebase-functions` envuelve
 * el manejador en su propio middleware `cors({origin:true})`. Ese middleware **contesta el preflight
 * antes que `router.ts`** y no pone `Access-Control-Allow-Credentials: true`, así que el navegador
 * rechaza toda petición con `credentials: 'include'` — que son TODAS las de la app:
 *
 *     Response to preflight request doesn't pass access control check: The value of the
 *     'Access-Control-Allow-Credentials' header in the response is '' which must be 'true'
 *     when the request's credentials mode is 'include'.
 *
 * No hay forma de desactivarlo desde `firebase.json`. Con el proxy la app llama a su **propio
 * origen** (`http://localhost:4200/api/auth`), así que no hay CORS que pasar: el navegador no
 * preflighta una petición del mismo origen. En producción no aplica nada de esto — sin el flag de
 * depuración, el preflight lo contesta `router.ts` con `Allow-Credentials: true`.
 *
 * ## Consecuencia: abre la app en `localhost`, no en `127.0.0.1`
 *
 * `authApiUrl` de tu `public/config.json` local apunta a `http://localhost:4200/api/auth`. Si abres
 * la app en `http://127.0.0.1:4200`, esa URL es otro sitio (`localhost` y `127.0.0.1` son hosts
 * distintos para el navegador) y vuelves a estar en el caso de arriba.
 */

import { readFileSync } from 'node:fs';

/** El proyecto del emulador sale de `.firebaserc`, para no repetir el id en dos ficheros. */
const { projects } = JSON.parse(readFileSync(new URL('.firebaserc', import.meta.url), 'utf-8'));
const projectId = projects.default;
const REGION = 'us-central1'; // la de `onRequest` en functions/src/index.ts
const FUNCTIONS_EMULATOR = 'http://127.0.0.1:5001';

export default {
  '/api/auth': {
    target: FUNCTIONS_EMULATOR,
    changeOrigin: false,
    secure: false,
    // `rewrite` es la clave de Vite (el dev-server de @angular/build); `pathRewrite` la de
    // webpack-dev-server. Van las dos para que el fichero no dependa de cuál está debajo.
    rewrite: (path) => path.replace(/^\/api\/auth/, `/${projectId}/${REGION}/auth`),
    pathRewrite: { '^/api/auth': `/${projectId}/${REGION}/auth` },
  },
};
