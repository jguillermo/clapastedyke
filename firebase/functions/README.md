# `firebase/functions` — el cliente confidencial de OAuth

Custodia el permiso duradero de cada persona y emite tokens de acceso frescos. **No hace nada más**:
no toca la hoja de cálculo, no sabe qué es una receta y no guarda datos del recetario. La
sincronización sigue entera en el navegador.

La forma de la carpeta (un paquete npm independiente, una función = un `export`) está en
[`manual/functions.md`](../../manual/functions.md); el porqué de todo el diseño, en
[`manual/google-integration.md`](../../manual/google-integration.md).

## Qué arregla

La app perdía la sesión **en cada recarga**. La credencial vive solo en memoria, así que recargar
siempre la pierde; lo que estaba roto era recuperarla. Con el modelo de token de Google Identity
Services, «reanudar en silencio» acababa en `requestAccessToken()`, que **abre una ventana
emergente**. Como la reanudación corre en el arranque de la página, sin ningún clic detrás, el
navegador bloqueaba esa ventana y el fallo se tragaba en un `catch` mudo.

Un cliente de navegador no puede arreglarlo: no puede guardar un `client_secret`, así que Google no
le da **refresh token**. Esta función sí puede, y por eso existe.

## Las tres rutas

Base = el valor de `authApiUrl` en `public/config.json` (la URL de la función, sin barra final).

| Ruta | Cuándo | Qué hace |
|---|---|---|
| `POST /exchange` `{ code }` | Al pulsar «Conectar» | Canjea con Google el código que trajo la ventana, guarda el refresh token, abre sesión y devuelve un token de acceso |
| `POST /refresh` | **En cada recarga y cada hora** | Emite un token nuevo. Sin ventana, sin gesto y sin depender de que la persona tenga su sesión de Google abierta |
| `POST /logout` | Al cerrar sesión | Cierra **esta** sesión y limpia la cookie |

`OPTIONS` en cualquiera de ellas contesta el preflight. Otro método → `405`. Ruta desconocida → `404`.

> ### El login NO ocurre aquí, y por eso la ruta no se llama `/login`
>
> La persona se identifica **en la ventana de Google** (`accounts.google.com`), antes de que esta
> función sepa que existe: la app no ve su contraseña y no podría verla, porque es otro origen y el
> navegador lo aísla. Lo que llega a `/exchange` es un **código de un solo uso** que Google ya emitió y
> que por sí solo no abre nada.
>
> Canjear ese código es lo único que el navegador **no** puede hacer solo, porque exige el
> `client_secret`. Ahí está toda la razón de ser de este backend.

**`401` en `/refresh` no es un error**: significa «hay que conectar a mano», que es el estado normal
de quien entra por primera vez. El navegador lo traduce a `null` en `Authenticator.resume`.

### La respuesta

```jsonc
// 200 · /exchange y /refresh · + Set-Cookie: __session=…
{
  "access_token": "ya29...",
  "expires_in": 3599,
  "scope": "openid email profile https://www.googleapis.com/auth/drive.file",
  "token_type": "Bearer",
  "session_token": "8f3c…",          // el respaldo de la cookie; ver más abajo
  "account": { "sub": "1084…", "email": "…", "name": "…", "picture": "https://…" }
}
```

Los errores son `{ "error": "…", "message": "…" }`. **El cliente decide por `error`, nunca por el
texto**: el mensaje se muestra a la persona y puede cambiar sin previo aviso.

| Ruta | Status | `error` | Cuándo |
|---|---|---|---|
| `/exchange` | 400 | `invalid_request` | Falta `code` |
| `/exchange` | 403 | `missing_permission` | La concesión no incluye `drive.file` |
| `/exchange` | 409 | `no_refresh_token` | Google no dio refresh token y no había ninguno guardado |
| `/exchange` | 502 | `no_profile` | El canje no trae un `id_token` utilizable |
| `/exchange` | 502 | *(código de Google)* | Google rechazó el canje |
| `/refresh` | 401 | `no_session` | Sin identificador de sesión, o la sesión ya no vale |
| `/refresh` | 401 | `revoked` | Google contestó `invalid_grant`: se retiró el acceso |
| `/refresh` | 502 | *(código)* | Fallo pasajero. La sesión **no** se toca |
| `/logout` | 204 | — | **Siempre**, pase lo que pase |
| *(cualquiera)* | 500 | `internal` | Fallo no controlado, o el `.env` sin configurar |

