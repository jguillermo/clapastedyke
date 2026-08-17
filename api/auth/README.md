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
- **Las reglas de Firestore deniegan todo** ([`firestore.rules`](../../firestore.rules)). Aquí solo
  entra el Admin SDK.

## Configuración

| Valor | Dónde | Secreto |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | `.env.<projectId>`, versionado | No — viaja en cada petición del navegador |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Secret Manager (`.secret.local` en el emulador) | **Sí** |

El Client ID **tiene que ser el mismo** que declara el ambiente en
[`deploy/firebase/environments.json`](../../deploy/firebase/environments.json). Si divergen, Google
rechaza el canje con `invalid_client` y el mensaje no dice por qué.

```bash
firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET --project <projectId>
```

## Desarrollo y despliegue

Todo se lanza **desde la raíz del repositorio**: `firebase.json` vive allí y es lo que fija la raíz
del proyecto para el CLI de Firebase.

```bash
npm run api:install                            # npm ci dentro de api/auth
npm run api:test                               # tests unitarios (node:test)
npm run emulators                              # functions + firestore, contra el proyecto dev
npm run api:deploy -- --project <projectId>    # despliegue manual
```

En CI, el despliegue va por el workflow `deploy-backend.yml` (manual, con ambiente y función como
inputs) — separado del `deploy-frontend.yml` a propósito. El `predeploy` de `firebase.json` instala y
compila, así que las dos vías hacen lo mismo.

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
   [`deploy/google-client-id.md`](../../deploy/google-client-id.md).
5. **La firma del `id_token` no se verifica, y es correcto.** No lo entrega un cliente: lo devuelve el
   endpoint de Google por TLS en respuesta a una petición autenticada con el `client_secret`. La
   propia especificación de OpenID Connect (§3.1.3.7) admite la validación TLS en lugar de la firma en
   ese caso.
