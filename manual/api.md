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

Cinco cosas, y las cinco son de **una sola vez por ambiente**. Ninguna la crea el workflow: si falta
alguna, el despliegue muere con un 403 o con un error de configuración, no con un mensaje que diga
«te falta esto».

> **Que el frontend despliegue bien no dice nada del backend.** Publicar el frontend solo necesita
> Hosting; el backend necesita las cinco. Si `deploy-frontend` está en verde y `deploy-backend` en
> rojo, el problema está en esta lista, no en el código ni en el workflow.

### El atajo: un script lo deja hecho

Los cinco requisitos, más el proyecto de Firebase y el secret de GitHub, los monta
[`deploy/setup-firebase-project.sh`](../deploy/setup-firebase-project.sh) sobre un ambiente de
`deploy/firebase/environments.json`. Es **idempotente**: comprueba antes de actuar, así que se puede
relanzar sobre un ambiente a medias.

```bash
./deploy/setup-firebase-project.sh
```

Ese script es **solo infraestructura**. Montar un ambiente entero son tres comandos, cada uno con
una responsabilidad:

```bash
./deploy/create-google-client-id.sh   # crea el cliente de Google → deploy/.env-secret
./deploy/setup-firebase-project.sh    # ESTE: la infraestructura del proyecto
./deploy/wire-environment.sh          # reparte los valores al ambiente
```

Lo que sigue es lo que hace el segundo, a mano.

### El paso a paso, en orden

Sobre un ambiente nuevo (aquí `<projectId>`), de arriba abajo:

1. **Plan Blaze** — Firebase Console → ⚙ → *Uso y facturación* → *Modifica el plan* → **Blaze**
   (requisito 1).
2. **Base de datos de Firestore creada** (requisito 2):
   ```bash
   gcloud firestore databases list --project <projectId>
   gcloud firestore databases create --location=eur3 --project <projectId>   # si no hay ninguna
   ```
3. **Habilitar las APIs que el CLI no enciende solo** (requisito 3):
   ```bash
   gcloud services enable \
     secretmanager.googleapis.com \
     cloudfunctions.googleapis.com \
     run.googleapis.com \
     cloudbuild.googleapis.com \
     artifactregistry.googleapis.com \
     firestore.googleapis.com \
     --project <projectId>
   ```
4. **Conceder los roles a la cuenta de servicio del despliegue** — el `client_email` del JSON que hay
   en el secret `FIREBASE_SERVICE_ACCOUNT` del *environment* de GitHub (requisito 4, el bucle
   `for ROLE in …` de más abajo).
5. **El secreto de OAuth en el *environment* de GitHub** (requisito 5): `GOOGLE_OAUTH_CLIENT_SECRET`,
   que lo pone en Secret Manager el propio workflow.
6. **Esperar 2–3 minutos** a que propaguen las APIs y los roles.
7. **Relanzar el workflow `deploy-backend`.**

### 1 · Plan Blaze

Cloud Functions lo exige. A este volumen el coste es prácticamente cero, pero hace falta una cuenta
de facturación asociada al proyecto.

### 2 · La base de datos de Firestore, creada

**Habilitar la API no crea la base.** Son dos cosas distintas, y desplegar `firestore:rules` contra
un proyecto sin base de datos falla. Se comprueba y se crea una sola vez:

```bash
gcloud firestore databases list --project <projectId>
gcloud firestore databases create --location=eur3 --project <projectId>   # si no hay ninguna
```

O desde la consola de Firebase: **Compilación → Firestore Database → Crear base de datos**, en modo
producción (las reglas de
[`deploy/firebase/firestore.rules`](../deploy/firebase/firestore.rules) las sobrescriben en el primer
despliegue de todas formas).

### CRITICAL: 3 · Las APIs habilitadas — el CLI NO enciende todas

