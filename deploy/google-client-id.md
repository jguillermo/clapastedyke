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

- Mientras el proyecto esté en **Testing**, añade en **Audience → Test users** el correo de cada
  persona que vaya a usarla (máximo 100): **quien no esté en la lista no puede conectar**. Con
  **Publish app** se acaba esa tarea — sale un aviso de «app no verificada» que se salta con un
  clic, y `drive.file` no exige verificación.

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
- **Authorized redirect URIs**: ninguno. La app usa el flujo popup.

Copia el **Client ID** (`…apps.googleusercontent.com`). El *client secret* no se usa.

---

## 4 · Ponerlo en la app

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

Para comprobarlo: **`/cuenta` → Conectar con Google**.

---

Por qué la integración está hecha así, y qué hacer cuando falla:
[`manual/google-integration.md`](../manual/google-integration.md).
