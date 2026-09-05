# Despliegue en Firebase Hosting

La app se publica en **Firebase Hosting** con un workflow **manual**
([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)). No hay
despliegue automático: mergear a `main` no publica nada. Publicar es una decisión que se toma
eligiendo un ambiente y pulsando un botón.

> **Este documento es el frontend.** El backend (`firebase/functions`) sale por el **mismo** workflow
> —`firebase deploy` publica los tres targets de una vez— y su procedimiento está en
> [`functions.md`](functions.md). **No se elige qué se publica: siempre va todo**, que es lo que
> impide que la app y la función que le sirve `/api/auth/**` queden desparejadas.

Un **ambiente** es un **proyecto de Firebase independiente** bajo la misma cuenta de Google: no
comparten hosting, ni cuota, ni credenciales. Hoy hay dos, `dev` y `prod`, pero **el número no está
fijado en ningún sitio** — los ambientes son datos, y añadir `stage`, `lab` o `qa` no toca el
workflow. Ver [«Añadir un ambiente»](#añadir-un-ambiente).

> **`firebase init` genera dos workflows de despliegue automático** (`firebase-hosting-merge.yml` y
> `firebase-hosting-pull-request.yml`). **Se borraron**, y si vuelve a generarlos se borran otra
> vez: publican sin sustituir los marcadores, llevan el `projectId` escrito a mano y convierten
> mergear en publicar — justo lo que este diseño evita.

> **Antes se desplegaba en GitHub Pages.** Ya no: el workflow `deploy-demo.yml` se borró, y con él
> el `--base-href /clapastedyke/` y el `404.html` que hacían falta allí. Si el sitio antiguo sigue
> vivo, se apaga en `Settings → Pages → Source: None`.

---

## Dónde vive cada valor

Esta es la pregunta importante, y la respuesta es corta: **la lista de ambientes no está en el
repositorio** —es la de `Settings → Environments`— y lo secreto tampoco. Nada de configuración vive
dentro del workflow.

| Sitio | Qué contiene | Secreto |
|---|---|---|
| **Environments de GitHub**, uno por ambiente | Los secrets `GOOGLE_OAUTH_CLIENT` (el JSON del cliente de Google, entero) y `FIREBASE_SERVICE_ACCOUNT`. **Ninguna variable** | Sí, los dos |
| `public/config.json` y `firebase/functions/.env` | **Marcadores**, versionados: `GOOGLE_OAUTH_CLIENT_ID`, `"DEBUG"`. El pipeline los sustituye en el artefacto | No |

En el repositorio **no hay ningún valor de ambiente**: hay marcadores. La forma de los marcadores y
cómo se sustituyen está documentada junto a los ficheros, en
[`firebase/README.md`](../firebase/README.md). No se repite aquí para que no puedan contradecirse.

El nombre del ambiente es la bisagra: **lo que se teclea al lanzar el workflow y el nombre del
*environment* de GitHub tienen que ser el mismo, en minúsculas.** Eso es lo que hace que `secrets.*` resuelva a
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
correr `firebase init`; **sáltate esos pasos** — el `firebase.json` ya está en `firebase/`, y
`firebase init` lo sobrescribiría y volvería a generar los dos workflows de despliegue automático
que este proyecto no usa.

Anota el **Project ID** (el identificador con guiones que sale bajo el nombre, no el nombre bonito;
Firebase a veces le añade un sufijo aleatorio).

### Paso 2 · Declararlo en su *environment* de GitHub

`Settings → Environments → New environment`, con **el nombre del ambiente en minúsculas**. Dentro:

| | Nombre | Valor |
|---|---|---|
| secret | `GOOGLE_OAUTH_CLIENT` | el JSON del cliente de Google, entero (paso 5) |
| secret | `FIREBASE_SERVICE_ACCOUNT` | la clave de la cuenta de servicio (pasos 3 y 4) |

**Y no hay variables.** El Project ID del paso 1 no se declara en ninguna parte: los workflows lo
leen del `project_id` que trae la propia cuenta de servicio, así que es imposible desplegar en un
proyecto distinto del de las credenciales con las que se despliega. Y `debug` es un **input** del
workflow del frontend: se marca al lanzarlo.

**No hay nada que commitear**: un ambiente nuevo no toca ni un fichero del repositorio. Si falta
cualquiera de los dos secrets, el primer paso del workflow se para y dice exactamente cuál.

### Paso 3 · Una cuenta de servicio por proyecto

GitHub Actions no puede abrir un navegador para iniciar sesión, así que despliega con una **cuenta
de servicio**: un usuario de máquina con su propia clave.

> **Los ocho roles de una vez.** La lista está en [`functions.md`](functions.md) → requisito 4, con el bucle
> `for ROLE in …` listo para pegar. Concédelos todos: cada uno que falte es otro despliegue fallido
> de veinte minutos, y el 403 que sale no dice cuál es.

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
> misma, pero desplegar el backend compila una imagen, crea un servicio de Cloud Run y
> escribe las reglas de Firestore: son media docena de APIs más, y la cuenta recién generada aquí no
> tiene permiso ni para consultar si están habilitadas (`403 Permission denied to get service …`).
> La lista completa de roles del backend está en [`functions.md`](functions.md) → «Requisitos del proyecto de
> Firebase». Si este ambiente va a servir la API, concédelos **ahora**, en la misma visita a IAM.

### Paso 4 · El *environment* de GitHub y su secret

Aquí es donde se separan de verdad los ambientes.

En `Settings → Environments → New environment`, crea uno con **exactamente la misma clave** que en
ambiente, en minúsculas: `dev`, `prod`, …

Dentro de **cada** environment, `Add environment secret`. Son dos:

| Secret | Valor | Quién lo usa |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | El **contenido íntegro** del JSON del paso 3 — ábrelo con un editor y pega todo, desde la `{` hasta la `}`. **Uno distinto por ambiente**: cada JSON abre su proyecto | El workflow de despliegue |
| `GOOGLE_OAUTH_CLIENT` | El **fichero de cliente de Google entero**, tal cual lo descarga la consola ([`firebase/README.md`](../firebase/README.md)) | Las dos mitades: el build le saca el `client_id`; el backend, además, el `client_secret` para el `.env` de la función |

Los dos se pegan a mano: el JSON de la cuenta de servicio del paso 3, y el JSON del cliente que te
enseña [`create-google-client-id.sh`](../create-google-client-id.sh). Que estén aquí y no en
la máquina de nadie es lo que permite **montar un ambiente eligiéndolo en Actions**.

Dos avisos sobre ese pegado, que son los fallos habituales: no es la **ruta** al fichero, es su
contenido; y **no le quites los `\n`** del `private_key`, que son los que permiten firmar el JWT.

⚠️ **No lo pongas en `Settings → Secrets → Actions` (los de repositorio)**: ahí sería compartido por
todos los ambientes y desplegar a dev publicaría con las credenciales de prod. Tiene que ser un
**environment secret**, dentro de su environment.

> **El Client ID de OAuth no está aquí, y es deliberado**: no es una credencial. Vive en
> las variables del environment (paso 2).

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
[`firebase/README.md`](../firebase/README.md)** — es el único sitio con ese procedimiento.

Esos **mismos dos dominios** van además en `ALLOWED_ORIGINS`, dentro de
[`firebase/functions/.env`](../firebase/functions/.env.example): son dos listas distintas y las dos
tienen que estar. La de Google decide desde dónde se puede pedir el consentimiento; la de la función
decide a quién le contesta el servicio de sesión. Si falta la segunda, conectar funciona pero
**recargar deja la app «sin conexión» para siempre**, y la única pista es un `warn` con `origen no
autorizado` en el registro de la función.

### Paso 6 · Política TTL de las sesiones (recomendado)

La función marca cada sesión con `expiresAt` y borra la que encuentra caducada al leerla, pero
**Firestore no borra nada por su cuenta**: las sesiones de quien nunca vuelve se quedan ahí. Una
política TTL las retira sola.

```bash
gcloud firestore fields ttls update expiresAt \
  --collection-group=sessions --enable-ttl --project=<projectId>
```

También se puede activar desde la consola de Firestore, en **Time-to-live**, sobre el grupo de
colecciones `sessions` y el campo `expiresAt`.

No es imprescindible —una sesión caducada no autoriza nada, porque `readGrant` la rechaza y la
borra—, así que esto es higiene de almacenamiento, no seguridad. El plazo es de **inactividad**: cada
`/refresh` empuja `expiresAt` otros 180 días.

---

## Añadir un ambiente

Dos pasos, y **el workflow no se toca**. El nombre del ambiente que escribes al lanzarlo se valida
contra el *environment* de GitHub, así que la lista de ambientes que existen es literalmente la de
`Settings → Environments`.

1. **Un proyecto de Firebase** para `stage`, con Hosting activado y los cinco requisitos de
   [`functions.md`](functions.md) (pasos 1 y 2).

2. **Un environment `stage` en GitHub** con sus dos secrets —`FIREBASE_SERVICE_ACCOUNT` y
   `GOOGLE_OAUTH_CLIENT`— (pasos 3 y 4), y los dos orígenes del proyecto nuevo dados de alta en el
   cliente de Google (paso 5).

**No se toca ni un fichero del repositorio.**

Ya está: `Run workflow` escribiendo `stage` despliega.

Detalle completo del diseño (por qué es una caja de texto y no un desplegable, y por qué la
validación va en un job aparte) en [`firebase/README.md`](../firebase/README.md).

---

## Desplegar

`Actions → Desplegar (Firebase) → Run workflow`. Se eligen tres cosas:

- **Branch** — de qué rama se compila.
- **Ambiente** — se escribe: `dev`, `prod`, o el que hayas añadido.
- **Debug** — si se ve el detalle del flujo en la consola del navegador.

Sobre el ambiente: Da igual mayúsculas o espacios
  de más (`PROD` vale); si el nombre no existe, el primer paso del job —«Comprobar el
  environment»— falla **antes de compilar** diciendo qué secret falta.

El workflow:

1. Comprueba que el *environment* tiene sus dos secrets y deduce el proyecto de la cuenta de
   servicio, antes de compilar nada.
2. Compila con `npm run build` (producción, con presupuestos de tamaño). **Escribe directamente en
   `firebase/public`**, que es la carpeta que Hosting publica. El artefacto sale con los
   **marcadores** dentro: es el mismo para todos los ambientes.
3. **Sustituye los marcadores** en `firebase/public/config.json` con el `client_id` del secret y
   el input `debug`, y falla si alguno sobrevive.
4. Instala las dependencias de la función y sustituye los marcadores de su `.env`.
5. Publica con **`firebase deploy`**, desde `firebase/`. Sin `--only`: sube los tres targets del
   `firebase.json` —firestore, functions y hosting— en una sola ejecución.

La URL publicada queda enlazada en la propia ejecución (el recuadro del environment) y en el
resumen del job.

**El flujo normal es desplegar a `dev` primero**, comprobarlo, y luego lanzar el mismo commit a
`prod`. Como el build es determinista y toda la diferencia está en `config.json`, lo que validas en
dev es lo que se publica en prod.

### Cambiar la configuración de un ambiente

- `debug` → marcar la casilla **debug** al lanzar el workflow del frontend. No es configuración del
  environment: se elige en cada publicación.
- El **cliente de Google** → cambiar el secret `GOOGLE_OAUTH_CLIENT` de **ese** environment (el JSON
  entero) y **volver a desplegar**.
- `syncPollSeconds` → es el mismo en todos los ambientes: se edita `public/config.json` y se
  commitea.

Los dos primeros **no tocan el repositorio**: son configuración del environment, no del código.
- La cuenta de servicio → cambiar el secret de **ese** environment y **volver a desplegar**.

No hay ningún fichero en un servidor que se pueda editar en caliente: Hosting sirve un artefacto
inmutable. La configuración se aplica en el momento del despliegue, no después.

### Desde local

Para una prueba rápida, reproduciendo lo que hace el workflow:

```bash
npx --yes firebase-tools login          # una sola vez
npm run build
sed -i '' "s|GOOGLE_OAUTH_CLIENT_ID|<el client_id>|g" firebase/public/config.json
sed -i '' 's|"DEBUG"|true|g'            firebase/public/config.json
cd firebase && npx --yes firebase-tools deploy --only hosting --project <projectId>
```

(En el runner es `sed -i`; el `''` es cosa del sed de macOS.) **Ojo**: aquí no hay nada que compruebe
que sustituiste bien — el workflow sí lo hace, y por eso para un despliegue de verdad se usa Actions.

---

## Qué hay en `firebase.json`, y por qué

Vive en [`firebase/firebase.json`](../firebase/firebase.json) y es **uno solo para todos los ambientes**:
lo que cambia entre ellos es el proyecto de destino y el `config.json`, no cómo se sirve el sitio.

Que pueda estar ahí es consecuencia de que **`ng build` compile dentro de `firebase/public`**. El CLI
fija la raíz del proyecto en el directorio de su `firebase.json` y **rechaza cualquier `public` que
se salga de ella**: mientras la salida era `dist/misaevol/browser`, el fichero tenía que vivir en la
raíz del repo. Ahora todas las rutas (`public`, `functions`, `firestore.rules`) quedan dentro de
`firebase/`, y por eso Firebase no aparece en ningún otro sitio del repositorio. Los workflows hacen
`cd firebase` en vez de usar `--config`, para que el CLI no tenga margen de deducir otra raíz.
Detalle en [`firebase/README.md`](../firebase/README.md).

| Clave | Por qué |
|---|---|
| `"public": "public"` (o sea `firebase/public`) | Es **el mismo sitio** donde `angular.json` deja el build (`outputPath: "firebase/public"`). No hay copia intermedia: compilar es preparar el deploy. Apuntar a `dist/misaevol` publicaría además `3rdpartylicenses.txt` y un `prerendered-routes.json` que no pinta nada |
| **No hay ningún `rewrites`**, y es deliberado | La app llama a la función por su **URL directa**, con CORS: esa dirección lleva dentro el proyecto y la región, así que vive en `authApiUrl` del `config.json` y no en una ruta de Hosting (ver [`functions.md`](functions.md) y `firebase/functions/README.md`). Hubo un `/api/auth/**` cuando el backend se servía como mismo origen; ya no existe. Y el `"source": "**"` que mete `firebase init` **no debe volver**: ver la fila siguiente |
| **No hay fallback de SPA**, y es deliberado | La app enruta **por fragmento** (`withHashLocation`), así que la única ruta de servidor que existe es `/`: recargar `/#/home` no pide nada más. Un `**/!(*.*)` → `/index.html` sería peor que inútil — serviría la app para cualquier ruta inventada, y como el router solo mira el fragmento, esa visita acabaría **en la portada sin un solo error**, dando por buena una URL que no lleva a donde dice. Sin él, una ruta que no existe da 404, que es lo que es |
| `Cache-Control: immutable` en `js/css/woff2` | El build usa `outputHashing: "all"`, así que el nombre cambia con el contenido y cachear un año es seguro |
| `Cache-Control: no-cache` en `/`, `index.html`, `config.json` y `seed/**` | `main.ts` lee `config.json` **antes** de arrancar: si se cachease, un cambio de configuración tardaría en verse. Y el shell **tiene que revalidar siempre**: cubrir solo `/index.html` dejaba `/` con el defecto de Firebase (`max-age=3600`), así que durante una hora tras publicar se servía el `index.html` viejo → el `main-*.js` viejo → chunks que ya no existen. Con el enrutado por hash, `/` es la única entrada, así que basta con esas dos |

---

## Cuando algo falla

| Síntoma | Causa | Arreglo |
|---|---|---|
| `Al environment 'x' le falta: secret:… ` | Ese *environment* de GitHub no existe, o está vacío (una errata lo crea al vuelo) | `Settings → Environments`: créalo con sus dos secrets |
| `no tiene un projectId real` | Sigue el placeholder `TU-PROJECT-ID-…` | Paso 2 |
| `El environment 'x' no tiene el secret FIREBASE_SERVICE_ACCOUNT` | El secret está en los de repositorio, o en otro environment, o el environment no existe | Paso 4 — tiene que ser un **environment secret** del environment homónimo |
| `Failed to authenticate, have you run firebase login?` | `FIREBASE_SERVICE_ACCOUNT` mal pegado: la ruta en vez del contenido, falta una llave, o se «limpiaron» los `\n` del `private_key`. El mensaje es genérico y tapa la causa — con `--debug` sale la de verdad (`invalid_grant`, `error:1E08010C`…) | Volver a pegar el JSON entero, tal cual |
| `invalid_grant: Invalid grant: account not found` | La cuenta de servicio se borró, o la clave se revocó | Generar una clave nueva (paso 3) |
| `HTTP Error: 403` desplegando el **frontend** | La cuenta de servicio no tiene permiso en ese proyecto | Rol **Firebase Hosting Admin** en IAM (paso 3) |
| `HTTP Error: 403` desplegando el **backend** (`Permission denied to get service …`) | Los roles de hosting no cubren funciones, Cloud Run, Artifact Registry ni las reglas de Firestore | [`functions.md`](functions.md) → «Requisitos del proyecto de Firebase», requisito 4 |
| `Failed to get Firebase project …` | El `projectId` no existe o es el nombre en vez del ID | Cópialo de la consola de Firebase |
| El deploy a prod se queda «Waiting» | Está pidiendo aprobación (protección del environment) | Apruébalo desde la propia ejecución en Actions |
| Desplegué a dev y se actualizó prod | El secret está como secret de repositorio, no de environment | Paso 4 |
| El sitio se publica con un marcador dentro | No debería poder pasar: el workflow falla si alguno sobrevive | Mira el paso «Sustituir los marcadores» de la ejecución |
| En local, conectar con Google dice «Falta el identificador de cliente» | Correcto: el `config.json` versionado lleva el marcador y la app lo ignora | Ver `firebase/README.md` → «Si de verdad necesitas probar el login en local» |
| Una ruta da 404 | La URL va **sin `#`** (`/home` en vez de `/#/home`) | No es un fallo del despliegue: esa ruta no existe en el servidor. Todas las rutas de la app llevan hash |
| `Failed to fetch dynamically imported module: …/chunk-XXXX.js` al navegar | La pestaña lleva abierta desde un despliegue anterior: pide un chunk con el hash de aquel build, que la publicación nueva borró | Recargar (`Cmd`/`Ctrl`+`Shift`+`R`). La app se recarga sola desde `platform/stale-build/`; si aun así se repite **después** de recargar, el fallo es otro (sin red, o una publicación a medias) y queda un `error` en consola |
| `… is outside of project directory` | Se invocó el CLI desde otro sitio, o una ruta de `firebase.json` salió de `firebase/` | Haz `cd firebase` antes: todas las rutas del fichero son relativas a esa carpeta |
| `Error 400: origin_mismatch` al conectar Google | Falta ese origen concreto — son **dos por ambiente** | Paso 5 |
| La consola no muestra trazas `[events]` en prod | `debug: false`, que es lo correcto | Los `warn` y `error` se ven siempre; en dev tienes `debug: true` |