`firebase deploy` enciende sobre la marcha las que sabe que va a necesitar (`cloudfunctions`,
`cloudbuild`, `artifactregistry`, `firebaseextensions`… se ven en el log con «Enabling now…»).
**Secret Manager no está en esa lista.** Para resolver `GOOGLE_OAUTH_CLIENT_SECRET` el CLI llama
directo a `secretmanager.googleapis.com` sin habilitarla antes, así que en un proyecto recién creado
el despliegue muere con un 403 que **no** es de permisos:

```
Error: Request to https://secretmanager.googleapis.com/v1/projects/<projectId>/secrets/GOOGLE_OAUTH_CLIENT_SECRET
had HTTP Error: 403, Secret Manager API has not been used in project <projectId> before or it is disabled.
```

Se encienden todas de golpe, una sola vez:

```bash
gcloud services enable \
  secretmanager.googleapis.com \
  cloudfunctions.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  --project <projectId>
```

Las otras cinco no hacen falta estrictamente —el CLI las habilitaría él— pero encenderlas aquí quita
de en medio los reintentos y los tiempos de propagación en mitad del primer despliegue.

**Habilitar tarda un par de minutos en propagarse.** Si relanzas el workflow al instante, puede
repetir el mismo 403.

### CRITICAL: 4 · Los roles de la cuenta de servicio — los del backend NO son los del frontend

La cuenta de servicio es la misma (el secret `FIREBASE_SERVICE_ACCOUNT` del *environment* de GitHub,
[`firebase-deploy.md`](firebase-deploy.md) paso 3), pero **lo que necesita poder hacer no lo es**.
Publicar el frontend es subir ficheros a Hosting; publicar el backend es compilar una imagen,
subirla a un registro, crear un servicio de Cloud Run, darle acceso a un secreto y escribir las
reglas de Firestore. Son media docena de APIs distintas.

Y hay una trampa de origen: la clave que se genera desde *Firebase Console → Cuentas de servicio*
devuelve la cuenta `firebase-adminsdk-…@<projectId>.iam.gserviceaccount.com`, que viene con
`firebase.sdkAdminServiceAgent` — sirve para **usar** el Admin SDK en ejecución, no para
**desplegar** nada. Recién creada, no puede ni consultar si la API de Firestore está encendida.

Por eso [`setup-firebase-project.sh`](../deploy/setup-firebase-project.sh) crea una cuenta propia,
`clapastedyke-deploy@<projectId>.iam.gserviceaccount.com`, y le concede estos roles explícitamente en
vez de confiar en los que trae una cuenta prefabricada.

Los roles, en el proyecto del ambiente:

| Rol | Sin él falla en |
|---|---|
| `roles/serviceusage.serviceUsageAdmin` | Lo **primero** de todo: el CLI comprueba y habilita las APIs antes de subir nada |
| `roles/cloudfunctions.admin` | Crear/actualizar la función |
| `roles/run.admin` | Las funciones de 2ª generación **son** servicios de Cloud Run |
| `roles/cloudbuild.builds.editor` | La compilación de la imagen |
| `roles/artifactregistry.admin` | Dónde se guarda esa imagen |
| `roles/iam.serviceAccountUser` | *Actuar como* la cuenta de ejecución de la función |
| `roles/secretmanager.admin` | `GOOGLE_OAUTH_CLIENT_SECRET`: resolverlo y dar acceso a la función |
| `roles/firebaserules.admin` | `firestore:rules` |
| `roles/firebase.developAdmin` | Leer el proyecto de Firebase como tal |

Se conceden de golpe, porque cada uno que falte es otro despliegue fallido de veinte minutos:

```bash
SA="LA-CUENTA@<projectId>.iam.gserviceaccount.com"   # el `client_email` del JSON del secret
PROJECT="<projectId>"

for ROLE in \
  roles/serviceusage.serviceUsageAdmin \
  roles/cloudfunctions.admin \
  roles/run.admin \
  roles/cloudbuild.builds.editor \
  roles/artifactregistry.admin \
  roles/iam.serviceAccountUser \
  roles/secretmanager.admin \
  roles/firebaserules.admin \
  roles/firebase.developAdmin
do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:$SA" --role="$ROLE" --condition=None
done
```

