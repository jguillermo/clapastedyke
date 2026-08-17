# Crear el Client ID de Google (OAuth)

Se hace **una vez**, quien publica la app, para que los usuarios puedan conectar su cuenta y guardar
copia del recetario en su propio Drive. Diez minutos.

Los rótulos y las URLs van **en inglés** porque Google Cloud Console está en inglés.

> **Atajo:** [`create-google-client-id.sh`](create-google-client-id.sh) te pregunta los datos y hace
> por ti el login, el proyecto y las APIs; solo tienes que pulsar **Create client** en la pantalla
> que te abre y pegarle el Client ID. Estos pasos son lo mismo, a mano.
>
> ```bash
> ./deploy/create-google-client-id.sh
> ```

---

## 1 · Proyecto y APIs

1. [console.cloud.google.com/projectcreate](https://console.cloud.google.com/projectcreate) → crea el
   proyecto.
2. **APIs & Services → Library** → habilita **Google Sheets API** y **Google Drive API**.

> Habilítalas **antes** del paso 2: en el consentimiento solo se ofrecen los scopes de las APIs ya
> habilitadas.

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

## 4 · El client secret → Secret Manager

**Nunca al repositorio, nunca a `environments.json`, nunca a `config.json`.** Vive en Secret Manager
y solo lo lee la función `auth`:

```bash
firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET --project <projectId>
```

Para el emulador, en `api/auth/.secret.local` (que está en el `.gitignore`):

```
GOOGLE_OAUTH_CLIENT_SECRET=<el secreto>
```

El proyecto necesita además el **plan Blaze** (Cloud Functions lo exige) y **Firestore habilitado**.
Ver [`manual/api.md`](../manual/api.md).

---

## 5 · Ponerlo en la app

En [`firebase/environments.json`](firebase/environments.json), en el bloque `config` de su ambiente:

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

`npm run config` si tocaste `dev`. **No edites `public/config.json`**: es un fichero generado
([`firebase/README.md`](firebase/README.md)).

El backend necesita **el mismo** Client ID, y lo lee de su propio fichero de parámetros —
`api/auth/.env.<projectId>`, versionado, con `GOOGLE_OAUTH_CLIENT_ID=…`. Si los dos valores divergen,
Google rechaza el canje con `invalid_client` y el mensaje no dice por qué.

Para comprobarlo: **`/cuenta` → Conectar con Google**, y después **recargar la página** — tiene que
seguir conectada sin pulsar nada.

---

Por qué la integración está hecha así, y qué hacer cuando falla:
[`manual/google-integration.md`](../manual/google-integration.md).
