# `deploy/` — la configuración y la publicación

**Fuera de esta carpeta nadie nombra Firebase.** Ni un `projectId`, ni una región, ni el CLI. Aquí
vive lo que declara los ambientes, lo que los reparte, lo que compila el artefacto y lo que lo sube;
y el artefacto compilado sale también aquí dentro, para que publicar no tenga que recorrer tres
zonas del árbol.

**El fuente no.** La app sigue en `src/` y las Cloud Functions en [`api/`](../api/), cada una con su
propio paquete — ver [`manual/api.md`](../manual/api.md). `deploy/` solo tiene lo que **declara** el
despliegue y lo que **produce**: `build.sh` compila `api/<fn>` y deja el resultado en
`dist/functions/<fn>`, que es lo que se sube.

```
deploy/
├── environments.json          LA declaración: un bloque por ambiente, con front y back
├── firebase.json              config de despliegue (rutas relativas a deploy/)
├── firebase.emulators.json    config del emulador (apunta al FUENTE, no al artefacto)
├── firestore.rules            + firestore.indexes.json
├── dist/                      el ARTEFACTO generado: hosting/ + functions/auth/   ·  gitignored
│
├── _common.sh                 lo que comparten los scripts: estilo y lectura de environments.json
├── wire-environment.sh        copia los valores de un ambiente a los ficheros LOCALES
├── build.sh                   npm run build -- <ambiente>   →  deploy/dist
├── deploy.sh                  firebase deploy de deploy/dist
├── emulators.sh               los emuladores, con el projectId del ambiente `local`
├── env.sh                     lee (y valida) un campo de un ambiente — lo usan los workflows
├── check.sh                   las invariantes que copiar no garantiza
│
├── create-google-client-id.sh  alta: el cliente de Google        ┐  se ejecutan una vez
├── setup-firebase-project.sh   alta: el proyecto de Firebase     ┘  por ambiente
└── .env-secret                cuaderno de secretos  ·  gitignored, ningún script lo reparte
```

## Lo primero, tras clonar

Nada de lo generado se versiona, así que un clon recién hecho **no tiene** `public/config.json` ni el
`.env` de la función ni el proxy. Se escriben con un comando:

```bash
npm run wire -- local     # o: ./deploy/wire-environment.sh local
```

