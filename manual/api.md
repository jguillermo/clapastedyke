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
| Su despliegue | `Actions → Desplegar el BACKEND`, con esa carpeta como `funcion` |
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
3. `deploy/firebase.json` **y** `deploy/firebase.emulators.json`: una entrada más en el array
   `functions` y, en el de despliegue, **un rewrite** `/api/<nombre>/**`. Los rewrites se evalúan en
   orden, así que si alguna vez se añade uno más amplio, este va antes. Ojo a la diferencia
   deliberada: el de despliegue apunta a `dist/functions/<nombre>` (el artefacto, dentro de
   `deploy/`) y el del emulador a `../api/<nombre>` (el fuente, en la raíz).
4. `.github/workflows/ci.yml`: añadir el nombre a la matriz del job `api`.
5. Si necesita un parámetro, un `.env` **versionado con su marcador** (`MI_PARAMETRO=MI_PARAMETRO`)
   y su sustitución en `deploy-backend.yml`, como los del cliente de OAuth. **También si es un
   secreto**: no se usa `defineSecret`, porque metería Secret Manager y Service Usage en el camino
   de publicar (ver `api/auth/config.ts`).

## El router: la misma ruta llega de dos formas

Detrás del rewrite de Hosting la función recibe la ruta **completa** (`/api/auth/exchange`). A través
del proxy de `ng serve`, que ya apunta a la función, recibe la **corta** (`/exchange`). Las dos tienen
que acabar en el mismo manejador, y de eso responde `normalizePath()` en
[`api/_common/http.ts`](../api/_common/http.ts). Ninguna ruta debería volver a preocuparse por ello.

## Desarrollo local

```bash
npm run emulators       # compila la función y arranca functions + firestore
npm start               # ng serve, con el proxy de deploy/proxy.config.json
```

El proxy no es comodidad: la cookie de sesión es `HttpOnly` y `SameSite=Lax`, así que **solo viaja si
el backend se ve como mismo origen que la app**. Llamando al emulador por su URL directa
(`127.0.0.1:5001`) la sesión no se reanudaría nunca en local.

Los valores de verdad para el emulador van en `api/<función>/.env.local`, que está en el
`.gitignore` y **no lo escribe ningún script**: se copian a mano del JSON del cliente. Sin ellos, el
emulador arranca igual y `/exchange` contesta 500 — el `.env` versionado solo lleva marcadores.

El emulador usa `deploy/firebase.emulators.json`, no el de despliegue: ejecuta el **fuente** con su
`lib/` recién compilado, sin `npm ci` ni copiar árboles.

## Despliegue: manual, y separado del de la app

Publicar la app y publicar la API son **dos decisiones distintas**, y por eso son dos workflows:

| Qué | Workflow | Comando local (desde la raíz) |
|---|---|---|
| El frontend | [`deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml) | input: ambiente |
| El backend, una función | [`deploy-backend.yml`](../.github/workflows/deploy-backend.yml) | inputs: ambiente + función |

**No hay comando local equivalente, y es deliberado**: el repositorio no tiene scripts de despliegue,
así que publicar es lanzar el workflow. El CLI de Firebase se invoca solo desde ahí, siempre con
`cd deploy`: en esa carpeta está `firebase.json`, y sus `source` y `public` son relativos a ella.

Los dos son `workflow_dispatch`: no hay despliegue automático a propósito (ver
[`firebase-deploy.md`](firebase-deploy.md)).

> **Cuando un cambio necesita las dos cosas, primero la API y después el hosting.** La app llama a
> `/api/auth/token` desde su arranque: publicar el front contra una API vieja deja a todo el mundo
> desconectado hasta que la API suba.

`deploy-backend.yml` despliega también `firestore:rules`, porque esas reglas protegen exactamente lo
que guarda la API — no tendría sentido que viajaran con el frontend. Viven en
[`deploy/firestore.rules`](../deploy/firestore.rules), con el resto del despliegue.

## Requisitos del proyecto de Firebase

Cinco cosas, y las cinco son de **una sola vez por ambiente**. Ninguna la crea el workflow: si falta
alguna, el despliegue muere con un 403 o con un error de configuración, no con un mensaje que diga
«te falta esto».

> **Que el frontend despliegue bien no dice nada del backend.** Publicar el frontend solo necesita
> Hosting; el backend necesita las cinco. Si `deploy-frontend` está en verde y `deploy-backend` en
> rojo, el problema está en esta lista, no en el código ni en el workflow.

### No hay atajo: los cinco son a mano

Antes había un script que los montaba. Ya no: en `deploy/` solo queda
[`create-google-client-id.sh`](../deploy/create-google-client-id.sh), que da de alta el **cliente de
Google** y nada más. La infraestructura del proyecto de Firebase se monta una vez por ambiente, con
los comandos de aquí abajo.

Montar un ambiente entero son tres cosas independientes:

```
1. ./deploy/create-google-client-id.sh   el cliente de Google → te enseña su JSON
2. lo que sigue en esta página           la infraestructura del proyecto de Firebase
3. Settings → Environments → <amb>       los dos secrets (no hay variables)
```

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
5. **El cliente de OAuth en el *environment* de GitHub** (requisito 5): el secret
   `GOOGLE_OAUTH_CLIENT`, con el JSON entero. De él saca el workflow las dos mitades que escribe en
   el `.env` del artefacto.
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
[`deploy/firestore.rules`](../deploy/firestore.rules) las sobrescriben en el primer
despliegue de todas formas).

### CRITICAL: 3 · Las APIs habilitadas — el CLI NO enciende todas

`firebase deploy` enciende sobre la marcha las que sabe que va a necesitar (`cloudfunctions`,
`cloudbuild`, `artifactregistry`, `firebaseextensions`… se ven en el log con «Enabling now…»), pero
para eso necesita **poder consultarlas** (requisito 4). Encenderlas antes, a mano, quita de en medio
los reintentos y los tiempos de propagación en mitad del primer despliegue:

```bash
gcloud services enable \
  cloudfunctions.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  --project <projectId>
```

> **Secret Manager ya no está en la lista, y es deliberado.** El client secret viaja como variable de
> entorno en el `.env` del artefacto, no con `defineSecret`. Mientras lo hacía, publicar la función
> dependía además de `secretmanager.googleapis.com` y de `serviceusage.googleapis.com`, y un 403 en
> cualquiera de las dos tiraba un despliegue que no las necesitaba para nada. El porqué y su coste
> están en [`api/auth/config.ts`](../api/auth/config.ts).

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

Por eso se crea una cuenta de servicio propia,
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

### 5 · El cliente de OAuth, puesto en el *environment*

`api/auth` no arranca sin él ([`api/auth/README.md`](../api/auth/README.md)), pero **no subes nada a
Google**: lo que subes al *environment* de GitHub es el secret `GOOGLE_OAUTH_CLIENT` —el fichero de
cliente que descarga Google, entero—, y `deploy-backend.yml` le saca con `jq` el `client_id` y el
`client_secret` (este último enmascarado con `::add-mask::`) y los escribe en el `.env` de la copia
que viaja en `deploy/dist/functions/auth/`. Es lo que hace que montar un ambiente sea **elegirlo en
Actions**: no queda ningún valor pendiente de que alguien se acuerde de subirlo desde su portátil.

De dónde sale ese valor: [`deploy/README.md`](../deploy/README.md). El script de allí te lo enseña en
pantalla; al *environment* de GitHub se pega a mano.

**Las dos mitades salen del mismo secret**, y eso no es comodidad: es lo que impide emparejar el
`client_id` de un cliente con el `client_secret` de otro, que es lo que Google rechaza con un
`invalid_client` sin explicar nada. El frontend lee ese **mismo** secret, así que tampoco pueden
divergir app y API.

## Cuando el despliegue del backend falla

| Síntoma | Causa | Arreglo |
|---|---|---|
| `403 … Permission denied to get service [cloudfunctions.googleapis.com]` (o `run`, `artifactregistry`, `firestore`…) al empezar el deploy | La cuenta de servicio no tiene `serviceusage.serviceUsageAdmin`: el CLI ni siquiera puede mirar si las APIs están encendidas | Requisito 4 — concede **todos** los roles, no solo ese |
| `403` más adelante, ya subiendo o compilando | Falta uno de los otros roles | Requisito 4 |
| `NOT_FOUND … database (default)` al desplegar las reglas | La API de Firestore está habilitada pero **la base no existe** | Requisito 2 |
| `Billing account … required` / `Your project must be on the Blaze plan` | Proyecto en Spark | Requisito 1 |
| `El environment '<amb>' no tiene el secret GOOGLE_OAUTH_CLIENT` | El *environment* de GitHub no declara el cliente | Requisito 5 |
| La función responde 500 con «La función auth no está configurada» | Está desplegada, pero un marcador del `.env` llegó sin sustituir | Requisito 5 y [`api/auth/README.md`](../api/auth/README.md) |
| `El cliente de GOOGLE_OAUTH_CLIENT no tiene "client_secret"` | El secret está, pero no es el JSON completo del cliente | [`deploy/README.md`](../deploy/README.md) |
| `No existe la función 'x'` en el job `Validar` | Errata en el input `funcion`: tiene que ser una carpeta de `api/` | El error lista las que hay |

Los fallos de **autenticación** (el JSON del secret mal pegado, la clave revocada) son comunes a los
dos workflows y están en la tabla de [`firebase-deploy.md`](firebase-deploy.md).
