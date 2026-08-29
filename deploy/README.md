# `deploy/` — la configuración y la publicación

**Fuera de esta carpeta nadie nombra Firebase.** Ni un `projectId`, ni una región, ni el CLI.

Y **aquí dentro no hay lógica de despliegue**: hay *configuración*. La ejecución —compilar,
sustituir, publicar— vive entera en los dos workflows de `.github/workflows/`. En esta carpeta solo
queda un script, y no despliega nada: da de alta el cliente de Google.

```
deploy/
├── create-google-client-id.sh    el ÚNICO script; no despliega, no escribe nada
├── environments.example.json     EJEMPLO. Nadie lo lee. Qué configura un ambiente, de un vistazo
├── firebase.json                 config de despliegue (rutas relativas a deploy/)
├── firebase.emulators.json       config del emulador (apunta al FUENTE, no al artefacto)
├── firestore.rules               + firestore.indexes.json
├── proxy.config.json             el proxy de `ng serve` hacia el emulador — versionado
├── README.md
└── dist/                         el ARTEFACTO que produce `ng build`  ·  gitignored
```

El **fuente** no está aquí: la app es `src/` y las Cloud Functions son `api/`, cada una con su
paquete — ver [`manual/api.md`](../manual/api.md).

---

## La idea entera, en tres frases

1. **Un valor que no debe versionarse no se escribe en ningún sitio.** El fichero que lo necesita
   lleva un **marcador** con el nombre de la variable, versionado y a la vista.
2. **El pipeline sustituye ese marcador** en el artefacto, justo antes de publicar. El repositorio
   nunca contiene un Client ID.
3. **Un ambiente se declara en su *environment* de GitHub**, no en el repositorio: dos secrets y dos
   variables. Añadir `stage` no toca ni un fichero.

## Los marcadores

Estos ficheros están **versionados con el marcador dentro**. Se leen tal cual en local y en los E2E;
lo que se publica es una copia con el valor real:

| Fichero | Marcador | Lo sustituye |
|---|---|---|
| `public/config.json` | `"googleClientId": "GOOGLE_OAUTH_CLIENT_ID"` · `"debug": "DEBUG"` | los dos workflows, sobre `deploy/dist/hosting/config.json` |
| `api/auth/.env` | `GOOGLE_OAUTH_CLIENT_ID=GOOGLE_OAUTH_CLIENT_ID` | `deploy-backend.yml`, sobre la copia de `deploy/dist/functions/auth/` |

`api/auth/.env` va **sin sufijo de proyecto** a propósito: Firebase carga ese fichero para cualquier
`--project`, así que el mismo artefacto sirve para todos los ambientes. Un `.env.<projectId>` olvidado
en el disco lo pisaría sin que se vea en el diff, y por eso ese patrón sigue en el `.gitignore`.

> ### Un marcador sin sustituir NO rompe la app
>
> `PublicFileAppConfig` solo acepta como Client ID lo que **acaba en**
> `.apps.googleusercontent.com`. Cualquier otra cosa —el marcador, una errata— se trata como
> ausente: la integración queda apagada, la app funciona entera (el recetario vive en IndexedDB) y
> queda un `warn` diciendo qué pasó.
>
> **`/cuenta` sigue enseñando «Conectar con Google»**: esa vista nunca ha comprobado si hay cliente
> configurado. Lo que cambia es el fallo — al pulsarlo sale «Falta el identificador de cliente en la
> configuración del despliegue», un error local y diagnosticable, en vez de un `invalid_client` de
> Google sobre un id inventado.
>
> Eso es lo que hace que un clon recién hecho arranque **sin ejecutar nada**.

## Lo que se configura por ambiente

En GitHub, `Settings → Environments → <ambiente>`. El nombre del environment **es** el nombre del
ambiente: eso es lo que hace que `secrets.*` y `vars.*` resuelvan a los de ese proyecto sin un solo
`if` en el workflow.

| | Nombre | Qué es |
|---|---|---|
| secret | `GOOGLE_OAUTH_CLIENT` | el fichero de cliente que descarga Google, **entero** |
| secret | `FIREBASE_SERVICE_ACCOUNT` | la clave JSON de la cuenta de servicio de despliegue |
| var | `PROJECT_ID` | el proyecto de Firebase de ese ambiente |
| var | `DEBUG` | `true` / `false` |