## Los cinco ficheros

```
src/auth/
├── router.ts     enrutado, CORS y preflight; el último recinto de los fallos
├── routes.ts     las tres operaciones: login, refresh, logout
├── google.ts     el diálogo con Google (canje y refresco) y la lectura del id_token
├── sessions.ts   Firestore (users/ + sessions/) y cómo el navegador dice cuál es su sesión
└── http.ts       tipos de petición/respuesta, la configuración del .env y la forma del payload
```

Cada uno tiene su `*.test.ts` al lado, compilado aparte a `lib-test/`.

## Cómo viaja la sesión: dos vías, y las dos hacen falta

La función se llama por su **URL directa**, no por un rewrite de Hosting, así que vive en otro
dominio que la app. Eso tiene dos consecuencias que están en el código:

1. **La cookie `__session` es de terceros.** Se emite `SameSite=None; Secure` (sobre http, en el
   emulador, cae a `SameSite=Lax` sin `Secure`, o el navegador no la guardaría). Es la vía preferida
   porque es `HttpOnly`: ni la app ni un XSS pueden leerla.
2. **Safari e iOS la bloquean igualmente.** Por eso la respuesta lleva además `session_token`, con el
   mismo valor; la app lo guarda y lo manda en `Authorization: Bearer`. Sin este respaldo, en móvil
   la sesión no sobreviviría a una recarga — que es justo el fallo que esta función viene a arreglar.

La función acepta cualquiera de las dos y prefiere la cookie.

> ### ⚠️ CORS: se refleja CUALQUIER origen, y es una decisión con coste
>
> Con `Access-Control-Allow-Credentials: true` la especificación prohíbe el comodín `*`, así que hay
> que devolver el origen concreto. Aquí se devuelve **el que venga**.
>
> Eso significa que **cualquier web que visite la persona puede hacer `POST /refresh` desde su
> navegador, recibir un token de acceso válido y usarlo contra los ficheros que esta app creó en su
> Drive.** Está aceptado a sabiendas, no es un descuido.
>
> Cerrarlo es un cambio de una función: que `allowedOrigin` (`src/auth/router.ts`) consulte una lista
> en vez de devolver lo que le dan. Sus tests están en `router.test.ts`.

## Qué se guarda, y qué no

```
users/{sub}     ← email, nombre, avatar, permisos y EL REFRESH TOKEN
sessions/{sid}  ← { sub, createdAt, expiresAt }. El `sid` es lo que ve el navegador
```

- **El refresh token no sale de Firestore.** No se devuelve en ninguna respuesta, no se registra y no
  aparece en ningún mensaje de error.
- **El id de la sesión no es el `sub` de Google.** El `sub` es adivinable, estable para siempre y
  compartido con cualquier otro sitio donde esa persona entre con Google. El `sid` es opaco,
  aleatorio, caduca a los 180 días y se puede tirar sin tocar la concesión.
- **`/logout` cierra solo esta sesión.** Borra `sessions/{sid}`, no `users/{sub}`: los otros
  dispositivos de esa persona siguen conectados y el permiso en Google no se retira. Quien quiera lo
  segundo lo hace desde su cuenta de Google.
- **Las reglas de Firestore deniegan todo**
  ([`../firestore.rules`](../firestore.rules)). Aquí solo entra el Admin SDK, que se las salta por
  diseño.

## Configuración

Dos variables, y las dos salen del **mismo** cliente de OAuth de Google:

| Valor | Secreto |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | No — viaja en cada petición del navegador, y también está en `config.json` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | **Sí** — solo vive aquí y en Google |

Van en **`firebase/functions/.env`, que NO se versiona** (lo ignora `firebase/.gitignore`) y lleva
los valores de verdad. [`.env.example`](.env.example) sí se versiona y documenta las dos claves.

```bash
cp .env.example .env    # y pega dentro los valores del JSON del cliente
```

Que las dos mitades salgan del mismo cliente no es comodidad: emparejar el `client_id` de uno con el
`client_secret` de otro es lo que Google rechaza con un `invalid_client` sin explicar nada.

