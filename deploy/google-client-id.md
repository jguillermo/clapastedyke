# Crear el Client ID de Google (OAuth)

Se hace **una vez**, quien publica la app, para que los usuarios puedan conectar su cuenta y guardar
copia del recetario en su propio Drive. Diez minutos.

Los rótulos y las URLs van **en inglés** porque Google Cloud Console está en inglés.

> **Atajo:** [`create-google-client-id.sh`](create-google-client-id.sh) hace por ti el login,
> **crea el proyecto** y habilita las dos APIs, te abre la consola con los datos listos, y deja el
> **Client ID** y el **client secret** que le pegues en `deploy/.env-secret`. Ahí para: los anota,
> no los reparte. Crea siempre un proyecto nuevo —es el alta de un cliente, no un añadido a algo
> que ya tengas—. Estos pasos son lo mismo, a mano.
>
> ```bash
> ./deploy/create-google-client-id.sh
> ```

> **Esto es OAuth, y solo OAuth.** Lo de aquí es el permiso que **el usuario** te concede sobre
> **su** cuenta, y al proyecto de Cloud le pide dos APIs: Sheets y Drive. El script **no despliega
> nada**: no toca `environments.json`, no genera `config.json` ni el `.env` de la función, no
> escribe el secreto del emulador y no sube nada a GitHub.
>
> Repartir esos dos valores es **cablear un ambiente**, y lo hace
> [`wire-environment.sh`](wire-environment.sh) (§5). La infraestructura del ambiente —Blaze,
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

Aquí acaba este documento en lo que toca a OAuth: los dos valores quedan anotados y **nadie los ha
repartido todavía**.

```sh
# ─── 2026-08-28 18:04 · proyecto migo-dev-20b41 · cliente Clapastedyke web (dev) · create-google-client-id.sh
GOOGLE_OAUTH_CLIENT_ID=406941726541-….apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-…
```

[`deploy/.env-secret`](.env-secret) es un **cuaderno**: está en el `.gitignore`, y **se añade, nunca
se borra ni se reescribe**. Cada alta pega su lote debajo del anterior, así que rotar un cliente deja
rastro de que el viejo existió, y con semántica `.env` gana el último — que es lo que se quiere.

Van los dos juntos aunque solo uno sea secreto: son la pareja que produce una misma visita a la
consola, y separarlos obligaría a acordarse de cuál iba dónde.

---

## 5 · Cablearlos a un ambiente

**Esto ya no es OAuth**: es decidir a qué despliegue pertenecen. Lo hace
[`wire-environment.sh`](wire-environment.sh), que coge el último lote y lo reparte.

```bash
./deploy/wire-environment.sh
```

Es el tercero de tres, y cada uno sabe de una cosa sola:

| | Script | Sabe de |
|---|---|---|
| 1 | [`create-google-client-id.sh`](create-google-client-id.sh) | Google: Drive, Sheets y auth |
| 2 | [`setup-firebase-project.sh`](setup-firebase-project.sh) | Firebase: Blaze, APIs, Firestore, la cuenta de despliegue |
| 3 | [`wire-environment.sh`](wire-environment.sh) | El ambiente: qué valor va a qué fichero y a qué *environment* |

El (3) existe porque repartir necesita las dos mitades a la vez, y meterlo en cualquiera de los
otros dos le obligaría a saber de algo que no es lo suyo.
| Valor | Dónde acaba |
| --- | --- |
| **Client ID** | `firebase/environments.json` → `<amb>.config.googleClientId`, y de ahí los dos generados |
| **Client secret** | `api/auth/.secret.local` (emulador) y el *environment secret* `GOOGLE_OAUTH_CLIENT_SECRET` de GitHub |

**Al desplegado no lo pones tú.** `deploy-backend.yml` lee ese secret del *environment* que elijas y
lo escribe en Secret Manager, que es donde lo resuelve el `defineSecret` de la función. Por eso montar
un ambiente es **elegirlo en Actions**: no queda ningún valor que dependa de que alguien se acordara
de subirlo desde su portátil.

### A mano, si hace falta

El Client ID se escribe **una vez**, en [`firebase/environments.json`](firebase/environments.json),
en el bloque `config` de su ambiente:

```jsonc
"dev": {
  "projectId": "migo-dev-20b41",
  "config": {
    "debug": true,
    "googleClientId": "123456-abc.apps.googleusercontent.com",
    "syncPollSeconds": 120
  }
}
```

De ahí salen **los dos ficheros que lo usan**, y ninguno se edita a mano:

| Generado | Lo usa | Se regenera con |
| --- | --- | --- |
| `public/config.json` | El navegador, para abrir la ventana de Google | `npm run config` |
| `api/auth/.env.<projectId>` | La función, para canjear el código | `npm run api:env <ambiente>` |

**Que sean generados es el punto.** Antes el mismo Client ID estaba escrito a mano en dos ficheros, y
en cuanto divergían Google rechazaba el canje con `invalid_client` sin decir por qué. Ahora no pueden
divergir: el `predeploy` de `firebase.json` regenera el `.env` en cada despliegue, así que tampoco se
puede publicar con un valor viejo.

El **Client ID no es un secreto** —viaja en cada petición del navegador— y por eso va versionado. El
frontend lo sigue necesitando aunque el login sea por backend: `initCodeClient` ocurre en el
navegador. Con `googleClientId: ""` la app simplemente no ofrece conectar con Google.

Para comprobarlo: **`/cuenta` → Conectar con Google**, y después **recargar la página** — tiene que
seguir conectada sin pulsar nada.

---

Por qué la integración está hecha así, y qué hacer cuando falla:
[`manual/google-integration.md`](../manual/google-integration.md).
