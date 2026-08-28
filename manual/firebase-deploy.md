# Despliegue en Firebase Hosting

La app se publica en **Firebase Hosting** con un workflow **manual**
([`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml)). No hay
despliegue automático: mergear a `main` no publica nada. Publicar es una decisión que se toma
eligiendo un ambiente y pulsando un botón.

> **Este documento es solo el frontend.** El backend (`api/`) se publica con **otro** workflow,
> [`deploy-backend.yml`](../.github/workflows/deploy-backend.yml), y su procedimiento está en
> [`api.md`](api.md). Son dos ficheros y dos decisiones a propósito: un cambio de maquetación no
> puede tirar el servicio de sesión ni al revés. Cuando hay que publicar los dos, **primero el
> backend**.

Un **ambiente** es un **proyecto de Firebase independiente** bajo la misma cuenta de Google: no
comparten hosting, ni cuota, ni credenciales. Hoy hay dos, `dev` y `prod`, pero **el número no está
fijado en ningún sitio** — los ambientes son datos, y añadir `stage`, `lab` o `qa` no toca el
workflow. Ver [«Añadir un ambiente»](#añadir-un-ambiente).

> **Antes se desplegaba en GitHub Pages.** Ya no: el workflow `deploy-demo.yml` se borró, y con él
> el `--base-href /clapastedyke/` y el `404.html` que hacían falta allí. Si el sitio antiguo sigue
> vivo, se apaga en `Settings → Pages → Source: None`.

---

## Dónde vive cada valor

Esta es la pregunta importante, y la respuesta es corta: **la lista de ambientes es un fichero**, y
lo secreto está fuera del repo. Nada de configuración vive dentro del workflow.

| Sitio | Qué contiene | Secreto |
|---|---|---|
| [`deploy/firebase/environments.json`](../deploy/firebase/environments.json) | **La lista de ambientes**: a qué proyecto de Firebase va cada uno (`projectId`) y el `config.json` con el que corre la app | No |
| **Environments de GitHub**, uno por ambiente | `FIREBASE_SERVICE_ACCOUNT` y `GOOGLE_OAUTH_CLIENT_SECRET` | Sí |
| [`deploy/.env-secret`](../deploy/.env-secret) | El cuaderno local del que salen esos dos, **ignorado por git** | Sí |

**El formato de `environments.json`** —sus dos niveles, qué va en `config` y qué fuera, y por qué
`public/config.json` es un fichero **generado** que no se edita a mano— está documentado junto al
propio fichero, en [`deploy/firebase/README.md`](../deploy/firebase/README.md). No se repite aquí
para que no puedan contradecirse.

El nombre del ambiente es la bisagra: **la clave en `environments.json` y el nombre del *environment*
de GitHub tienen que ser el mismo, en minúsculas.** Eso es lo que hace que `secrets.*` resuelva a
las credenciales del proyecto correcto sin un solo `if` en el workflow.

---

## Puesta en marcha (una sola vez, y hay que hacerla por cada ambiente)

**Repite los pasos 1 a 5 completos para `dev` y para `prod`.** Son proyectos independientes: cada
uno tiene su propia cuenta de servicio y su propia clave. No reutilices la de dev en prod — si se
filtra una, se lleva los dos por delante.

### Paso 1 · Crear el proyecto de Firebase

En <https://console.firebase.google.com>, con tu cuenta de Google: *Crear un proyecto* → nómbralo
p. ej. `clapastedyke-dev`. Analytics no hace falta.

Dentro del proyecto: **Compilación → Hosting → Comenzar**. La consola te ofrecerá instalar la CLI y
correr `firebase init`; **sáltate esos pasos** — el `firebase.json` ya está en el repo y
`firebase init` lo sobrescribiría.

Anota el **Project ID** (el identificador con guiones que sale bajo el nombre, no el nombre bonito;
Firebase a veces le añade un sufijo aleatorio).

### Paso 2 · Escribirlo en `deploy/firebase/environments.json`

```jsonc
{
  "dev": {
    "projectId": "migo-dev-20b41",
    "config": { "debug": true, "googleClientId": "2229…", "syncPollSeconds": 120 }
  },
  "prod": {
    "projectId": "clapastedyke-prod",
    "config": { "debug": false, "googleClientId": "2229…", "syncPollSeconds": 120 }
  }
}
```

Aquí va también el **Client ID de OAuth** de cada ambiente (`config.googleClientId`), que **no es un
secreto** y por eso está versionado —el porqué, en
[`deploy/firebase/README.md`](../deploy/firebase/README.md). Cómo se genera:
[`deploy/google-client-id.md`](../deploy/google-client-id.md).

Después, `npm run config` para regenerar `public/config.json`, y commitea los dos. Si te dejas el
placeholder `TU-PROJECT-ID-…`, el workflow falla en el primer job con un mensaje que te manda aquí,
sin llegar a compilar ni a desplegar nada.

### Paso 3 · Una cuenta de servicio por proyecto

GitHub Actions no puede abrir un navegador para iniciar sesión, así que despliega con una **cuenta
de servicio**: un usuario de máquina con su propia clave.

> **El atajo:** [`deploy/setup-firebase-project.sh`](../deploy/setup-firebase-project.sh) crea esa
> cuenta, le concede los diez roles (los de hosting **y** los del backend), genera su clave fuera del
> repositorio y sube `FIREBASE_SERVICE_ACCOUNT` al *environment* si tienes `gh`. Hace además los
> cinco requisitos de [`api.md`](api.md). El otro secret del paso 4,
> `GOOGLE_OAUTH_CLIENT_SECRET`, lo pone [`wire-environment.sh`](../deploy/wire-environment.sh). Lo
> que sigue es lo mismo, a mano.

A mano, en el proyecto de Firebase: ⚙️ **Configuración del proyecto → Cuentas de servicio →
Generar nueva clave privada** → se descarga un `.json`.

> Ese fichero es una credencial con permiso para publicar en ese proyecto. **No se commitea, no se
> pega en un chat.** Si se filtra, se revoca en
> [Google Cloud → IAM → Cuentas de servicio](https://console.cloud.google.com/iam-admin/serviceaccounts)
> borrando esa clave.

Si al desplegar diera un error de permisos, dale a esa cuenta el rol **Firebase Hosting Admin**
(`roles/firebasehosting.admin`) en [IAM](https://console.cloud.google.com/iam-admin/iam) del
proyecto correspondiente.

> ⚠️ **Ese rol basta para el frontend y NO basta para el backend.** La cuenta de servicio es la
> misma, pero desplegar `api/` compila una imagen, crea un servicio de Cloud Run, lee un secreto y
> escribe las reglas de Firestore: son media docena de APIs más, y la cuenta recién generada aquí no
> tiene permiso ni para consultar si están habilitadas (`403 Permission denied to get service …`).
> La lista completa de roles del backend está en [`api.md`](api.md) → «Requisitos del proyecto de
> Firebase». Si este ambiente va a servir la API, concédelos **ahora**, en la misma visita a IAM.

### Paso 4 · El *environment* de GitHub y su secret

Aquí es donde se separan de verdad los ambientes.

En `Settings → Environments → New environment`, crea uno con **exactamente la misma clave** que en
`environments.json`, en minúsculas: `dev`, `prod`, …

Dentro de **cada** environment, `Add environment secret`. Son dos:

| Secret | Valor | Quién lo usa |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | El **contenido íntegro** del JSON del paso 3 — ábrelo con un editor y pega todo, desde la `{` hasta la `}`. **Uno distinto por ambiente**: cada JSON abre su proyecto | Los dos workflows |
| `GOOGLE_OAUTH_CLIENT_SECRET` | El client secret de Google de ese ambiente ([`deploy/google-client-id.md`](../deploy/google-client-id.md)) | Solo el backend: el workflow lo pone en Secret Manager antes de desplegar |

Los dos acaban en `deploy/.env-secret` —que **no** se versiona— y de ahí los suben al *environment*,
si tienes `gh`, los scripts que los producen: el de la cuenta de servicio
([`setup-firebase-project.sh`](../deploy/setup-firebase-project.sh)) y el del cliente de Google
([`wire-environment.sh`](../deploy/wire-environment.sh)). Que estén aquí y no en la máquina de nadie
es lo que permite **montar un ambiente eligiéndolo en Actions**.

Dos avisos sobre ese pegado, que son los fallos habituales: no es la **ruta** al fichero, es su
contenido; y **no le quites los `\n`** del `private_key`, que son los que permiten firmar el JWT.

⚠️ **No lo pongas en `Settings → Secrets → Actions` (los de repositorio)**: ahí sería compartido por
todos los ambientes y desplegar a dev publicaría con las credenciales de prod. Tiene que ser un
**environment secret**, dentro de su environment.

> **El Client ID de OAuth no está aquí, y es deliberado**: no es una credencial. Vive en
> `environments.json` (paso 2).

#### Opcional pero recomendado: protecciones en `prod`

En el environment `prod`, `Deployment protection rules`:

- **Required reviewers** → tú mismo. Así un deploy a prod queda en espera hasta que lo apruebas
  desde la propia UI de Actions. Es la red que impide publicar por inercia.
- **Deployment branches** → `Selected branches` → `main`. Impide desplegar a prod desde una rama de
  trabajo.

Los ambientes de trabajo (`dev`, `stage`, `lab`…) se dejan sin protecciones: son justo el sitio
donde quieres desplegar cualquier rama sin pedir permiso.

### Paso 5 · Orígenes de OAuth (dos por ambiente)

Solo si el ambiente va a usar la sincronización con Google. Firebase publica cada sitio en **dos
dominios** (`https://<projectId>.web.app` y `https://<projectId>.firebaseapp.com`) y para Google son
orígenes distintos: los dos tienen que estar en los orígenes autorizados del Client ID, o entrar por
el que falte da `Error 400: origin_mismatch`. Con dos ambientes son cuatro entradas; con cuatro,
ocho.

**Cómo se crea ese Client ID y dónde se registran sus orígenes está en
[`deploy/google-client-id.md`](../deploy/google-client-id.md)** — es el único sitio con ese procedimiento.

---

## Añadir un ambiente

Dos pasos, y **el workflow no se toca**. El nombre del ambiente que escribes al lanzarlo se valida
contra `environments.json`, así que la lista de ambientes que existen es literalmente ese fichero.

1. **Un bloque en [`deploy/firebase/environments.json`](../deploy/firebase/environments.json)** — con el proyecto de
   Firebase ya creado y Hosting activado (pasos 1 y 2):

   ```jsonc
   "stage": {
     "projectId": "clapastedyke-stage",
     "config": { "debug": true, "googleClientId": "…", "syncPollSeconds": 120 }
   }
   ```

2. **Un environment `stage` en GitHub** con su secret `FIREBASE_SERVICE_ACCOUNT` (pasos 3 y 4), y
   los dos orígenes del proyecto nuevo en el Client ID (paso 5).

Ya está: `Run workflow` escribiendo `stage` despliega.

Detalle completo del diseño (por qué es una caja de texto y no un desplegable, y por qué la
validación va en un job aparte) en [`deploy/firebase/README.md`](../deploy/firebase/README.md).

---

## Desplegar

`Actions → Desplegar en Firebase Hosting → Run workflow`. Se eligen dos cosas:

- **Branch** — de qué rama se compila.
- **Ambiente** — se escribe: `dev`, `prod`, o el que hayas añadido. Da igual mayúsculas o espacios
  de más (`PROD` vale); si el nombre no existe, el job `Validar ambiente` falla **antes de
  compilar** y te lista los que sí.

El workflow:

1. Valida el ambiente y saca su `projectId` de `environments.json`.
2. Compila con `npm run build` (producción, con presupuestos de tamaño).
3. Escribe `dist/misaevol/browser/config.json` con el bloque `config` del ambiente, usando el mismo
   script que `npm run config`.
4. Sube `dist/misaevol/browser` al proyecto de Firebase de ese ambiente.

La URL publicada queda enlazada en la propia ejecución (el recuadro del environment) y en el
resumen del job.

**El flujo normal es desplegar a `dev` primero**, comprobarlo, y luego lanzar el mismo commit a
`prod`. Como el build es determinista y toda la diferencia está en `config.json`, lo que validas en
dev es lo que se publica en prod.

### Cambiar la configuración de un ambiente

- `debug`, `googleClientId`, `syncPollSeconds` → editar su bloque `config` en
  `deploy/firebase/environments.json`, `npm run config` si tocaste `dev`, commitear y **volver a
  desplegar**.
- La cuenta de servicio → cambiar el secret de **ese** environment y **volver a desplegar**.

No hay ningún fichero en un servidor que se pueda editar en caliente: Hosting sirve un artefacto
inmutable. La configuración se aplica en el momento del despliegue, no después.

### Desde local

Para una prueba rápida, con el `projectId` que quieras de `environments.json`:

```bash
npx --yes firebase-tools login                                        # una sola vez
npm run build
node deploy/firebase/config.mjs dev --out dist/misaevol/browser/config.json
npx --yes firebase-tools deploy --only hosting --project migo-dev-20b41
```

Se lanza **desde la raíz del repo**, que es donde está el `firebase.json`, y la línea de
`config.mjs` no se puede saltar: sin ella subes el `public/config.json` del repo, que es el de
`dev`, así que desplegando a otro ambiente publicarías su configuración equivocada.

Por eso mismo, para un despliegue de verdad usa el workflow: ahí ese orden no se puede olvidar.

---

## Qué hay en `firebase.json`, y por qué

Vive en [`firebase.json`](../firebase.json), **en la raíz del repo**, y es **uno solo para todos los
ambientes**: lo que cambia entre ellos es el proyecto de destino y el `config.json`, no cómo se
sirve el sitio.

Es el único fichero del despliegue que no está en `deploy/firebase/`, y no es por gusto: el CLI fija
la raíz del proyecto en el directorio del `firebase.json` y **rechaza cualquier `public` que se
salga de ella**. Con el fichero en `deploy/firebase/`, el deploy muere con
`../../dist/misaevol/browser is outside of project directory`. Detalle en
[`deploy/firebase/README.md`](../deploy/firebase/README.md).

| Clave | Por qué |
|---|---|
| `"public": "dist/misaevol/browser"` | El builder `application` de Angular deja el cliente ahí. Apuntar a `dist/misaevol` publicaría además `3rdpartylicenses.txt` y un `prerendered-routes.json` que no pinta nada |
| `"rewrites"`: `/api/auth/**` → función `auth` | El backend de la sesión, servido como **mismo origen** que la app. Va **antes** del fallback de SPA, que si no se tragaría `/api/auth/token` (no lleva punto). Es lo que permite que la cookie `HttpOnly; SameSite=Lax` viaje — ver [`api.md`](api.md) |
| **No hay fallback de SPA**, y es deliberado | La app enruta **por fragmento** (`withHashLocation`), así que la única ruta de servidor que existe es `/`: recargar `/#/home` no pide nada más. Un `**/!(*.*)` → `/index.html` sería peor que inútil — serviría la app para cualquier ruta inventada, y como el router solo mira el fragmento, esa visita acabaría **en la portada sin un solo error**, dando por buena una URL que no lleva a donde dice. Sin él, una ruta que no existe da 404, que es lo que es |
| `Cache-Control: immutable` en `js/css/woff2` | El build usa `outputHashing: "all"`, así que el nombre cambia con el contenido y cachear un año es seguro |
| `Cache-Control: no-cache` en `/`, `index.html`, `config.json` y `seed/**` | `main.ts` lee `config.json` **antes** de arrancar: si se cachease, un cambio de configuración tardaría en verse. Y el shell **tiene que revalidar siempre**: cubrir solo `/index.html` dejaba `/` con el defecto de Firebase (`max-age=3600`), así que durante una hora tras publicar se servía el `index.html` viejo → el `main-*.js` viejo → chunks que ya no existen. Con el enrutado por hash, `/` es la única entrada, así que basta con esas dos |

---

## Cuando algo falla

| Síntoma | Causa | Arreglo |
|---|---|---|
| `Ambiente 'x' desconocido` | No hay bloque con esa clave en `environments.json` | El error lista los que sí existen |
| `no tiene un projectId real` | Sigue el placeholder `TU-PROJECT-ID-…` | Paso 2 |
| `El environment 'x' no tiene el secret FIREBASE_SERVICE_ACCOUNT` | El secret está en los de repositorio, o en otro environment, o el environment no existe | Paso 4 — tiene que ser un **environment secret** del environment homónimo |
| `Failed to authenticate, have you run firebase login?` | `FIREBASE_SERVICE_ACCOUNT` mal pegado: la ruta en vez del contenido, falta una llave, o se «limpiaron» los `\n` del `private_key`. El mensaje es genérico y tapa la causa — con `--debug` sale la de verdad (`invalid_grant`, `error:1E08010C`…) | Volver a pegar el JSON entero, tal cual |
| `invalid_grant: Invalid grant: account not found` | La cuenta de servicio se borró, o la clave se revocó | Generar una clave nueva (paso 3) |
| `HTTP Error: 403` desplegando el **frontend** | La cuenta de servicio no tiene permiso en ese proyecto | Rol **Firebase Hosting Admin** en IAM (paso 3) |
| `HTTP Error: 403` desplegando el **backend** (`Permission denied to get service …`) | Los roles de hosting no cubren funciones, Cloud Run, Artifact Registry, Secret Manager ni las reglas de Firestore | [`api.md`](api.md) → «Requisitos del proyecto de Firebase», requisito 4 |
| `HTTP Error: 403` desplegando el **backend** (`Secret Manager API has not been used in project …`) | No son permisos: esa API no está habilitada en el proyecto, y el CLI no la enciende él | [`api.md`](api.md) → «Requisitos del proyecto de Firebase», requisito 3 |
| `Failed to get Firebase project …` | El `projectId` no existe o es el nombre en vez del ID | Cópialo de la consola de Firebase |
| El deploy a prod se queda «Waiting» | Está pidiendo aprobación (protección del environment) | Apruébalo desde la propia ejecución en Actions |
| Desplegué a dev y se actualizó prod | El secret está como secret de repositorio, no de environment | Paso 4 |
| El sitio se publica con el `config.json` de otro ambiente | Desplegaste a mano y te saltaste `config.mjs` | Usa el workflow, o repite la secuencia completa de «Desde local» |
| `public/config.json` vuelve a cambiar solo | Es un fichero **generado**; lo reescribe `npm run config` | Edita `environments.json`, no el `config.json` |
| Una ruta da 404 | La URL va **sin `#`** (`/home` en vez de `/#/home`) | No es un fallo del despliegue: esa ruta no existe en el servidor. Todas las rutas de la app llevan hash |
| `Failed to fetch dynamically imported module: …/chunk-XXXX.js` al navegar | La pestaña lleva abierta desde un despliegue anterior: pide un chunk con el hash de aquel build, que la publicación nueva borró | Recargar (`Cmd`/`Ctrl`+`Shift`+`R`). La app se recarga sola desde `platform/stale-build/`; si aun así se repite **después** de recargar, el fallo es otro (sin red, o una publicación a medias) y queda un `error` en consola |
| `… is outside of project directory` | Alguien movió `firebase.json` fuera de la raíz | Tiene que estar en la raíz: el CLI no sirve nada que quede por encima de él |
| `Error 400: origin_mismatch` al conectar Google | Falta ese origen concreto — son **dos por ambiente** | Paso 5 |
| La consola no muestra trazas `[events]` en prod | `debug: false`, que es lo correcto | Los `warn` y `error` se ven siempre; en dev tienes `debug: true` |