Y nada más. [`environments.example.json`](environments.example.json) enseña esa misma foto en un
fichero, para poder mirarla sin entrar en GitHub; **no lo lee nadie**.

### Por qué el cliente va entero y en un solo secret

El fallo que más cuesta diagnosticar es emparejar el `client_id` de un cliente con el
`client_secret` de otro: Google contesta `invalid_client` y el mensaje no dice por qué. Con el
fichero entero en un secret eso deja de poder pasar, y el pipeline le saca los dos campos con `jq`.

De los siete campos del JSON, el despliegue usa **dos**:

| Campo | ¿Se usa? | Para qué |
|---|---|---|
| `client_id` | **Sí** | sustituye el marcador en el `config.json` y en el `.env` de la función |
| `client_secret` | **Sí** | lo copia `deploy-backend.yml` a Secret Manager |
| `token_uri` | No | está literal en `api/auth/google-oauth.ts`, y es el mismo para todo el mundo |
| `auth_uri` | No | la app usa la ventana de GIS (`initCodeClient`), no el flujo de redirección |
| `auth_provider_x509_cert_url` | No | el `id_token` **no se verifica**: llega del propio canje contra Google por TLS (OIDC §3.1.3.7) |
| `project_id` | No | ⚠ es el proyecto de **Cloud del cliente OAuth**, que **no** es el de Firebase |
| `javascript_origins` | No | lo hace cumplir Google. Si falta el origen desde el que entras, conectar da `origin_mismatch` |

---

## Qué tiene que existir ya en Firebase

**El pipeline publica; no aprovisiona.** Antes había un script que montaba el proyecto —ya no—, así
que si algo de esto falta el despliegue **falla**, y el error del CLI casi nunca dice cuál es. Es de
**una sola vez por ambiente**:

| Qué | Lo necesita | Si falta |
|---|---|---|
| **Plan Blaze** | functions | `Your project must be on the Blaze plan` |
| **Hosting activado** en la consola (*Compilación → Hosting → Comenzar*) | hosting | el deploy no encuentra sitio al que publicar |
| **Base de datos de Firestore creada** — habilitar la API **no** la crea | `firestore:rules` | `NOT_FOUND … database (default)` |
| **Seis APIs**: `secretmanager`, `cloudfunctions`, `run`, `cloudbuild`, `artifactregistry`, `firestore` | functions | `403 … has not been used in project` |
| **Cuenta de servicio con diez roles** | los dos | `403 … Permission denied` |

Los cinco, con los comandos exactos, están en [`manual/api.md`](../manual/api.md) → «Requisitos del
proyecto de Firebase». **El frontend necesita mucho menos que el backend**: si `deploy-frontend` va
en verde y `deploy-backend` en rojo, el problema está en esa lista, no en el código.

```bash
# comprobación rápida antes de lanzar nada
gcloud projects describe <projectId> --format='value(lifecycleState)'   # ACTIVE
gcloud billing projects describe <projectId> --format='value(billingEnabled)'
gcloud firestore databases list --project <projectId>
gcloud services list --enabled --project <projectId> | grep -E 'secretmanager|cloudfunctions|run\.|cloudbuild|artifactregistry|firestore'
```

---

## Publicar, paso a paso

**El despliegue se hace SIEMPRE desde GitHub Actions, a mano.** Nada se publica al mezclar a `main`:
los dos workflows son `workflow_dispatch` puro.

### Paso 1 · Desplegar el BACKEND

`Actions → Desplegar el BACKEND (Cloud Functions) → Run workflow`:

| Campo | Valor |
|---|---|
| **Use workflow from** | la rama que quieres publicar |
| **ambiente** | `dev` · `prod` … el nombre de un environment de GitHub |
| **funcion** | `auth` (el nombre de una carpeta de `api/`) |

```bash
gh workflow run deploy-backend.yml --ref <rama> -f ambiente=dev -f funcion=auth
gh run watch
```

Hace: comprobar el environment · tests de la función · `tsc` y empaquetar en
`deploy/dist/functions/auth/` · sustituir el marcador del `.env` · `client_secret` → Secret Manager ·
`firebase deploy --only functions:auth,firestore:rules`.

### Paso 2 · Desplegar el FRONTEND

`Actions → Desplegar el FRONTEND (Firebase Hosting) → Run workflow`, con la misma rama y ambiente.

```bash
gh workflow run deploy-frontend.yml --ref <rama> -f ambiente=dev
gh run watch
```