El fichero es `.env` **sin sufijo de proyecto** a propósito: Firebase lo carga para cualquier
`--project`, así que el mismo artefacto sirve para todos los ambientes. Un `.env.<projectId>`
olvidado en el disco lo pisaría en silencio, y por eso ese patrón está en el `.gitignore` de la raíz.

> **Consecuencia que conviene saber:** solo puede desplegar quien tenga este fichero en su máquina.
> Ningún pipeline lo rellena. Sin él, la función se despliega igual y contesta `500` con «La función
> auth no está configurada», que es un mensaje diagnosticable en vez de un fallo opaco.

> ### Por qué el secreto NO va en Secret Manager
>
> `defineSecret` habría metido en el camino de publicar otras dos APIs de Google —Secret Manager y
> Service Usage—, con sus permisos y sus 403, para transportar un valor que quien despliega ya tiene
> en la mano.
>
> El coste, dicho claro: una variable de entorno la ve cualquiera con permiso de lectura sobre la
> función en la consola de Cloud; Secret Manager la habría guardado cifrada y con bitácora de
> accesos. Rotarla es regenerar el client secret en Google y volver a desplegar.

## Comandos

```bash
npm run fn:install    # npm ci aquí dentro           (desde la raíz del repo)
npm run fn:lint       # su ESLint                    (comillas DOBLES, indent 2)
npm run fn:build      # su tsc → lib/
npm --prefix firebase/functions run test   # los tests de las piezas puras
```

**El lint no es cosmético**: es el primer `predeploy` de `firebase.json`, así que un fichero con
comillas simples **tumba el despliegue entero** antes de subir nada.

Los tests se compilan aparte (`tsconfig.test.json` → `lib-test/`, ignorado por git) para que no
viajen en el artefacto. Cubren lo que decide algo sin hablar con nadie: normalización de ruta,
atributos de la cookie, política de CORS, lectura del `id_token` y reconocimiento de `invalid_grant`.
Firestore y la red no se doblan — se ejercitan desde el emulador y desde los E2E.

## Desarrollo local

```bash
npm run emulators     # compila la función y arranca functions + firestore
npm start             # ng serve, en otra terminal
```

En tu `public/config.json` local, pon el `googleClientId` de verdad y la URL del emulador:

```jsonc
{
  "debug": true,
  "googleClientId": "…apps.googleusercontent.com",
  "authApiUrl": "http://127.0.0.1:5001/<projectId>/us-central1/auth"
}
```

`http://` solo se acepta sobre `localhost` o `127.0.0.1`; en cualquier otro sitio la app exige
`https:` y, si no, apaga la integración. Es lo que evita publicar por error una configuración con la
que la cookie `Secure` nunca podría guardarse.

## Detalles que cuesta deducir leyendo

1. **`redirect_uri: "postmessage"`** es obligatorio al canjear un código que viene del flujo de
   ventana emergente de GIS. Sin él, Google contesta `redirect_uri_mismatch`. No hay ninguna URL de
   redirección de verdad que poner ahí, y no hay que darla de alta en la consola.
2. **Google no siempre reemite el refresh token.** Lo entrega en la primera autorización; en las
   siguientes puede devolver solo un token de acceso. Por eso el canje conserva el que ya hubiera
   guardado: si no, volver a pulsar «Conectar» dejaría la sesión sin poder renovarse.
3. **`invalid_grant` no se reintenta, se olvida.** Significa que la persona retiró el acceso (o que
   la pantalla de consentimiento sigue en «Testing» y Google caducó el permiso a los 7 días). Se
   borra la concesión y se pide conectar a mano.
4. **La pantalla de consentimiento tiene que estar «En producción».** En «Testing», Google caduca los
   refresh tokens a los **7 días** y el problema original volvería cada semana. Como `drive.file` no
   es un permiso sensible, publicarla **no exige verificación de Google**.
5. **La firma del `id_token` no se verifica, y es correcto.** No lo entrega un cliente: lo devuelve el
   endpoint de Google por TLS en respuesta a una petición autenticada con el `client_secret`. La
   propia especificación de OpenID Connect (§3.1.3.7) admite la validación TLS en lugar de la firma
   en ese caso.
6. **`__session` es el único nombre de cookie posible** si algún día se vuelve al mismo origen:
   Firebase Hosting borra toda cookie entrante que no se llame así. Hoy la app llama a la URL directa
   y Hosting no está en medio, pero el nombre no cuesta nada y cierra esa puerta.
