# La carpeta `api/` — el backend del proyecto

Todo el código de servidor vive en **`api/`**, en la raíz, fuera de `src/`. Hoy solo hay una función
—[`api/auth`](../api/auth/README.md), el cliente confidencial de OAuth— pero la forma que se describe
aquí es la que sigue **cualquier función que se añada a partir de ahora**.

El «por qué existe un backend en un proyecto que nació sin él» está en
[`google-integration.md`](google-integration.md). Esto es el «cómo está organizado y cómo se opera».

## La regla: una carpeta = un paquete = un despliegue

```
api/
├── _common/        fuente compartida. NO es un paquete y NO se despliega sola
└── auth/           = codebase `auth` = función `auth` = /api/auth/**
    ├── package.json      sus dependencias, su build, su deploy
    ├── tsconfig.json
    └── *.ts
```

> **`module`/`moduleResolution` son `node16`, no `commonjs`/`node`.** TypeScript 6 deprecó la
> resolución `node10` (`TS5107`) y en TS 7 deja de funcionar. Como ningún `package.json` de `api/`
> declara `"type": "module"`, `node16` sigue emitiendo **CommonJS** —lo que espera el runtime de
> Cloud Functions— pero resuelve los paquetes por su mapa de `exports`, que es como publican
> `firebase-functions` y `firebase-admin`.

Cada carpeta que no empiece por `_` es **una función desplegable**, y es autónoma:

| | |
|---|---|
| Sus dependencias | su propio `package.json` y su propio `package-lock.json` |
| Su compilación | su propio `tsconfig.json` |
| Su despliegue | `firebase deploy --only functions:<carpeta>` |
| Su ruta | `/api/<carpeta>/**`, por un rewrite de Hosting |

**No hay ningún punto de entrada común.** No existe un `api/index.ts` que reexporte las funciones, y
no debe crearse: sería un fichero que hay que tocar cada vez que se añade una función, y obligaría a
empaquetarlas y desplegarlas todas juntas. Lo que lo hace posible es que `firebase.json` declara
`functions` como un **array de codebases**, uno por carpeta.

**Ninguna función importa de otra.** Si dos necesitan lo mismo, ese algo se sube a `api/_common/` y se
importa desde ahí — la misma regla que impide que dos contextos de `core/` se conozcan, y por el mismo
motivo: en cuanto una función depende de otra, dejan de poder desplegarse por separado.

### Cómo viaja `_common/` si no es un paquete

Firebase empaqueta **solo** el directorio `source` de la función. Un `require('../_common/http')` en el
JavaScript compilado no encontraría nada una vez desplegado.

Se resuelve con `tsc` y sin bundler: el `tsconfig.json` de cada función declara `rootDir: ".."` e
incluye `../_common/**/*.ts`, así que la salida queda **dentro** de la carpeta que se sube:

```
api/auth/lib/auth/index.js      ← `main` apunta aquí, no a lib/index.js
api/auth/lib/_common/http.js    ← la copia compilada que se despliega con ella
```

Cada función lleva su copia. Eso *es* la independencia: se despliega una sin recompilar las otras.

### CRITICAL: `_common/` solo usa módulos nativos de Node

`api/_common/` está **fuera** del directorio de cualquier función, así que no tiene un `node_modules`
encima: desde allí TypeScript no encuentra nada instalado en `api/<función>/node_modules` y falla con
`TS2307`. Y es una trampa, porque **en ejecución sí funcionaría** —la copia compilada acaba dentro de
la función, donde la resolución sí llega—, así que el error aparece al compilar y no al probar.

La regla que sale de ahí es también la correcta: **en `_common/` solo entran módulos nativos de Node
y tipos propios.** Nada de `firebase-admin`, `express` ni ningún paquete. Si un ayudante necesita una
dependencia, vive en la carpeta de su función; si algún día lo necesitan dos, se copia. Diez líneas
duplicadas cuestan menos que obligar a todas las funciones a declarar un paquete que quizá solo usa
una.