También se pueden añadir a mano en [IAM](https://console.cloud.google.com/iam-admin/iam). **Los
cambios tardan un minuto largo en propagarse**: si relanzas el workflow inmediatamente, puede volver
a dar el mismo 403.

### 5 · El secreto de OAuth, puesto

`api/auth` no arranca sin él ([`api/auth/README.md`](../api/auth/README.md)), pero **no lo subes tú**:
va como *environment secret* `GOOGLE_OAUTH_CLIENT_SECRET` en GitHub, y `deploy-backend.yml` lo escribe
en Secret Manager antes de desplegar. Es lo que hace que montar un ambiente sea **elegirlo en
Actions**: no queda ningún valor pendiente de que alguien se acuerde de subirlo desde su portátil.

De dónde sale ese valor: [`deploy/google-client-id.md`](../deploy/google-client-id.md). El script de
allí lo deja en `deploy/.env-secret` y, si tienes `gh`, en el *environment* directamente.

Si alguna vez hace falta ponerlo a mano:

```bash
npx --yes firebase-tools functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET --project <projectId>
```

**Va después del requisito 3**: este comando también habla con Secret Manager, así que sin la API
habilitada falla con el mismo 403 y parece que el secreto no se puede crear. Le pasa igual al paso
del workflow.

El **Client ID** no va aquí: no es un secreto, y su `.env.<projectId>` es un fichero **generado** —lo
escribe `deploy/firebase/api-env.mjs` desde el `googleClientId` de ese ambiente en
`deploy/firebase/environments.json`, y el `predeploy` lo regenera en cada despliegue, así que no
puede quedarse viejo ni divergir.

## Cuando el despliegue del backend falla

| Síntoma | Causa | Arreglo |
|---|---|---|
| `403 … Secret Manager API has not been used in project … before or it is disabled` | La API de Secret Manager no está encendida: el CLI la llama directa, sin habilitarla | Requisito 3 |
| `403 … Permission denied to get service [firestore.googleapis.com]` (o `cloudfunctions`, `run`, `artifactregistry`…) justo tras el `predeploy` | La cuenta de servicio no tiene `serviceusage.serviceUsageAdmin`: el CLI ni siquiera puede mirar si las APIs están encendidas | Requisito 4 — concede **todos** los roles, no solo ese |
| `403` más adelante, ya subiendo o compilando | Falta uno de los otros roles | Requisito 4 |
| `NOT_FOUND … database (default)` al desplegar las reglas | La API de Firestore está habilitada pero **la base no existe** | Requisito 2 |
| `Billing account … required` / `Your project must be on the Blaze plan` | Proyecto en Spark | Requisito 1 |
| `El environment '<amb>' no tiene el secret GOOGLE_OAUTH_CLIENT_SECRET` | El *environment* de GitHub no lo declara | Requisito 5 |
| `Secret GOOGLE_OAUTH_CLIENT_SECRET … does not exist` | El paso que lo pone no llegó a correr (o se desplegó a mano saltándose el workflow) | Requisito 5 |
| La función responde 500 con «La función auth no está configurada» | Está desplegada, pero le falta el Client ID o el secreto | Requisito 5 y [`api/auth/README.md`](../api/auth/README.md) |
| `El ambiente "<amb>" no tiene "googleClientId"` en el `predeploy` | El bloque `config` de ese ambiente está vacío: la función se habría desplegado sin poder canjear | [`deploy/google-client-id.md`](../deploy/google-client-id.md) |
| `No existe la función 'x'` en el job `Validar` | Errata en el input `funcion`: tiene que ser una carpeta de `api/` | El error lista las que hay |

Los fallos de **autenticación** (el JSON del secret mal pegado, la clave revocada) son comunes a los
dos workflows y están en la tabla de [`firebase-deploy.md`](firebase-deploy.md).
