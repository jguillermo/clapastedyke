# `firebase/functions` — el backend del proyecto

Todo el código de servidor vive en **`firebase/functions`**, dentro de la carpeta que publica
Firebase y fuera de `src/`. Es **un paquete npm independiente** de la app Angular: sus propias
dependencias, su propio `tsconfig.json`, su propio ESLint y su propio `npm ci`.

Hoy expone una sola función —`auth`, el cliente confidencial de OAuth que mantiene viva la sesión—,
a la que la app llama por **su URL directa, con CORS**. Su contrato (las tres rutas, los códigos de
error, qué guarda en Firestore) está en [`../firebase/functions/README.md`](../firebase/functions/README.md).

El «por qué existe un backend en un proyecto que nació sin él» está en
[`google-integration.md`](google-integration.md). Esto es el «cómo está organizado y cómo se opera».

## La forma

```
firebase/
├── firebase.json          declara `functions.source = "functions"`
└── functions/             = codebase `default` = el paquete = el despliegue
    ├── .env               NO versionado, con los VALORES de verdad
    ├── .env.example       versionado: documenta las dos claves, sin ningún valor
    ├── package.json       dependencias, `lint`, `build`, `test`; `main: "lib/index.js"`
    ├── tsconfig.json      rootDir `src`, outDir `lib`; excluye los `*.test.ts`
    ├── tsconfig.test.json los tests, aparte, a `lib-test/` (no viajan al despliegue)
    ├── eslint.config.mjs  su ESLint, en flat — NO es el de la app, y TIENE que existir (ver abajo)
    ├── README.md          el contrato de la función y cómo operarla
    └── src/
        ├── index.ts       el punto de entrada: `export const auth = onRequest(…)`
        └── auth/          un fichero por responsabilidad (router, cors, cookies, oauth, sesiones…)
```

| | |
|---|---|
| Sus dependencias | su propio `package.json` y su propio `package-lock.json` |
| Su compilación | su propio `tsconfig.json` (`tsc` → `lib/`) |
| Su lint | su propio `eslint.config.mjs`, ejecutado por su `npm run lint` |
| Su despliegue | `cd firebase && firebase deploy` desde una máquina que tenga el `.env` |
| Su ruta | Su **URL directa** (`https://<region>-<projectId>.cloudfunctions.net/auth`), con CORS |

> **`module`/`moduleResolution` son `NodeNext`, no `commonjs`/`node`.** TypeScript 6 deprecó la
> resolución `node10` (`TS5107`). Como el `package.json` no declara `"type": "module"`, `NodeNext`
> sigue emitiendo **CommonJS** —lo que espera el runtime de Cloud Functions— pero resuelve los
> paquetes por su mapa de `exports`, que es como publican `firebase-functions` y `firebase-admin`.

### Un codebase, no uno por función

`firebase.json` declara `functions` como un array de codebases, pero hoy hay **uno**
(`source: "functions"`, `codebase: "default"`). Añadir una función es **exportar otro símbolo desde
`src/index.ts`**, no crear otra carpeta:

```typescript
export const auth = onRequest(…);      // el servicio de sesión
export const informes = onRequest(…);  // otra función, otro export
```

Las funciones de un mismo codebase se despliegan juntas y comparten `package.json`. Si alguna vez una
necesita desplegarse por separado —o una dependencia pesada que las demás no usan—, entonces sí se
parte en otro codebase con su propia carpeta hermana de `functions/`, y se añade su entrada al array.
Mientras no haga falta, un solo paquete es menos que mantener.

> **Esto cambió.** Antes el backend era `api/`, con **una carpeta por función**, código compartido en
> `api/_common/` y un codebase por carpeta. Se reemplazó por la estructura estándar de
> `firebase init`. Si buscas `api/auth`, `api/_common` o `deploy/`, están en el historial de git
> (hasta el commit `63eef49`).

### El aislamiento con la app Angular es real y está atado

`firebase/functions` no comparte **nada** con la app: ni `node_modules`, ni tsconfig, ni ESLint, ni
Prettier. Está atado en tres sitios, y los tres son a propósito:

| Fichero | Qué hace |
|---|---|
| `eslint.config.mjs` (raíz) | ignora `firebase/functions/**` — la config de Angular no aplica a un backend de Node |
| `.prettierignore` | ignora `firebase/functions/` — su ESLint usa comillas dobles y se pelearía con el Prettier del repo |
| `.gitignore` | ignora `firebase/functions/lib/` (la salida de `tsc`) y `firebase/functions/.env.*` |

Por eso el job `functions` del CI **no** usa `./.github/actions/setup` (que instala las dependencias
de Angular): monta su propio Node y hace su propio `npm ci`.

> ### CRITICAL: la función necesita su propio flat config, y no es opcional
>
> `firebase init` deja un `.eslintrc.js` con `root: true` y el script `eslint --ext .js,.ts .`. Eso
> vale en un repositorio suelto y **aquí no**: esta carpeta cuelga de un repo que ya tiene su flat
> config en la raíz, y ESLint **sube directorios** buscando uno. Encuentra el de la raíz, se pone en
> modo flat, y en modo flat `--ext` no existe → `Invalid option '--ext'`. El `root: true` no protege:
> es un mecanismo de eslintrc y el descubrimiento de flat config lo ignora.
>
> No es un fallo cosmético de lint: ese script es el primer `predeploy` de `firebase.json`, así que
> **tumba el despliegue entero** antes de subir nada.
>
> Se arregla dándole a la función su propio `eslint.config.mjs` (la búsqueda para ahí) y usando
> `eslint .` sin `--ext`. **Si algún día `firebase init` vuelve a dejar un `.eslintrc.js`, hay que
> volver a hacer esto.**

## Añadir una función

1. `export const <nombre> = onRequest(…)` en `firebase/functions/src/index.ts`.
2. Si la llama el navegador, su **URL directa** y su **CORS**: la función tiene que reflejar el origen
   y contestar el preflight, como hace `auth` (ver `src/auth/router.ts`). Y la app necesita saber esa
   URL, que lleva dentro el proyecto y la región — o sea, una clave más en `public/config.json`, como
   `authApiUrl`. **Hosting no se toca**: no hay rewrites que añadir.
3. Si necesita un parámetro, una línea más en `.env` (el valor) **y en `.env.example`** (la clave
   documentada, sin valor), y se lee con `process.env` dentro del manejador. **También si es un
   secreto**: no se usa `defineSecret`, porque metería Secret Manager y Service Usage en el camino de
   publicar (ver más abajo, requisito 3).

**Nada más.** Ningún workflow lleva una lista de funciones que haya que actualizar: el deploy publica
el codebase entero.

> ⚠️ **`.env` no se versiona**, así que quien añada un parámetro tiene que avisar a quien despliegue:
> su fichero es el único sitio donde ese valor va a existir. `.env.example` es lo que hace visible el
> cambio en el diff.

## Un fichero por responsabilidad, no uno por ruta

`auth` son cinco ficheros bajo `src/auth/`, y ese reparto es la referencia para la siguiente función:

| Fichero | Qué contiene |
|---|---|
| `router.ts` | Enrutado, CORS y preflight; el último recinto de los fallos |
| `routes.ts` | Las tres operaciones (`login`, `refresh`, `logout`), juntas |
| `google.ts` | El diálogo con el proveedor externo |
| `sessions.ts` | Lo que se persiste y cómo se identifica quien pregunta |
| `http.ts` | Tipos de petición/respuesta, configuración del `.env` y forma del payload |

**Una ruta no es un fichero.** Las tres de `auth` ocupan 132 líneas entre las tres; separarlas
obligaba a un bloque de imports por cada una y no hacía más fácil leer ninguna.

## Desarrollo local

```bash
npm run emulators       # compila la función y arranca functions + firestore
npm start               # ng serve, en otra terminal
```

**No hay proxy, y ya no hace falta.** La app llama al emulador por su URL directa, que se le dice en
la clave `authApiUrl` de tu `public/config.json` local:

```jsonc
{ "authApiUrl": "http://127.0.0.1:5001/<projectId>/us-central1/auth" }
```

`http://` solo se acepta sobre `localhost` o `127.0.0.1`; en cualquier otro sitio la app exige
`https:`. Es lo que evita publicar por error una configuración con la que la cookie `Secure` nunca
podría guardarse. (Antes había un `firebase/proxy.config.json` referenciado desde `angular.json`,
porque la cookie `SameSite=Lax` de entonces exigía mismo origen; hoy la cookie es `SameSite=None` y
tiene además el respaldo del `session_token`, así que esa línea se quitó de `angular.json`.)

Los valores de verdad van en `firebase/functions/.env`, que está en el `.gitignore` y **no lo escribe
ningún script**: se copian a mano del JSON del cliente (`cp .env.example .env`). Sin ellos, el
emulador arranca igual y las rutas contestan 500 con «La función auth no está configurada».

**Hay un solo `firebase.json`**, con la sección `emulators` dentro. El emulador ejecuta el mismo
`functions/` que se despliega, con su `lib/` recién compilado. (Antes había un
`firebase.emulators.json` aparte porque el despliegue apuntaba a un artefacto copiado en `deploy/dist`
y el emulador al fuente; ahora los dos apuntan al mismo sitio.)

Atajos sueltos, si no quieres arrancar el emulador entero:

```bash
npm run fn:install      # npm ci dentro de firebase/functions
npm run fn:lint         # su ESLint
npm run fn:build        # su tsc
```

## Despliegue: a mano, desde una máquina que tenga el `.env`

> ### ⚠️ Hoy NO hay workflow que despliegue la función
>
> `.github/workflows/` solo tiene `deploy-hosting.yml`, que usa `action-hosting-deploy` y **publica
> únicamente Hosting**: no toca `functions` ni `firestore`. El `deploy.yml` que este capítulo describía
> se borró en el commit `bb69986`.
>
> Y no puede volver tal cual: **el `.env` ya no se versiona con marcadores**, así que un runner de
> GitHub no tiene de dónde sacar el `client_secret`. Publicar la función es, hoy, un comando a mano.

```bash
cd firebase && npx firebase-tools@latest deploy --project <projectId>
```

`firebase deploy` sin `--only` despliega los tres targets del `firebase.json` —`firestore`,
`functions` y `hosting`— de una vez. Siempre con `cd firebase`: allí está el `firebase.json` y de él
cuelgan todas sus rutas.

Las reglas de Firestore viajan en el mismo deploy, y ahí es donde deben estar: protegen exactamente
lo que guarda el backend. Viven en
[`firebase/firestore.rules`](../firebase/firestore.rules), con el resto del despliegue.

> **Antes eran dos workflows** (`deploy-frontend.yml` y `deploy-backend.yml`) porque el backend vivía
> en `api/`, con una carpeta y un *codebase* por función: publicar una no debía tocar las demás, y
> había que acordarse de lanzar el backend **antes** que el frontend (la app le pedía un token en
> cuanto arrancaba). Con un paquete único eso dejó de aplicar. Ese orden sigue importando, eso sí:
> publicar el frontend con una `authApiUrl` que apunta a una función que todavía no existe deja a
> todo el mundo sin poder conectar.

**El paquete se instala en el runner, pero no se compila ahí.** El `npm ci` de `functions/` hace
falta porque los `predeploy` de `firebase.json` son `npm --prefix … run lint/build` y corren **dentro
del propio `firebase deploy`**. Compilarla antes a mano sería repetir ese trabajo.

**No hay comando local equivalente, y es deliberado**: el repositorio no tiene scripts de despliegue,
así que publicar es lanzar el workflow. El CLI de Firebase se invoca solo desde ahí, siempre con
`cd firebase`: en esa carpeta está `firebase.json`, y sus `source` y `public` son relativos a ella.

Es `workflow_dispatch`: no hay despliegue automático a propósito (ver
[`firebase-deploy.md`](firebase-deploy.md)).