Por eso `_common/http.ts` declara sus propios `HttpRequest`/`HttpResponse` con los cuatro métodos que
usa, en vez de importar los tipos de `express`: la `Response` de verdad los satisface
estructuralmente, y de paso los ayudantes se pueden probar sin levantar nada.

## Añadir una función

1. `api/<nombre>/` con `package.json` (`main: "lib/<nombre>/index.js"`), `tsconfig.json`
   (`rootDir: ".."`), `.gitignore` y `README.md`. Copiar los de `api/auth/` es el camino corto.
2. `index.ts` que exporte `export const <nombre> = onRequest(…)`.
3. `firebase.json`: una entrada más en el array `functions` y **un rewrite** `/api/<nombre>/**`. Los
   rewrites se evalúan en orden, así que si alguna vez se añade uno más amplio, este va antes.
4. `.github/workflows/ci.yml`: añadir el nombre a la matriz del job `api`.
5. Si necesita configuración por ambiente: `.env.<projectId>` versionado para lo público y
   Secret Manager para lo secreto.

## El router: la misma ruta llega de dos formas

Detrás del rewrite de Hosting la función recibe la ruta **completa** (`/api/auth/exchange`). A través
del proxy de `ng serve`, que ya apunta a la función, recibe la **corta** (`/exchange`). Las dos tienen
que acabar en el mismo manejador, y de eso responde `normalizePath()` en
[`api/_common/http.ts`](../api/_common/http.ts). Ninguna ruta debería volver a preocuparse por ello.

## Desarrollo local

```bash
npm run emulators   # firebase emulators:start --only functions,firestore
npm start           # ng serve, con el proxy de proxy.config.json
```

El proxy no es comodidad: la cookie de sesión es `HttpOnly` y `SameSite=Lax`, así que **solo viaja si
el backend se ve como mismo origen que la app**. Llamando al emulador por su URL directa
(`127.0.0.1:5001`) la sesión no se reanudaría nunca en local.

Los secretos del emulador van en `api/<función>/.secret.local`, que está en el `.gitignore`.

## Despliegue: manual, y separado del de la app

Publicar la app y publicar la API son **dos decisiones distintas**, y por eso son dos workflows:

| Qué | Workflow | Comando local (desde la raíz) |
|---|---|---|
| El frontend | [`deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml) (input: ambiente) | `firebase deploy --only hosting` |
| El backend, una función | [`deploy-backend.yml`](../.github/workflows/deploy-backend.yml) (inputs: ambiente + función) | `npm run api:deploy -- --project <projectId>` |

Todo se lanza desde la **raíz**: `firebase.json` está allí, y es lo que fija la raíz del proyecto para
el CLI (los `source` de las funciones son relativos a ella).

Los dos son `workflow_dispatch`: no hay despliegue automático a propósito (ver
[`firebase-deploy.md`](firebase-deploy.md)).

> **Cuando un cambio necesita las dos cosas, primero la API y después el hosting.** La app llama a
> `/api/auth/token` desde su arranque: publicar el front contra una API vieja deja a todo el mundo
> desconectado hasta que la API suba.

`deploy-backend.yml` despliega también `firestore:rules`, porque esas reglas protegen exactamente lo
que guarda la API — no tendría sentido que viajaran con el frontend. Viven en
[`deploy/firebase/firestore.rules`](../deploy/firebase/firestore.rules), con el resto del despliegue:
`firebase.json` las referencia por ruta y **solo** exige que estén dentro de la raíz del proyecto, no
en la raíz misma.

## Requisitos del proyecto de Firebase

- **Plan Blaze.** Cloud Functions lo exige. A este volumen el coste es prácticamente cero, pero hace
  falta una cuenta de facturación.
- **Firestore habilitado.**
- La cuenta de servicio del *environment* de GitHub necesita, además de lo de hosting, los roles
  **Cloud Functions Admin** y **Service Account User**.