Y para el login con Google en local hace falta además el client secret, que **ningún script reparte**
(ver [Los secretos](#los-secretos)).

---

## `environments.json` — la única declaración

Es el único fichero de esta carpeta que se edita a mano. Solo lleva **valores públicos**.

```jsonc
"dev": {
  "projectId": "migo-dev-20b41",
  "region": "us-central1",

  "front": {                                  // lo que publica el navegador
    "destino": {
      "desarrollo": "public/config.json — lo lee `ng serve`",
      "artefacto":  "deploy/dist/hosting/config.json — lo escribe deploy/build.sh"
    },
    "valores": { "debug": true, "googleClientId": "…", "syncPollSeconds": 120 }
  },

  "back": {                                   // lo que resuelve la Cloud Function
    "destino": {
      "emulador":  "api/auth/.env.<projectId> — lo escribe deploy/wire-environment.sh",
      "artefacto": "deploy/dist/functions/auth/.env.<projectId> — lo escribe deploy/build.sh"
    },
    "valores": { "GOOGLE_OAUTH_CLIENT_ID": "…" }
  },

  "secretos": {                               // SIN VALORES: solo las claves y a dónde van
    "destino": {
      "origen":   "deploy/.env-secret — cuaderno local, nunca se versiona",
      "emulador": "api/auth/.secret.local — fichero CLAVE=valor, chmod 600, gitignored",
      "nube":     "GitHub -> Settings -> Environments -> dev -> Add environment secret"
    },
    "claves": ["GOOGLE_OAUTH_CLIENT_SECRET", "FIREBASE_SERVICE_ACCOUNT"]
  }
}
```

Cómo se lee:

- **`valores` se copia tal cual.** `front.valores` **es** el `config.json` publicado, y
  `back.valores` **son** las líneas `CLAVE=valor` del `.env` de la función. Ningún script transforma
  nada: si un valor está mal, se arregla **aquí**, nunca en el fichero generado.
- **`destino` dice a dónde va cada bloque**, y es lo que leen los scripts para saber dónde escribir.
  El texto es «ruta — por qué existe»; la ruta es lo que hay antes del guion. `<projectId>` se
  sustituye al escribir.
  Los roles `desarrollo`, `emulador` y `proxy` los escribe `wire-environment.sh`; el rol `artefacto`
  lo escribe `build.sh` dentro de `deploy/dist`.
- **`projectId` y `region` van fuera** de `front`/`back` porque son dato de despliegue, no
  configuración de la app: nombran el `.env.<projectId>`, arman el proxy y le pasan `--project` al
  CLI.
- **`secretos` no lleva valores**, solo las claves y su destino. Está ahí porque el sitio para
  responder «¿y este secreto dónde va?» tiene que ser el mismo que el del resto de la configuración.

### Añadir una clave

| Quiero… | Se añade a… | Además |
|---|---|---|
| un ajuste que lee el navegador | `front.valores` de **cada** ambiente | declararlo en `ConfigDocument` y en `AppConfig` (`src/app/core/_common/infrastructure/config/`), o se publica y se ignora en silencio |
| un parámetro de la función | `back.valores` de **cada** ambiente | leerlo con `defineString` en `api/<fn>/config.ts` |
| un ambiente entero | lo crea `setup-firebase-project.sh` con su esqueleto | rellenar el Client ID y crear el *environment* homónimo en GitHub |

### Un valor escrito dos veces, a propósito

El Client ID de Google lo necesitan las dos mitades, y **cada bloque declara el suyo**:
`front.valores.googleClientId` y `back.valores.GOOGLE_OAUTH_CLIENT_ID`. Es el precio de que los
scripts copien en vez de derivar, y se paga con una guarda:

```bash
./deploy/check.sh
```

Falla si los dos no dicen lo mismo. No es teórico: cuando divergen, Google rechaza el canje con
`invalid_client` y el mensaje no dice por qué. `check.sh` comprueba además que la **región** de los
ambientes coincide con el literal que llevan `deploy/firebase.json` (el rewrite de Hosting) y
`api/auth/index.ts` (`setGlobalOptions`) — dos ficheros estáticos que ningún script genera.

---

## Compilar y publicar, paso a paso

**El despliegue de verdad se hace SIEMPRE desde GitHub Actions, a mano.** Nada se publica al mezclar
a `main`: los dos workflows son `workflow_dispatch` puro. Los comandos locales de más abajo existen
para depurar y para poder reproducir en un portátil exactamente lo que hace el CI — no para publicar
a diario.

### Paso 0 · Comprobar que el ambiente está listo

Una sola vez por ambiente. Si algo de esto falta, el despliegue falla a mitad y deja el ambiente a
medias:

```bash
./deploy/env.sh dev            # → migo-dev-20b41   (falla si el ambiente no existe o no está montado)
./deploy/check.sh              # → los dos Client ID coinciden y la región cuadra
```

Y en GitHub, `Settings → Environments`: tiene que existir un environment **llamado igual que el
ambiente**, en minúsculas, con sus dos secrets:

| Secret | Para qué |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | el JSON de la cuenta de servicio con la que se despliega |
| `GOOGLE_OAUTH_CLIENT_SECRET` | solo el backend: lo copia a Secret Manager antes de subir |

Ese nombre es la bisagra de todo: es lo que hace que `secrets.*` resuelva a las credenciales del
proyecto correcto sin un solo `if` en el workflow. Montar el ambiente desde cero:
[«Montar un ambiente nuevo»](#montar-un-ambiente-nuevo).

### Paso 1 · Desplegar el BACKEND

`Actions → Desplegar el BACKEND (Cloud Functions) → Run workflow`, y rellenar:

| Campo | Valor |
|---|---|
| **Use workflow from** | la rama que quieres publicar |
| **ambiente** | `dev` · `prod` … la clave de `deploy/environments.json` |
| **funcion** | `auth` (el nombre de una carpeta de `api/`) |

Con `gh`, lo mismo desde la terminal:

```bash
gh workflow run deploy-backend.yml --ref <rama> -f ambiente=dev -f funcion=auth
gh run watch                                    # sigue la ejecución
```

Lo que hace, en este orden: valida el ambiente y la función · corre los tests de la función ·
`npm run build -- dev --only functions` · escribe el client secret en Secret Manager ·
`./deploy/deploy.sh dev --only functions:auth,firestore:rules`.

### Paso 2 · Desplegar el FRONTEND

`Actions → Desplegar el FRONTEND (Firebase Hosting) → Run workflow`:

| Campo | Valor |
|---|---|
| **Use workflow from** | la misma rama |
| **ambiente** | el mismo ambiente |

```bash
gh workflow run deploy-frontend.yml --ref <rama> -f ambiente=dev
gh run watch
```

Hace: valida el ambiente · `npm run build -- dev --only hosting` ·
`./deploy/deploy.sh dev --only hosting`. La URL publicada queda enlazada en el recuadro del
environment de la propia ejecución y en el resumen del job.

> ### El orden importa: BACKEND primero, FRONTEND después
>
> La app pide `/api/auth/token` **en cuanto arranca**, para reanudar la sesión. Si publicas el front
> contra una API vieja, todo el mundo aparece desconectado hasta que suba la API. Al revés no pasa
> nada: la API nueva atiende igual a la app vieja.
>
> Si el cambio toca solo una de las dos mitades, despliega solo esa.

### Paso 3 · Comprobar que funcionó

```bash
gh run list --workflow=deploy-backend.yml  --limit 3
gh run list --workflow=deploy-frontend.yml --limit 3
```

Y en el sitio publicado (`https://<projectId>.web.app`):

1. **`/config.json` es el del ambiente.** `curl -s https://<projectId>.web.app/config.json` tiene que
   devolver el bloque `front.valores` de ese ambiente — el `googleClientId` es el que se ve a simple
   vista.
2. **La función contesta.** `curl -si https://<projectId>.web.app/api/auth/token` debe dar **401**
   (sin cookie no hay sesión), no 404 ni 500. Un **404** significa que el rewrite no llegó o la
   función no está desplegada; un **500** con «La función auth no está configurada» significa que
   falta `GOOGLE_OAUTH_CLIENT_SECRET` en Secret Manager.
3. **La sesión sobrevive a una recarga.** `/cuenta` → Conectar con Google → **recargar** → sigue
   conectada. Esto es lo único que ejercita las tres piezas a la vez: el Client ID del front, el del
   back, y el secreto.

---

### Los mismos comandos, en local

Los workflows no hacen nada más que esto, así que sirve para depurar sin gastar una ejecución:

```bash
npm run build -- dev                      # las dos mitades → deploy/dist
npm run build -- dev --only hosting       # solo la app        (lo que usan los E2E)
npm run build -- dev --only functions     # solo la función

./deploy/deploy.sh dev --only hosting
./deploy/deploy.sh dev --only functions:auth,firestore:rules
```

Para desplegar desde un portátil hacen falta credenciales:
`export GOOGLE_APPLICATION_CREDENTIALS=~/.config/clapastedyke/<projectId>-deploy.json` (la clave que
deja `setup-firebase-project.sh`), o `npx firebase-tools login`.

**El ambiente se elige al compilar, no al desplegar.** Así el artefacto que se prueba es exactamente
el que se sube; si se decidiera en el `deploy`, el `config.json` del artefacto probado y el publicado
podrían no ser el mismo fichero. `deploy.sh` lo comprueba antes de subir: si el `config.json` de
`deploy/dist` no coincide con el ambiente que le pides, se niega y te dice que recompiles.

`deploy.sh` es el **único** sitio del repositorio desde el que se invoca el CLI de Firebase, y lo
hace con `cd deploy`, de forma que `deploy/firebase.json` y todas sus rutas (`dist/hosting`,
`dist/functions/auth`, `firestore.rules`) quedan dentro de su propio directorio de proyecto.

---

## Desarrollo local

```bash
npm run wire -- local     # escribe config.json, el .env de la función y el proxy
npm run emulators         # terminal 1 — funciones + Firestore
npm start                 # terminal 2 — ng serve en :4200
```

`ng serve` llega a la función por `deploy/proxy.config.json`, que también es generado:
sin él, el navegador llamaría al emulador por su URL directa y la cookie `HttpOnly` + `SameSite=Lax`
no viajaría nunca —la sesión no se reanudaría jamás en local—.

El emulador usa [`firebase.emulators.json`](firebase.emulators.json) y no el de despliegue: ejecuta
el **fuente** de `api/auth` con su `lib/` recién compilado, sin pasar por `npm ci` ni por copiar
árboles. Recargar en local con el flujo del artefacto sería insoportable.

Para comprobar que todo está bien cableado: **`/cuenta` → Conectar con Google**, y después **recargar
la página** — tiene que seguir conectada sin pulsar nada.

---

## Los secretos

**Ningún script los reparte.** `environments.json` solo dice dónde van, y `wire-environment.sh` lo
recuerda al terminar. Son dos, y cada uno tiene dos destinos:

| Secreto | En local | En la nube |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_SECRET` | `api/auth/.secret.local`, una línea `CLAVE=valor`, `chmod 600` | *environment secret* de GitHub → lo pone en Secret Manager `deploy-backend.yml` |
| `FIREBASE_SERVICE_ACCOUNT` | no hace falta (el emulador no autentica) | *environment secret* de GitHub → lo escribe `setup-firebase-project.sh` si tienes `gh` |

El *environment* de GitHub se llama **igual que el ambiente**: eso es lo que hace que `secrets.*`
resuelva a las credenciales de ese proyecto.

[`deploy/.env-secret`](.env-secret) es el **cuaderno**: está en el `.gitignore` y **se añade, nunca
se reescribe**. Cada alta pega su lote debajo del anterior, así que rotar un cliente deja rastro de
que el viejo existió, y con semántica `.env` gana el último.

---

## Montar un ambiente nuevo

Tres scripts, en este orden, y cada uno sabe de una cosa sola:

| | Script | Sabe de | Deja |
|---|---|---|---|
| 1 | [`create-google-client-id.sh`](create-google-client-id.sh) | Google: Drive, Sheets y auth | el lote en `.env-secret` |
| 2 | [`setup-firebase-project.sh`](setup-firebase-project.sh) | Firebase: Blaze, APIs, Firestore, la cuenta de despliegue | el bloque del ambiente en `environments.json`, con su esqueleto |
| 3 | *a mano* + [`wire-environment.sh`](wire-environment.sh) | el ambiente: qué valor va a qué fichero | los generados locales |

El paso 3 es: copiar el Client ID del lote a **los dos sitios** del bloque (`front` y `back`),
llevar el client secret a sus dos destinos, y cablear:

```bash
./deploy/check.sh                          # ¿coinciden los dos Client ID?
./deploy/wire-environment.sh <ambiente>    # (si ese ambiente tiene destinos locales)
```

Y en GitHub: crear el *environment* con el nombre del ambiente y sus dos secrets.

El procedimiento del cliente de Google, paso a paso, es el resto de este documento.

---

## Tres rarezas que parecen errores

**1 · `firebase.json` está aquí, y las rutas son relativas a esta carpeta.** El CLI fija la raíz del
proyecto en el directorio de su `firebase.json` y se niega a servir nada de fuera
(`… is outside of project directory`). Como el artefacto se genera en `deploy/dist`, todas las rutas
quedan dentro y por eso el fichero puede vivir aquí — que es lo que permite que Firebase no aparezca
en ningún otro sitio del repositorio. `deploy.sh` hace `cd deploy` en vez de usar `--config`: así el
CLI no tiene margen para deducir otra raíz.

**2 · No hay rewrite de SPA, y el shell va `no-cache`.** La app enruta por fragmento
(`withHashLocation`), así que `/` es la **única** ruta que llega al servidor. Un fallback `**`
devolvería `index.html` con 200 para un chunk borrado, y el navegador intentaría ejecutarlo como
JavaScript. La cabecera de `/index.html` no bastaba porque el shell se sirve en `/`; de ahí la
entrada aparte.

**3 · El ambiente se teclea en Actions, y el job que lo valida va sin `environment:`.** Un
`type: choice` obligaría a duplicar la lista de ambientes en los dos workflows. Y GitHub **crea al
vuelo** cualquier environment que un job referencie, así que validar el nombre antes —en un job sin
`environment:`— evita que una errata deje sembrado un environment fantasma, sin secrets ni
protecciones.

---

## Crear el Client ID de Google (OAuth)

Se hace **una vez** por ambiente, quien publica la app, para que los usuarios puedan conectar su
cuenta y guardar copia del recetario en su propio Drive. Diez minutos.

Los rótulos y las URLs van **en inglés** porque Google Cloud Console está en inglés.

> **Atajo:** [`create-google-client-id.sh`](create-google-client-id.sh) hace por ti el login,
> **crea el proyecto** y habilita las dos APIs, te abre **las dos pantallas de la consola en su
> orden** —primero el consentimiento (§2), después el cliente (§3)— y deja el **Client ID** y el
> **client secret** que le pegues en `deploy/.env-secret`. Ahí para: los anota, no los reparte.
> Crea siempre un proyecto nuevo —es el alta de un cliente, no un añadido a algo que ya tengas—.
> Estos pasos son lo mismo, a mano.
>
> ```bash
> ./deploy/create-google-client-id.sh
> ```

> **Esto es OAuth, y solo OAuth.** Lo de aquí es el permiso que **el usuario** te concede sobre
> **su** cuenta, y al proyecto de Cloud le pide dos APIs: Sheets y Drive. El script **no despliega
> nada**: no toca `environments.json`, no genera `config.json` ni el `.env` de la función, no
> escribe el secreto del emulador y no sube nada a GitHub.
>
> Repartir esos dos valores es **cablear un ambiente**, y es
> [«Montar un ambiente nuevo»](#montar-un-ambiente-nuevo). La infraestructura del ambiente —Blaze,
> Firestore, las APIs de despliegue, la cuenta de servicio— es una tercera cosa, y va por
> [`setup-firebase-project.sh`](setup-firebase-project.sh) y [`manual/api.md`](../manual/api.md).

---

## 1 · Proyecto y APIs

1. [console.cloud.google.com/projectcreate](https://console.cloud.google.com/projectcreate) → crea el
   proyecto.
2. **APIs & Services → Library** → habilita **Google Sheets API** y **Google Drive API**.

> Habilítalas **antes** del paso 2: en el consentimiento solo se ofrecen los scopes de las APIs ya
> habilitadas.

**Estas dos, y ninguna más.** Son las que hacen que existan los scopes de Sheets y Drive. Las de la
infraestructura —`secretmanager`, `cloudfunctions`, `run`, `cloudbuild`, `artifactregistry`,
`firestore`— no tienen nada que ver con el consentimiento del usuario: las enciende
[`setup-firebase-project.sh`](setup-firebase-project.sh), y su porqué está en
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

## 4 · Los dos valores → `deploy/.env-secret`

Aquí acaba el procedimiento de OAuth: los dos valores quedan anotados y **nadie los ha repartido
todavía**.

```sh
# ─── 2026-08-28 18:04 · proyecto migo-dev-20b41 · cliente Clapastedyke web (dev) · create-google-client-id.sh
GOOGLE_OAUTH_CLIENT_ID=406941726541-….apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-…
```

Van los dos juntos aunque solo uno sea secreto: son la pareja que produce una misma visita a la
consola, y separarlos obligaría a acordarse de cuál iba dónde. Repartirlos es
[«Montar un ambiente nuevo»](#montar-un-ambiente-nuevo), arriba.

El **Client ID no es un secreto** —viaja en cada petición del navegador, y lo que lo protege es la
lista de orígenes autorizados—, por eso vive en `environments.json`, que sí se versiona. El frontend
lo necesita aunque el login sea por backend: `initCodeClient` ocurre en el navegador. Con
`googleClientId: ""` la app simplemente no ofrece conectar con Google, y todo lo demás sigue igual.

---

Por qué la integración está hecha así, y qué hacer cuando falla:
[`manual/google-integration.md`](../manual/google-integration.md).
Cómo se organiza el backend: [`manual/api.md`](../manual/api.md).
El despliegue en detalle: [`manual/firebase-deploy.md`](../manual/firebase-deploy.md).