> ### Una salvaguarda que conviene conocer
>
> Antes de desplegar, el workflow comprueba que `functions/lib/index.js` **exporta algo**. Un codebase
> que no exporta ninguna función no es un deploy vacío inofensivo: Firebase lo interpreta como «borra
> todas las funciones de este codebase». `--non-interactive` lo frena pidiendo `--force`, pero el
> workflow lo para antes, con un mensaje que dice qué pasa.

## Requisitos del proyecto de Firebase

Cinco cosas, y las cinco son de **una sola vez por ambiente**. Ninguna la crea el workflow: si falta
alguna, el despliegue muere con un 403 o con un error de configuración, no con un mensaje que diga
«te falta esto».

> **Que el frontend despliegue bien no dice nada del backend.** Publicar el frontend solo necesita
> Hosting; el backend necesita las cinco. Si el deploy sube la app y falla al llegar a la función,
> el problema está en esta lista, no en el código ni en el workflow.

### No hay atajo: los cinco son a mano

Antes había un script que los montaba. Ya no: el único script del repositorio es
[`create-google-client-id.sh`](../create-google-client-id.sh), en la raíz, que da de alta el
**cliente de Google** y nada más. La infraestructura del proyecto de Firebase se monta una vez por
ambiente, con los comandos de aquí abajo.

Montar un ambiente entero son tres cosas independientes:

```
1. ./create-google-client-id.sh          el cliente de Google → te enseña su JSON
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
   # La región TIENE que ser la de `firestore.location` en firebase/firebase.json (hoy nam5)
   gcloud firestore databases create --location=nam5 --project <projectId>   # si no hay ninguna
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
   el `.env` de la función.
6. **Esperar 2–3 minutos** a que propaguen las APIs y los roles.
7. **Relanzar el workflow de despliegue.**

### 1 · Plan Blaze

Cloud Functions lo exige. A este volumen el coste es prácticamente cero, pero hace falta una cuenta
de facturación asociada al proyecto.

### 2 · La base de datos de Firestore, creada

**Habilitar la API no crea la base.** Son dos cosas distintas, y desplegar `firestore:rules` contra
un proyecto sin base de datos falla. Se comprueba y se crea una sola vez:

```bash
gcloud firestore databases list --project <projectId>
gcloud firestore databases create --location=nam5 --project <projectId>   # si no hay ninguna
```

O desde la consola de Firebase: **Compilación → Firestore Database → Crear base de datos**, en modo
producción (las reglas de
[`firebase/firestore.rules`](../firebase/firestore.rules) las sobrescriben en el primer
despliegue de todas formas).

> ### CRITICAL: la región tiene que coincidir, y no se puede cambiar después
>
> `firebase/firebase.json` declara `"firestore": { "location": "nam5" }`. **Crea la base en esa
> misma región.** La ubicación de una base de Firestore es **permanente**: para cambiarla hay que
> borrar la base entera y volver a crearla, con lo que haya dentro. Si prefieres otra región,
> cámbiala en `firebase.json` **antes** de crear nada.

> ### Por qué el despliegue intenta CREARLA (y falla con 403)
>
> Esa clave `location` es justo lo que hace que `firebase deploy` intente aprovisionar la base si no
> existe: en el log sale `firestore: Creating the new Firestore database (default)...` seguido de
> `HTTP Error: 403, The caller does not have permission`. La cuenta de servicio de despliegue no
> puede —ni debe— crear bases de datos: **el pipeline publica, no aprovisiona**. Créala tú una vez y
> el deploy pasa a limitarse a subir las reglas y los índices.

> ⚠️ **`firebase/firestore.rules` sigue siendo el fichero abierto que dejó `firebase init`**
> (`allow read, write: if request.time < timestamp.date(2026, 9, 28)`). Es una regla de arranque con
> fecha de caducidad, no una regla de producción: hay que escribir las de verdad antes de que expire,
> o todas las lecturas y escrituras empezarán a rechazarse.

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
> entorno en el `.env`, no con `defineSecret`. Mientras lo hacía, publicar la función dependía además
> de `secretmanager.googleapis.com` y de `serviceusage.googleapis.com`, y un 403 en cualquiera de las
> dos tiraba un despliegue que no las necesitaba para nada.

**Habilitar tarda un par de minutos en propagarse.** Si relanzas el workflow al instante, puede
repetir el mismo 403.

### CRITICAL: 4 · Los roles de la cuenta de servicio — los del backend NO son los del frontend

La cuenta de servicio es la misma (el secret `FIREBASE_SERVICE_ACCOUNT` del *environment* de GitHub,
[`firebase-deploy.md`](firebase-deploy.md) paso 3), pero **lo que necesita poder hacer no lo es**.
Publicar el frontend es subir ficheros a Hosting; publicar el backend es compilar una imagen,
subirla a un registro, crear un servicio de Cloud Run y escribir las reglas de Firestore. Son media
docena de APIs distintas.

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

### 5 · El cliente de OAuth, en el `.env` de quien despliega

La función `auth` no arranca sin él. Se copia a mano del JSON del cliente que descarga Google Cloud
Console, a `firebase/functions/.env`, que **no se versiona**:

```bash
cp firebase/functions/.env.example firebase/functions/.env
# y dentro: web.client_id → GOOGLE_OAUTH_CLIENT_ID, web.client_secret → GOOGLE_OAUTH_CLIENT_SECRET
```

**Las dos mitades salen del mismo cliente**, y eso no es comodidad: es lo que impide emparejar el
`client_id` de uno con el `client_secret` de otro, que es lo que Google rechaza con un
`invalid_client` sin explicar nada.

> ⚠️ **Consecuencia:** solo puede desplegar la función quien tenga ese fichero. No hay ningún
> pipeline que lo rellene, y el repositorio no contiene ni un valor. El detalle está en
> [`../firebase/functions/README.md`](../firebase/functions/README.md) → «Configuración».

## Cuando el despliegue del backend falla

| Síntoma | Causa | Arreglo |
|---|---|---|
| `403 … Permission denied to get service [cloudfunctions.googleapis.com]` (o `run`, `artifactregistry`, `firestore`…) al empezar el deploy | La cuenta de servicio no tiene `serviceusage.serviceUsageAdmin`: el CLI ni siquiera puede mirar si las APIs están encendidas | Requisito 4 — concede **todos** los roles, no solo ese |
| `403` más adelante, ya subiendo o compilando | Falta uno de los otros roles | Requisito 4 |
| `NOT_FOUND … database (default)` al desplegar las reglas | La API de Firestore está habilitada pero **la base no existe** | Requisito 2 |
| `Billing account … required` / `Your project must be on the Blaze plan` | Proyecto en Spark | Requisito 1 |
| `Al environment '<amb>' le falta: secret:GOOGLE_OAUTH_CLIENT` | El *environment* de GitHub no declara el cliente | Requisito 5 |
| El deploy se planta pidiendo `--force` para borrar funciones | `src/index.ts` no exporta lo que sí está publicado en el proyecto | `--non-interactive` te está evitando borrarlas sin querer. Revisa qué exporta antes de forzar nada |
| La función responde 500 con «La función auth no está configurada» | Está desplegada, pero el `.env` no viajó (o llegó vacío) | Requisito 5 |
| `El secret GOOGLE_OAUTH_CLIENT no trae .web.client_secret` | El secret está, pero no es el JSON completo del cliente | [`firebase/README.md`](../firebase/README.md) → «El fichero del cliente» |
| La app dice que no puede conectar y en la consola hay un error de red sin código | La petición murió en el CORS, o `authApiUrl` apunta a otro sitio | Mira la respuesta del `OPTIONS` en la pestaña de red; comprueba `authApiUrl` en el `config.json` publicado |
| `POST <authApiUrl>/refresh` da **404** | La función no está desplegada, o la URL no es la suya | `firebase deploy`; la URL correcta sale en la salida del deploy |

Los fallos de **autenticación** (el JSON del secret mal pegado, la clave revocada) son comunes a los
dos mitades del despliegue y están en la tabla de [`firebase-deploy.md`](firebase-deploy.md).