Hace: comprobar el environment · `npm run build` · sustituir los marcadores de
`deploy/dist/hosting/config.json` · `firebase deploy --only hosting`.

> ### El orden importa: BACKEND primero, FRONTEND después
>
> La app pide `/api/auth/token` **en cuanto arranca**, para reanudar la sesión. Si publicas el front
> contra una API vieja, todo el mundo aparece desconectado hasta que suba la API. Al revés no pasa
> nada. Si el cambio toca solo una mitad, despliega solo esa.

### Paso 3 · Comprobar que funcionó

En el sitio publicado (`https://<PROJECT_ID>.web.app`):

1. **`/config.json` no tiene marcadores.** `curl -s https://<projectId>.web.app/config.json` tiene que
   devolver un `googleClientId` de verdad y `debug` como booleano. (El workflow ya falla si queda
   alguno, pero esto lo confirma en el sitio servido.)
2. **La función contesta.** `curl -si https://<projectId>.web.app/api/auth/token` debe dar **401**
   (sin cookie no hay sesión), no 404 ni 500. Un **404** significa que el rewrite no llegó o la
   función no está desplegada; un **500** con «La función auth no está configurada» significa que
   falta `GOOGLE_OAUTH_CLIENT_SECRET` en Secret Manager.
3. **La sesión sobrevive a una recarga.** `/cuenta` → Conectar con Google → **recargar** → sigue
   conectada. Es lo único que ejercita las tres piezas a la vez: el Client ID del front, el del back
   y el secreto.

### Reproducir la sustitución en local

Los workflows no hacen nada que no puedas hacer tú; sirve para depurar sin gastar una ejecución:

```bash
npm run build
CLIENT_ID=123-abc.apps.googleusercontent.com
sed -i '' "s|GOOGLE_OAUTH_CLIENT_ID|${CLIENT_ID}|g" deploy/dist/hosting/config.json
sed -i '' 's|"DEBUG"|true|g'                        deploy/dist/hosting/config.json
npm run e2e:serve          # sirve deploy/dist/hosting en :4200
```

(En el runner es `sed -i`; el `''` es cosa del sed de macOS.)

Desplegar a mano se puede, pero se hace **desde `deploy/`**, nunca desde la raíz:

```bash
cd deploy && npx --yes firebase-tools@latest deploy --only hosting --project <projectId>
```

El CLI fija la raíz del proyecto en el directorio de su `firebase.json` y **rechaza cualquier ruta
que se salga de ella**. Como el artefacto se genera en `deploy/dist`, todo queda dentro — y eso es
justo lo que permite que Firebase no aparezca en ningún otro sitio del repositorio.

---

## Desarrollo local

```bash
npm run emulators         # terminal 1 — funciones + Firestore
npm start                 # terminal 2 — ng serve en :4200
```

**No hay nada que cablear**: los ficheros que hacen falta están versionados con sus marcadores.
Conectar con Google no funciona en local, y es lo esperado: el `config.json` versionado lleva el
marcador, así que `/cuenta` enseña el botón pero al pulsarlo dice que falta el identificador de
cliente.

`ng serve` llega a la función por [`proxy.config.json`](proxy.config.json): sin él, el navegador
llamaría al emulador por su URL directa y la cookie `HttpOnly` + `SameSite=Lax` no viajaría nunca —la
sesión no se reanudaría jamás en local—.

El emulador usa [`firebase.emulators.json`](firebase.emulators.json) y no el de despliegue: ejecuta
el **fuente** de `api/auth` con su `lib/` recién compilado, sin `npm ci` ni copiar árboles.

### Si de verdad necesitas probar el login en local

Es el único caso que pide tocar algo a mano, y **no se commitea**:

```bash
# api/auth/.secret.local     (gitignored; la función lo lee en el emulador)
GOOGLE_OAUTH_CLIENT_SECRET=<el client_secret>

# public/config.json         (versionado: acuérdate de revertirlo)
"googleClientId": "<el client_id>"
```

---

## Montar un ambiente nuevo

Tres cosas, y ninguna la hace un script del proyecto:

1. **El cliente de Google** — [`create-google-client-id.sh`](create-google-client-id.sh) crea el
   proyecto de Cloud, habilita Sheets y Drive, te lleva a la consola y te enseña el JSON del cliente.
   No escribe nada.
