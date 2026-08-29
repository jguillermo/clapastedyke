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
`.env.<projectId>` de esta carpeta según el `--project` del despliegue, así que el mismo código
compilado sirve para todos.

| Valor | Dónde | Secreto |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | `.env.<projectId>`, **generado** y no versionado | No — viaja en cada petición del navegador |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Secret Manager (`.secret.local` en el emulador) | **Sí** |

**El `.env.<projectId>` no se edita a mano, y no se versiona.** Lo escriben
[`wire-environment.sh`](../../deploy/wire-environment.sh) (el de esta carpeta, para el emulador) y
[`build.sh`](../../deploy/build.sh) (el que viaja dentro de `deploy/dist/functions/auth/`).

```bash
npm run wire -- local                    # el de aquí — lo pide `npm run emulators`
npm run build -- dev --only functions    # el del artefacto
```

**El Client ID tampoco está en `environments.json`.** Ese fichero solo declara, en
`back.delEntorno`, que sale de la variable `GOOGLE_OAUTH_CLIENT_ID`; el valor lo pone el
*environment* de GitHub en el CI, y `deploy/.env-secret` en un portátil. El frontend declara **la
misma** variable, así que hay un solo origen y no pueden divergir —lo vigila
[`deploy/check.sh`](../../deploy/check.sh)—; cuando divergían, Google rechazaba el canje con
`invalid_client` sin decir por qué.

El **secreto** sí se reparte a mano, y son dos destinos: `api/auth/.secret.local` (emulador,
ignorado por git) y el *environment secret* `GOOGLE_OAUTH_CLIENT_SECRET` de GitHub, de donde
`deploy-backend.yml` lo pone en Secret Manager antes de desplegar. Ningún script lo hace por ti.

De dónde salen los dos valores: [`create-google-client-id.sh`](../../deploy/create-google-client-id.sh) crea
el cliente de Google y los anota en `deploy/.env-secret`. El reparto está en
[`deploy/README.md`](../../deploy/README.md).

## Desarrollo y despliegue

Los comandos se lanzan **desde la raíz del repositorio**; el CLI de Firebase lo invoca solo
[`deploy/deploy.sh`](../../deploy/deploy.sh), que hace `cd deploy` — allí está `firebase.json`, con todas
sus rutas relativas a esa carpeta.

```bash
npm run api:install                       # npm ci dentro de api/auth
npm run api:test                          # tests unitarios (node:test)
npm run wire -- local                     # el .env de esta carpeta y el proxy de ng serve
npm run emulators                         # functions + firestore, contra el proyecto de `local`

npm run build -- <amb> --only functions   # deja el artefacto en deploy/dist/functions/auth
./deploy/deploy.sh <amb> --only functions:auth,firestore:rules
```

En CI, el despliegue va por el workflow `deploy-backend.yml` (manual, con ambiente y función como
inputs) — separado del `deploy-frontend.yml` a propósito. El workflow corre **esos mismos dos
comandos**, así que las dos vías hacen literalmente lo mismo.

Lo que se sube **no es esta carpeta**: es `deploy/dist/functions/auth/`, donde `build.sh` deja el
`lib/` compilado, el `package.json` y el `.env.<projectId>` del ambiente. `node_modules` no viaja —lo
instala Cloud Build desde el lockfile—. El `lib/` lleva **dos** árboles, `lib/auth/` y `lib/_common/`,
porque el `tsconfig.json` usa `rootDir: ".."`: sin eso, un `require("../_common/http")` no encontraría
nada en producción, donde solo se sube la carpeta de la función.

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
