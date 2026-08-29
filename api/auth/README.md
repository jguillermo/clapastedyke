# `api/auth` — el cliente confidencial de OAuth

Custodia el permiso duradero de cada persona y emite tokens de acceso frescos. **No hace nada más**:
no toca la hoja de cálculo, no sabe qué es una receta y no guarda datos del recetario. La
sincronización sigue entera en el navegador.

La forma de la carpeta (una función = un paquete = un despliegue) y cómo viaja `_common/` están en
[`manual/api.md`](../../manual/api.md).

## Qué arregla

La app perdía la sesión **en cada recarga**. La credencial vive solo en memoria, así que recargar
siempre la pierde; lo que estaba roto era recuperarla. Con el modelo de token de Google Identity
Services, «reanudar en silencio» acababa en `requestAccessToken()`, que **abre una ventana
emergente**. Como la reanudación corre en el arranque de la página, sin ningún clic detrás, el
navegador bloqueaba esa ventana y el fallo se tragaba en un `catch` mudo.

Un cliente de navegador no puede arreglarlo: no puede guardar un `client_secret`, así que Google no le
da **refresh token**. Esta función sí puede, y por eso existe.

## Las tres rutas

| Ruta | Cuándo | Qué hace |
|---|---|---|
| `POST /api/auth/exchange` `{ code }` | Al pulsar «Conectar» | Canjea el código con Google, guarda el refresh token, abre sesión (cookie `__session`) y devuelve un token de acceso |
| `POST /api/auth/token` | **En cada recarga y cada hora** | Lee la cookie y emite un token nuevo. Sin ventana, sin gesto y sin depender de que la persona tenga su sesión de Google abierta |
| `POST /api/auth/sign-out` | Al cerrar sesión | Revoca el permiso en Google, borra la concesión y las sesiones, y limpia la cookie |

`401` en `/token` no es un error: significa «hay que conectar a mano», que es el estado normal de
quien entra por primera vez. El navegador lo traduce a `null` en `Authenticator.resume`.

## Qué se guarda, y qué no

```
users/{sub}     ← email, nombre, avatar, permisos y EL REFRESH TOKEN
sessions/{sid}  ← { sub, createdAt, expiresAt }. El `sid` es lo que va en la cookie
```

- **El refresh token no sale de Firestore.** No se devuelve en ninguna respuesta, no se registra y no
  aparece en ningún mensaje de error.
- **El id de la cookie no es el `sub` de Google.** El `sub` es adivinable, estable para siempre y
  compartido con cualquier otro sitio donde esa persona entre con Google. El `sid` es opaco,
  aleatorio, caduca y se puede tirar sin tocar la concesión.
- **La cookie se llama `__session` y no es negociable**: Firebase Hosting borra todas las cookies
  entrantes menos esa antes de pasar la petición a la función.
- **Las reglas de Firestore deniegan todo**
  ([`deploy/firestore.rules`](../../deploy/firestore.rules)). Aquí solo
  entra el Admin SDK.

## Configuración

**Un solo build; lo que cambia por ambiente son estas dos variables.** Firebase carga el
`.env` de esta carpeta —sin sufijo de proyecto, así que vale para cualquier `--project`—, y por eso
el mismo artefacto sirve para todos los ambientes.

| Valor | Dónde | Secreto |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | `.env`, **versionado con un marcador** | No — viaja en cada petición del navegador |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Secret Manager (`.secret.local` en el emulador) | **Sí** |

**El `.env` está versionado, pero con un MARCADOR dentro, no con un valor:**

```sh
GOOGLE_OAUTH_CLIENT_ID=GOOGLE_OAUTH_CLIENT_ID
```

Quien lo sustituye es [`deploy-backend.yml`](../../.github/workflows/deploy-backend.yml), sobre la
copia que viaja en `deploy/dist/functions/auth/`, con el `web.client_id` del secret `GOOGLE_OAUTH`
del *environment*. **En el repositorio no hay ningún Client ID**, y en un portátil tampoco: el
marcador se queda como está y el emulador arranca con él.

Ese secret trae también el `client_secret`, que el mismo workflow copia a Secret Manager. Un solo
sitio para las dos cosas, así que no se pueden emparejar el id de un cliente con el secreto de otro
—que es lo que Google rechaza con `invalid_client` sin decir por qué—.

Para el **emulador**, el secreto sí se pone a mano, porque la función lo resuelve de un fichero y no
del JSON:

```sh
# api/auth/.secret.local   (gitignored)
GOOGLE_OAUTH_CLIENT_SECRET=<el client_secret>
```

De dónde sale el cliente: [`create-google-client-id.sh`](../../deploy/create-google-client-id.sh) lo
crea y te enseña su JSON. El procedimiento completo está en
[`deploy/README.md`](../../deploy/README.md).

## Desarrollo y despliegue

Los comandos se lanzan **desde la raíz del repositorio**. El CLI de Firebase solo lo invocan los
workflows, y siempre con `cd deploy` — allí está `firebase.json`, con todas sus rutas relativas a esa
carpeta.

```bash
npm run api:install     # npm ci dentro de api/auth
npm run api:test        # tests unitarios (node:test)
npm run emulators       # functions + firestore, contra el emulador
npm start               # ng serve en otra terminal, con el proxy de deploy/proxy.config.json
```

**Publicar no es un comando**: es `Actions → Desplegar el BACKEND → Run workflow`, eligiendo ambiente
y función. Ese workflow compila, empaqueta, sustituye el marcador, pone el `client_secret` en Secret
Manager y despliega. No hay script equivalente en el repositorio.

Lo que se sube **no es esta carpeta**: es `deploy/dist/functions/auth/`, con el `lib/` compilado, el
`package.json` y el `.env` ya sustituido. `node_modules` no viaja —lo instala Cloud Build desde el
lockfile—. El `lib/` lleva **dos** árboles, `lib/auth/` y `lib/_common/`, porque el `tsconfig.json`
usa `rootDir: ".."`: sin eso, un `require("../_common/http")` no encontraría nada en producción,
donde solo se sube la carpeta de la función.

## Detalles que cuesta deducir leyendo

1. **`redirect_uri: 'postmessage'`** es obligatorio al canjear un código que viene del flujo de
   ventana emergente de GIS. Sin él, Google contesta `redirect_uri_mismatch`. No hay ninguna URL de
   redirección de verdad que poner ahí, y no hay que darla de alta en la consola.
2. **Google no siempre reemite el refresh token.** Lo entrega en la primera autorización; en las
   siguientes puede devolver solo un token de acceso. Por eso el canje conserva el que ya hubiera
   guardado: si no, volver a pulsar «Conectar» dejaría la sesión sin poder renovarse.
3. **`invalid_grant` no se reintenta, se olvida.** Significa que la persona retiró el acceso (o que la
   pantalla de consentimiento sigue en «Testing» y Google caducó el permiso a los 7 días). Se borra la
   concesión y se pide conectar a mano.
4. **La pantalla de consentimiento tiene que estar «En producción».** En «Testing», Google caduca los
   refresh tokens a los **7 días** y el problema original volvería cada semana. Como `drive.file` no
   es un permiso sensible, publicarla **no exige verificación de Google**. Ver
   [`deploy/README.md`](../../deploy/README.md).
5. **La firma del `id_token` no se verifica, y es correcto.** No lo entrega un cliente: lo devuelve el
   endpoint de Google por TLS en respuesta a una petición autenticada con el `client_secret`. La
   propia especificación de OpenID Connect (§3.1.3.7) admite la validación TLS en lugar de la firma en
   ese caso.