2. **El proyecto de Firebase** — a mano: plan Blaze, base de Firestore creada, seis APIs, cuenta de
   servicio con diez roles. El paso a paso está en [`manual/api.md`](../manual/api.md) →
   «Requisitos del proyecto de Firebase».
3. **El environment de GitHub** con el nombre del ambiente, sus dos secrets y sus dos variables (la
   tabla de arriba).

Después, `Actions → Desplegar el BACKEND` y luego el FRONTEND.

---

## Tres rarezas que parecen errores

**1 · `firebase.json` está aquí, y sus rutas son relativas a esta carpeta.** El CLI fija la raíz del
proyecto en el directorio de su `firebase.json` y se niega a servir nada de fuera
(`… is outside of project directory`). Como el artefacto se genera en `deploy/dist`, todas las rutas
quedan dentro. Por eso los workflows hacen `cd deploy` en vez de usar `--config`: así el CLI no tiene
margen para deducir otra raíz.

**2 · No hay rewrite de SPA, y el shell va `no-cache`.** La app enruta por fragmento
(`withHashLocation`), así que `/` es la **única** ruta que llega al servidor. Un fallback `**`
devolvería `index.html` con 200 para un chunk borrado, y el navegador intentaría ejecutarlo como
JavaScript. La cabecera de `/index.html` no bastaba porque el shell se sirve en `/`; de ahí la
entrada aparte.

**3 · El ambiente se teclea en Actions.** Un `type: choice` obligaría a duplicar la lista de
ambientes en los dos workflows. GitHub crea al vuelo cualquier environment que un job referencie, así
que una errata deja un environment vacío — y el primer paso del workflow lo caza diciendo que le
falta `PROJECT_ID`, antes de compilar nada.

---

## Crear el Client ID de Google (OAuth)

Se hace **una vez** por ambiente, quien publica la app, para que los usuarios puedan conectar su
cuenta y guardar copia del recetario en su propio Drive. Diez minutos.

Los rótulos y las URLs van **en inglés** porque Google Cloud Console está en inglés.

> **Atajo:** [`create-google-client-id.sh`](create-google-client-id.sh) hace por ti el login,
> **crea el proyecto** y habilita las dos APIs, te abre **las dos pantallas de la consola en su
> orden** —primero el consentimiento (§2), después el cliente (§3)— y te **enseña el JSON del
> cliente** para que lo pegues en GitHub. Ahí para: **no escribe nada, en ningún sitio**.
> Crea siempre un proyecto nuevo —es el alta de un cliente, no un añadido a algo que ya tengas—.
> Estos pasos son lo mismo, a mano.
>
> ```bash
> ./deploy/create-google-client-id.sh
> ```

> **Esto es OAuth, y solo OAuth.** Lo de aquí es el permiso que **el usuario** te concede sobre
> **su** cuenta, y al proyecto de Cloud le pide dos APIs: Sheets y Drive. El script **no despliega
> nada** y no escribe ningún fichero: ni configuración, ni secretos, ni nada en GitHub.
>
> Pegar el JSON en el environment es
> [«Montar un ambiente nuevo»](#montar-un-ambiente-nuevo). La infraestructura del ambiente —Blaze,
> Firestore, las APIs de despliegue, la cuenta de servicio— es una tercera cosa, y va a mano, con el
> paso a paso de [`manual/api.md`](../manual/api.md).

---

## 1 · Proyecto y APIs

1. [console.cloud.google.com/projectcreate](https://console.cloud.google.com/projectcreate) → crea el
   proyecto.
2. **APIs & Services → Library** → habilita **Google Sheets API** y **Google Drive API**.

> Habilítalas **antes** del paso 2: en el consentimiento solo se ofrecen los scopes de las APIs ya
> habilitadas.

**Estas dos, y ninguna más.** Son las que hacen que existan los scopes de Sheets y Drive. Las de la
infraestructura —`secretmanager`, `cloudfunctions`, `run`, `cloudbuild`, `artifactregistry`,
`firestore`— no tienen nada que ver con el consentimiento del usuario: van en el proyecto de
**Firebase**, se habilitan a mano al montar el ambiente, y su porqué está en
[`manual/api.md`](../manual/api.md) → requisito 3.

---

## 2 · Consent screen — **Google Auth Platform**

- **Branding** (solo la primera vez, Google no deja crear el cliente sin esto): **App name** —el
  nombre que lee el usuario al dar permiso—, **User support email** y **Developer contact**. Nada
  más: **no subas App logo**, porque obliga a pasar la verificación de Google al publicar.
- **Audience → User type: External**.
- **Data Access → Add or remove scopes**, solo estos cuatro (los que no aparezcan en la lista se
  añaden con **Manually add scopes**):

  | Scope | Para qué |
  | --- | --- |
  | `openid` | identificar la cuenta |
  | `https://www.googleapis.com/auth/userinfo.email` | saber de quién es la hoja |
  | `https://www.googleapis.com/auth/userinfo.profile` | mostrar el nombre en `/cuenta` |
  | `https://www.googleapis.com/auth/drive.file` | crear y escribir **solo** la hoja de la app |

- **Audience → Publish app**, para dejar el proyecto **«En producción»**. No es opcional y no es solo
  por el techo de usuarios:

  > ⚠️ **En «Testing», Google caduca los refresh tokens a los 7 días.** El backend
  > ([`api/auth`](../api/auth/README.md)) es quien custodia ese permiso, así que con el proyecto en
  > Testing **la sesión se perdería cada semana** — el fallo que este diseño arregla, volviendo por
  > la puerta de atrás y sin ninguna pista de por qué.

  Publicar sale gratis: aparece un aviso de «app no verificada» que se salta con un clic, y
  `drive.file` **no exige verificación de Google**. Mientras siga en Testing hay además que dar de
  alta en **Audience → Test users** el correo de cada persona (máximo 100): quien no esté no puede
  conectar.

---

## 3 · El cliente

**Clients → Create client** → **Application type: Web application**.

En **Authorized JavaScript origins**, el origen de cada sitio (dominio, **sin ruta**):

```
http://localhost:4200
http://127.0.0.1:4200
https://<projectId>.web.app
https://<projectId>.firebaseapp.com
```

- Firebase publica cada sitio en **dos dominios** y para Google son orígenes distintos: registra los
  dos, o entrar por el otro da `Error 400: origin_mismatch`. Repite el par por cada ambiente.
- `localhost` y `127.0.0.1` también son distintos, y el **puerto** cuenta. En la consola del
  navegador, `location.origin` dice el origen exacto que hay que registrar.
- **Authorized redirect URIs**: ninguno, y sigue siendo así. El flujo de código por ventana emergente
  canjea contra el `redirect_uri` reservado `postmessage`, que **no se da de alta aquí**.

Copia **las dos** cosas: el **Client ID** (`…apps.googleusercontent.com`) y el **Client secret**. El
secreto sí se usa ahora — lo necesita el backend para obtener el permiso duradero, y es la única
razón por la que la sesión sobrevive a una recarga.

---

## 4 · El fichero del cliente → el secret `GOOGLE_OAUTH_CLIENT`

Aquí acaba el procedimiento de OAuth. En la consola, al guardar, usa **Download JSON**; ese fichero
es lo que se pega, **entero y tal cual**, en el environment:

```
GitHub → Settings → Environments → <ambiente> → Add environment secret

  Nombre:  GOOGLE_OAUTH_CLIENT
  Valor:   {"web":{"client_id":"123456789012-….apps.googleusercontent.com","client_secret":"GOCSPX-…",…}}
```

Va entero porque es lo que produce una misma visita a la consola, y separarlo obligaría a acordarse
de cuál campo iba dónde — que es exactamente cómo se acaba emparejando el id de un cliente con el
secreto de otro.

**No se guarda en ningún otro sitio.** Ni en el repositorio, ni en un fichero gitignored: el
environment de GitHub es su único domicilio, y el rastro de qué clientes existieron lo guarda la
consola de Google, que es donde se rotan y se revocan.

El **Client ID no es un secreto** —viaja en cada petición del navegador, y lo que lo protege es la
lista de orígenes autorizados—, pero viaja dentro del mismo fichero que sí lo es, así que va con él.
El frontend lo necesita aunque el login sea por backend: `initCodeClient` ocurre en el navegador. Sin
Client ID, conectar con Google falla con un mensaje que lo dice, y todo lo demás —el recetario
entero, que vive en IndexedDB— sigue igual.

---

Por qué la integración está hecha así, y qué hacer cuando falla:
[`manual/google-integration.md`](../manual/google-integration.md).
Cómo se organiza el backend: [`manual/api.md`](../manual/api.md).
El despliegue en detalle: [`manual/firebase-deploy.md`](../manual/firebase-deploy.md).
