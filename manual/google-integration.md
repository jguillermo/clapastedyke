# Integración con Google — modelo mental y decisiones

Este documento es el **por qué**. El paso a paso para ponerlo en marcha está en
[`firebase/README.md`](../firebase/README.md); aquí está lo que hay que entender antes de tocarlo, las
alternativas que se evaluaron y los datos medidos que respaldan cada decisión.

Se escribió después de una investigación con pruebas reales contra la API de Google (agosto 2026).
Los resultados del [Anexo A](#anexo-a--el-botón-«desplegar-sincronizador»-investigado-y-archivado)
costaron una tarde de obtener; están aquí para no repetirla.

---

## 1 · Qué es la integración, y qué no es

**La app funciona sin conexión y sin backend.** IndexedDB es la base de datos local de todo. La
integración con Google Sheets es **opcional**: se enciende y entonces la hoja del usuario pasa a ser la
**fuente de la verdad** — se lee, se fusiona con lo local y se escribe.

> **Esto cambió.** Hasta agosto de 2026 la integración era un espejo de **una sola vía** (app → hoja) y
> este documento decía que la hoja «nunca se lee», que el puerto solo tenía `send()` y que la
> bidireccionalidad sería «un capítulo aparte, no una ampliación». Ese capítulo se escribió: hoy hay
> lectura, fusión a tres vías, resolución de conflictos y borrados que viajan. **Todo lo demás de este
> documento sigue vigente** — es lo que explica por qué el destino es Sheets, por qué no hay backend y por
> qué la sesión caduca. El cómo funciona la sincronización está en
> [`sync-architecture.md`](sync-architecture.md).

Consecuencias que conviene tener presentes:

- **Con la integración apagada no cambia nada.** Es el estado por defecto: `public/config.json` sale
  del repositorio con `googleClientId` vacío, y sin cuenta conectada nada de esto se ejecuta.
- **La hoja manda, pero solo cuando hay hoja.** Sin cuenta conectada, IndexedDB es lo único que hay y la
  app se comporta igual que antes.
- **Guardar nunca depende de la red.** El caso de uso escribe en IndexedDB y vuelve; la sincronización va
  por su cuenta y su fallo no bloquea nada ni pierde nada.

---

## 2 · Modelo mental: seis cosas que confunden

### 2.1 No existe un «token de Google Sheets» sin login

Un *access token* de OAuth **es** el resultado de que el usuario inicie sesión y conceda el permiso.
No hay una credencial de servicio que se pueda pedir por otra vía desde un navegador. Si quieres que
cada usuario escriba en **su** hoja, el login de Google es obligatorio: sin identidad no hay Drive
del que hablar.

### 2.2 Popup y redirect son el mismo protocolo

En OAuth el usuario **nunca** teclea su contraseña en tu app — ni en popup ni en redirect. En ambos
casos la ventana es de Google, en `accounts.google.com`, y tu app solo recibe un token al final. Tu
app no podría capturar esa contraseña aunque quisiera: es otro origen y el navegador lo aísla.

El proyecto usa el **modelo de código** de Google Identity Services con `ux_mode: 'popup'`: la ventana
de Google devuelve un `code` de un solo uso que hay que canjear **en un servidor** con el
`client_secret`. Ese servidor es [`firebase/functions`](../firebase/functions/).

Antes usaba el **modelo de token** (también popup), que entrega el token directamente al navegador y
no necesita backend. Se cambió porque no se sostenía; el porqué está en 2.3.

### 2.3 Un cliente de navegador no obtiene refresh token — y por eso hay backend

**Esta es la restricción que decide toda la arquitectura de la sesión.**

Un cliente público (una SPA) no puede guardar un `client_secret`, así que Google no le entrega
**refresh token**. Solo le da tokens de acceso de **~1 hora**. El flujo implícito
(`response_type=token`), que sería la vía sin backend, **fue eliminado en OAuth 2.1** por fuga de
tokens en la URL, y arrastraba el mismo problema.

Durante un tiempo el proyecto intentó vivir con eso, apoyándose en la reanudación silenciosa de GIS:
pedir otro token con `prompt: ''` al arrancar la página. **No funcionaba, y no podía funcionar.**
`requestAccessToken()` abre siempre una **ventana emergente** —`prompt: ''` solo significa «no fuerces
el selector de cuenta», no «no enseñes nada»— y Google documenta que hay que llamarlo desde un gesto
del usuario para que el navegador no la bloquee. Al correr en el arranque de la página no hay ningún
gesto: la ventana se bloqueaba, el error se tragaba en un `catch` mudo y **cada recarga desconectaba**.

La única solución real es dejar de ser un cliente público. La función `auth` es un **cliente confidencial**:
tiene el `client_secret`, obtiene un refresh token que no caduca y emite tokens de acceso frescos
cuando la app se los pide. Reanudar pasa a ser **un POST**: sin ventana, sin gesto y sin depender de
que la persona tenga su sesión de Google abierta.

> **Lo que esto cuesta, y se acepta a sabiendas.** El proyecto nació queriendo no custodiar
> credenciales de nadie, y ahora las custodia: en Firestore hay refresh tokens de larga vida con
> permiso `drive.file`. Se compensa con lo más estrecho posible en cada eje —un solo permiso, reglas
> de Firestore que deniegan todo, y un token que nunca se devuelve al navegador— pero el modelo de
> amenaza **cambió**, y conviene saberlo antes que descubrirlo.

### 2.4 En el navegador no se persiste ninguna credencial *de Google*

`Credential` sigue viviendo **solo en memoria** (`core/auth/domain/value-objects/credential.ts`) y
durando una hora. No está en `localStorage`, ni en IndexedDB, ni en una cookie legible. El refresh
token no llega nunca al navegador.

| Dónde guardar el token de acceso | Sobrevive a… | Coste |
|---|---|---|
| **Memoria** (lo actual) | nada, por sí solo | ninguno |
| `sessionStorage` | recarga sí, cerrar pestaña no | legible por cualquier XSS mientras dure |
| IndexedDB / `localStorage` | todo, hasta que caduque | igual, y además persiste en disco |

Ninguna de las dos últimas pasa de **1 hora** —ahí caduca el token—, así que ni siquiera resolvían el
problema. Lo que lo resuelve es no guardar el token sino **poder pedir otro**, y esa capacidad vive en
una cookie **`HttpOnly`** que emite la función `auth`: el JavaScript de la app no puede leerla, y un XSS
tampoco.

> **La cookie sola no basta, y hay que saber por qué.** La función se llama por su **URL directa**, no
> por un rewrite de mismo origen, así que su cookie es **de terceros** — y Safari e iOS las bloquean
> aunque estén perfectamente formadas. En esos navegadores la cookie no llegaría nunca y la sesión no
> sobreviviría a una recarga, que es justo el fallo que todo esto viene a arreglar. Y la app es
> **mobile-first**: ese medio parque es el principal.
>
> Por eso la respuesta lleva además un `session_token` con el mismo valor, que la app guarda en
> IndexedDB (`auth_session_token`) y manda en `Authorization` cuando la cookie no viajó. Va en
> IndexedDB y no en `localStorage` porque `SignOut` borra esa base entera, así que cerrar sesión se lo
> lleva por delante sin que nadie tenga que acordarse.
>
> **El coste, dicho claro:** ese identificador sí es legible por el JavaScript de la página, así que
> un XSS podría llevárselo — cosa que con la cookie `HttpOnly` sola no pasaba. No es una credencial de
> Google (no abre nada por sí mismo; solo le dice al backend qué sesión renovar, y el backend decide
> si sigue viva), pero permitiría suplantar la sesión hasta que se cierre. Es el precio de que la
> sesión funcione en móvil, y se acepta a sabiendas.

En IndexedDB se sigue guardando **solo con qué cuenta se estaba** (id y correo, nunca un token). Es la
puerta de `ResumeSession`: sin pista, a un visitante que nunca conectó ni se le pregunta al backend.

> **Efecto lateral aceptado:** quien borre IndexedDB pero conserve las cookies tendrá que pulsar
> «Conectar» una vez, aunque el backend pudiera reanudar. Es el precio de no hacer una petición en
> cada arranque de un visitante anónimo.

**La misma pieza cubre la caducidad en caliente.** Si el token de una hora muere con la app abierta,
`SessionCredentialsProvider` no devuelve `null` —que haría creer a todo el mundo que el usuario cerró
sesión—: pide la renovación y entrega el token nuevo. `ResumeSession` comparte un solo intento entre
todos los que lo descubran a la vez, y renovar **no toca el `epoch`**: es la misma sesión, y si el
número cambiara, cualquier operación en vuelo tiraría su resultado creyendo que entró otra cuenta.

**Reanudar publica `SessionResumed`, no `AuthenticationSucceeded`.** Son hechos distintos: «ha entrado
una cuenta» significa tirar lo que quedara de la anterior y subirlo todo, y aquí no hay cuenta
anterior — la cola pendiente es de esta misma persona y hay que respetarla. Reutilizar el evento de
entrada haría que **cada recarga borrase los cambios que esperaban turno**.

**La arquitectura ya absorbe esto y no se pierde ni un dato**: credencial caducada →
`SessionCredentialsProvider.current()` devuelve `null` → `Synchronize` sale por
`reason: 'disconnected'` y **devuelve los items a la cola**, que vive en IndexedDB y sobrevive a la
recarga. El `epoch` de sesión impide que un lote de una sesión vieja se aplique en la nueva.

### 2.5 Todo lo que llega al navegador es público

No existe forma de guardar un secreto en un cliente de navegador. Ni una URL, ni una clave, ni un
token compartido: si el navegador puede leerlo para usarlo, el usuario puede leerlo también.

En concreto, **la URL del Apps Script no es secreta**: vive en `public/config.json`, que es un
fichero estático servido por la propia app. Y aunque estuviera embebida en el bundle, DevTools →
Network la muestra en la primera petición. Lo único que la ocultaría es que el POST no saliera del
navegador — o sea, un servidor.

Por eso el aislamiento **no puede** basarse en que nadie conozca la URL. Se basa en el token.

### 2.6 `drive.file` alcanza justo lo que la app crea, y eso basta

En la pantalla de consentimiento se lee: *«See, edit, create, and delete only the specific Google
Drive files you use with this app»*. Esa coletilla final es todo. No es «solo lectura» ni «solo
crear»: sobre **los ficheros que la app ha creado** puede todo — leerlos, escribirlos y borrarlos.
Sobre el resto del Drive, nada; ni siquiera listarlo.

De ahí sale toda la arquitectura actual: la app **crea** la hoja, y por haberla creado puede
**escribirla**, sin pedir un permiso más ancho y sin nada intermedio. Medido: crear la hoja con solo
`drive.file` devuelve 200 ([Anexo A.2](#a2-resultados-medidos-3-agosto-2026-cuenta-real)).

Las alternativas son peores en las dos direcciones: `drive` a secas daría acceso al Drive entero, y
un scope de **solo lectura no es viable** porque la app escribe. Además, por ser el más estrecho,
Google **no considera `drive.file` sensible** y no exige verificación de la app — de ahí que no haya
techo de usuarios (ver [5.2](#52-el-techo-de-100-usuarios-y-cómo-se-quita)).

---

## 3 · Las arquitecturas posibles

| | Aísla por usuario | Necesita backend | Coste |
|---|---|---|---|
| **Sheets + Drive REST desde el navegador** ← **lo montado** | ✅ | ❌ | El upsert y el orden de escritura viven en la app |
| Apps Script Web App + token del usuario | ✅ | ❌ | Despliegue manual del script, una vez, por quien publica |
| Apps Script desplegado por la app en cada cuenta | ✅ | ❌ | Un interruptor manual **por usuario** (ver Anexo A) |
| Google Picker (el usuario elige una hoja) | ✅ | ❌ | Solo resuelve *qué* hoja, no *cómo* escribir |
| Backend propio con refresh tokens | ✅ | ✅ | Servidor + custodia de credenciales de terceros |
| **Google Forms** | ❌ | ❌ | Rompe el aislamiento (ver 3.1) |
| Service account | ❌ | ✅ | Clave privada imposible de proteger en un navegador |

### 3.1 Por qué Google Forms no sirve

Un formulario **tiene un dueño**, y sus respuestas caen en la hoja vinculada **del dueño**. Un solo
formulario para todos los usuarios significa todas las respuestas en **una sola hoja, la tuya**.

Forms es una herramienta para que **una persona recoja datos de muchas**; aquí hace falta lo inverso.
Además solo sabe **añadir filas** —no actualizar ni borrar—, así que editar una receta crearía una
fila nueva en vez de corregir la anterior.

*(Existe el resquicio de crear un formulario por usuario con la Forms API, pero obliga a abandonar la
UI propia, invierte la dirección de la sincronización y no funciona sin red.)*

### 3.2 Qué costó quitar el Apps Script de en medio

Hubo una versión con un Web App de Apps Script que había que desplegar a mano. Se cambió por la
llamada directa a Sheets, y lo que había que resolver eran los **tres cerrojos** que aquel daba
gratis:

1. **`LockService`** — serializaba toda escritura. En el navegador no hay equivalente exacto:
   `navigator.locks` cubre las pestañas del mismo navegador, y entre dos dispositivos escribiendo el
   mismo segundo no hay cerrojo. **Se acepta**: la convergencia del punto 3 hace que el desenlace sea
   una hoja consistente, no una a medias.
2. **`CacheService`** — recordaba el `requestId` 6 h, así que reenviar el mismo lote no reescribía
   nada. **Se pierde**, y no importa: reescribir el mismo lote deja la hoja igual.
3. **Upsert por clave y reemplazo por padre** — mandar datos equivalentes converge siempre al mismo
   estado. **No se pierde**: es el mismo algoritmo, movido a `infrastructure/sheet-merge.ts`, donde
   además se puede probar sin red — cosa que dentro de un Apps Script no se podía.

El tercero era el que de verdad protegía contra corrupción silenciosa, y es el que se conserva.

---

## 4 · La arquitectura montada

```
Navegador                        auth (Cloud Function)          Drive del usuario
─────────                        ───────────────────────        ─────────────────
                                 Firestore
«Conectar» ─ POST /exchange ───►  canje + client_secret ──────►  Google
              { code }             refresh token ▸ Firestore
           ◄─ cookie __session  ─  token de acceso (1 h)
              + session_token
recarga / cada hora ───────────►  POST /refresh ───────────────►  Google
     (cookie o Bearer)             ◄──────────────────────────── token de acceso (1 h)

IndexedDB (fuente de verdad)
    │
    │ evento de dominio
    ▼
SyncOutbox (cola durable)
    │
    │ Authorization: Bearer <token DEL USUARIO>
    │
    ├─ GET  drive/v3/files/{id}          ¿sigue estando la hoja?
    ├─ GET  drive/v3/files?q=name=…      ¿ya tiene una? (dispositivo nuevo)
    ├─ POST sheets/v4/spreadsheets       crearla, SOLO si no tiene ninguna
    ├─ GET  …/values:batchGet            leer lo que ya hay
    │       (fusionar por id, en la app)
    └─ POST …/values:batchUpdate  ────────────────────────────►  «Clapastedyke — Recetario»
```

**Entre la app y la hoja sigue sin haber nada.** El backend solo interviene en la **sesión**: emite
tokens y custodia el permiso duradero. Los datos del recetario no pasan por él —no los ve, no los
guarda— y todo el motor de sincronización sigue en el navegador, hablando directamente con Sheets y
Drive con el token del propio usuario.

Es una distinción que conviene no perder: **el backend es de identidad, no de datos.** La app sigue
siendo local-first y funcionando entera sin conexión; lo único que necesita del servidor es poder
volver a autorizarse.

Y por `drive.file`, ese token solo alcanza los ficheros que esta app creó. Aunque alguien se lo
llevara, no podría leer nada más del Drive de esa persona.

### 4.1 Una hoja por cuenta, no una por dispositivo

La hoja se crea **una sola vez por cuenta**, con el nombre fijo `Clapastedyke — Recetario` y en la raíz
del Drive del usuario. Que el id se recuerde en local no basta para garantizarlo: **lo local es por
navegador y la hoja es por cuenta**, así que un móvil nuevo, otro navegador o unos datos del sitio
borrados llegan sin saber nada. Antes de crear nada, se le pregunta a Drive si la cuenta ya tiene su
hoja (`SyncGateway.locate`, un `files.list` por nombre) y, si la tiene, **se adopta**.

Esa búsqueda no pide ningún permiso extra: `drive.file` alcanza los ficheros que **esta app** creó, y
Drive guarda esa asociación por aplicación —no por dispositivo ni por sesión—, así que la hoja que creó
este mismo Client ID en otro teléfono aparece en la búsqueda. Y no puede tropezar con un fichero ajeno
que se llame igual, porque lo ajeno no está en ese alcance.

Si ya hubiera varias (de una versión anterior, o de dos dispositivos conectando en el mismo instante),
todos eligen **la más antigua** y convergen a ella; las demás se quedan en el Drive del usuario, que es
el único que puede decidir tirarlas. Queda un límite conocido: Drive no ofrece un «crear si no existe»
atómico, así que dos conexiones **simultáneas** pueden crear dos hojas — del ciclo siguiente en adelante
las dos se van a la misma.

### 4.2 El token va donde tiene que ir: en la cabecera

Las APIs REST de Google **sí responden al preflight CORS**, así que desde el navegador se llaman como
cualquier otra: `Authorization: Bearer …` y `Content-Type: application/json`. Está en
`core/external-sync/infrastructure/google-api.ts`, que es el único sitio del contexto que hace red.

Merece la pena saber que la excepción era Apps Script: **un Web App no contesta al `OPTIONS`**, así
que cualquier cabecera propia mataba la llamada antes de salir y obligaba a mandar el token dentro
del cuerpo con `text/plain`. Todo aquel rodeo desapareció al quitar el script de en medio.

### 4.3 Cerrar sesión vacía el aparato entero

Cerrar sesión no es «salir de la cuenta»: deja el navegador **como recién instalado**. `SignOut`
(`core/auth/application/use-cases/sign-out.use-case.ts`) borra las **dos** bases de datos locales —la
de la app y la del bus de eventos—, así que no queda ni una receta, ni un insumo, ni la cola
pendiente, ni la base de comparación con la hoja, ni el enlace a la hoja, ni la pista de sesión. El
contrato es `LocalData` (`core/_common/local-data/`), en el shared kernel: lo que se borra es de todos
los contextos y ninguno puede conocer a otro.

Media limpieza sería peor que ninguna: quien usara después ese aparato vería recetas ajenas y, al
conectar **su** cuenta, se le subirían a **su** hoja.

Tres cosas que dependen del orden y de nada más:

1. **Primero se pierde la conexión, después se borra.** `session.close()` va antes de tocar nada
   local —y antes incluso de avisar al backend, que es red y tarda—. Con sesión viva, un ciclo
   de sincronización podría leer la base ya vacía y no concluiría «no hay nada que subir» sino que el
   usuario **ha borrado su recetario entero**: escribiría esas bajas en la hoja. Cerrar quita la
   credencial (el ciclo se niega a arrancar) y cambia el `epoch` (lo que esté en vuelo tira su
   resultado).
2. **Se borra antes de publicar el evento.** Publicar deja el evento en la cola, que también es
   IndexedDB: al revés, el borrado se lo llevaría por delante y nadie lo recibiría.
3. **La app rearranca** (`platform/restart/app-restart.ts`). Los app-initializers solo corren al
   arrancar, así que solo una carga en frío vuelve a sembrar el recetario de ejemplo; y sin ella, la
   pantalla seguiría enseñando lo que tenía leído de una base que ya no existe.

> **Cerrar sesión NO retira el permiso en Google.** `POST /logout` cierra **esta** sesión: borra
> `sessions/{sid}` y limpia la cookie. La concesión (`users/{sub}`, con el refresh token) se queda, así
> que los otros dispositivos de esa persona siguen conectados y la app sigue apareciendo autorizada en
> su cuenta de Google. Es deliberado —cerrar sesión en el móvil no debería echar a nadie del
> ordenador—, y quien quiera lo otro lo hace desde su cuenta de Google. Ojo: **este aparato sí queda
> vacío**, porque el borrado local es aparte y sí ocurre.

Nada de esto pierde datos para su dueño: **lo que estuviera sincronizado sigue en su hoja de Drive** y
baja de vuelta al conectar otra vez. Lo que sí se pierde es lo que quedara en la cola, así que la
pantalla de cuenta pregunta antes y **dice cuántos cambios son** — es la única que lo sabe. El journey
completo está en `e2e/specs/account/sign-out.spec.ts`.

---

## 5 · Puesta en marcha

**Este documento no explica cómo montarlo.** Los pasos —proyecto de Cloud, consentimiento, Client ID,
client secret y orígenes, y dónde acaba cada valor— viven **solo** en
[`firebase/README.md`](../firebase/README.md), junto al fichero de ambientes donde
acaba el Client ID. La **infraestructura** que necesita la función para existir (proyecto de Firebase,
Blaze, Firestore, la cuenta de despliegue) es otra cosa y está en [`functions.md`](functions.md): el permiso que
concede el usuario sobre su cuenta y el permiso para desplegar lo tuyo no se mezclan. Lo que falla al
usarlo está en [6 · Diagnóstico](#6--diagnóstico).

Lo único que pertenece aquí es la consecuencia de diseño:

### 5.1 Cada scope extra es una casilla más

Google presenta los permisos como **casillas desmarcadas** que el usuario tiene que marcar una por
una. Si no las marca, el token vuelve **sin esos permisos y sin error aparente** — el fallo aparece
mucho después y sin relación visible con la causa.

Con los cuatro scopes de este diseño, el usuario ve **una sola casilla**: la de Drive. Los tres
primeros (`openid`, `email`, `profile`) no suman ninguna. Esa es la razón de no añadir scopes a la
ligera.

> La función se protege de esto comprobando el permiso de Drive en el `scope` concedido **antes de
> guardar nada**, y responde con un mensaje accionable. El navegador lo vuelve a comprobar sobre la
> credencial. **Cualquier scope nuevo necesita su comprobación equivalente.**

### 5.2 Publicar la app no es opcional

El modo *Testing* de la pantalla de consentimiento tenía un solo inconveniente conocido —el techo de
100 correos dados de alta a mano— y ahora tiene otro **mucho peor**: en *Testing*, Google **caduca los
refresh tokens a los 7 días**. Con el backend custodiando esos tokens, eso significa que el problema
original —«se pierde la sesión»— volvería cada semana, y sin ninguna pista de por qué.

Así que la pantalla de consentimiento tiene que estar **«En producción»**. Publicarla no cuesta nada:
`drive.file` no es un permiso sensible y no hay verificación de Google que pasar (2.6). El trámite, en
[`firebase/README.md`](../firebase/README.md) §2.

---

## 6 · Diagnóstico

| Síntoma | Causa | Arreglo |
|---|---|---|
| `Error 400: origin_mismatch` | El origen no está registrado, o es `127.0.0.1` vs `localhost`, o el puerto cambió | [`firebase/README.md`](../firebase/README.md) §3 |
| `UNAUTHENTICATED` | El token de una hora caducó y el backend no ha podido emitir otro | Mirar la respuesta de `<authApiUrl>/refresh`: `401 revoked` = se retiró el acceso (reconectar); `502` = Google no contestó (se reintenta solo) |
| Al recargar pide reconectar | El backend no tiene sesión para este navegador: no llegó ni la cookie `__session` ni el `session_token`, o la concesión ya no vale | Comprobar que `authApiUrl` del `config.json` publicado apunta a la función y que la pantalla de consentimiento está **En producción** (5.2) |
| Al recargar pide reconectar **solo en Safari o iOS** | La cookie de terceros está bloqueada Y el `session_token` de respaldo no se guardó | Mirar en IndexedDB el store `auth_session_token`. Si está vacío tras conectar, el fallo está en `BackendAuthenticator`, no en el navegador |
| La consola dice «blocked by CORS» o un error de red sin código | El origen no está en `ALLOWED_ORIGINS`, la petición murió en el preflight, o `authApiUrl` apunta a otro sitio | Mirar la respuesta del `OPTIONS` en la pestaña de red, y buscar `origen no autorizado` en el registro de la función |
| La app dice «sin conexión» habiendo internet | Casi siempre es lo de arriba: la función no contesta a este origen, y desde el navegador eso es indistinguible de no haber red | Revisar `ALLOWED_ORIGINS` en `firebase/functions/.env` y volver a desplegar la función |
| `REJECTED` | El usuario no marcó la casilla de Drive, o revocó el acceso | Reconectar y marcarla |
| `TARGET_GONE` | La hoja se borró o está en la papelera | Se recrea sola al reconectar; también **Crear una hoja nueva** |
| `INTERNAL` con «*… API has not been used in project …*» | Falta habilitar Sheets o Drive API | *APIs & Services → Library* |
| La ventana de Google no llega a abrirse | Bloqueador de ventanas emergentes | Permitir las emergentes de este sitio y reintentar |
| «*El dato de prueba no ha vuelto igual*» | La hoja existe pero la escritura no cuaja | **Crear una hoja nueva** desde `/cuenta` |
| «*Google está limitando las peticiones*» | Cuota de la API | Esperar y reintentar: la sincronización es idempotente |

---

## Anexo A · El botón «desplegar sincronizador»: investigado y archivado

Se evaluó una arquitectura alternativa en la que **la app despliega un Apps Script en la cuenta de
cada usuario** con un botón, usando la Apps Script API. Se descartó, pero la investigación incluyó
**pruebas reales contra la API** y esos datos son reutilizables.

### A.1 Qué haría

1. `POST sheets.googleapis.com/v4/spreadsheets` → crea la hoja *(scope `drive.file`)*
2. `POST script.googleapis.com/v1/projects` con `{title, parentId: spreadsheetId}` → crea el proyecto
   **vinculado** a la hoja *(scope `script.projects`)*
3. `PUT .../projects/{id}/content` → sube `Code.gs` + `appsscript.json` *(scope `script.projects`)*
4. `POST .../projects/{id}/versions` + `POST .../deployments` → publica *(scope `script.deployments`)*
5. Se guarda la URL `/exec` resultante y se sincroniza contra ella

Como el script lo despliega el usuario, corre **con su identidad**: puede usar
`SpreadsheetApp.getActiveSpreadsheet()` y no necesita validar tokens ni `UrlFetchApp`.

### A.2 Resultados medidos (3 agosto 2026, cuenta real)

| Prueba | Resultado |
|---|---|
| Crear hoja con solo `drive.file` | ✅ **200** — basta `drive.file` |
| Crear proyecto **vinculado** (`parentId`) con `drive.file` | ✅ **200** — se puede vincular |
| Subir contenido con `oauthScopes: [spreadsheets.currentonly]` | ✅ **200** — manifiesto aceptado |
| Crear versión y despliegue | ✅ **200** |
| `GET` al `/exec` recién desplegado | ✅ `{"ok":true,"service":"spike","sheet":"…"}` |

**Dos conclusiones que no están claras en la documentación de Google:**

1. **Un Web App desplegado por API queda operativo de inmediato.** No hace falta que el usuario
   autorice el script a mano en el editor.
2. **`spreadsheets.currentonly` funciona** en un script vinculado: `getActiveSpreadsheet()` devolvió
   el nombre de la hoja. Es el scope más estrecho que existe — alcanza *esa* hoja y ninguna otra.

### A.3 El bloqueante: el interruptor por usuario

```
403 · "User has not enabled the Apps Script API.
       Enable it by visiting https://script.google.com/home/usersettings then retry."
```

**La Apps Script API viene desactivada por defecto en toda cuenta de Google, y no hay API para
activarla.** Google lo diseñó así a propósito: es el permiso que autoriza a programas externos a
crear código dentro de tu cuenta.

Es decir: **cada usuario** tendría que visitar esa página y darle a un interruptor. No es un caso de
error raro — es el camino normal de todo usuario nuevo.

### A.4 Son DOS errores 403 distintos, y hay que distinguirlos

Es fácil confundirlos: los dos son `403` / `PERMISSION_DENIED` y los dos hablan de habilitar la Apps
Script API. Pero uno lo arregla el desarrollador una vez y **ningún usuario lo ve jamás**; el otro lo
sufre cada usuario.

| | Error de Cloud (del desarrollador) | Error de cuenta (de cada usuario) |
|---|---|---|
| `details[].@type` | `ErrorInfo` + `LocalizedMessage` + `Help` | **solo** `LocalizedMessage` |
| `reason` | `SERVICE_DISABLED` | **no existe** |
| URL del mensaje | `console.developers.google.com` | `script.google.com/home/usersettings` |
| Se arregla en | Cloud Console, una vez | Ajustes de la cuenta, por usuario |

```ts
// El código de estado no distingue nada: hay que mirar los detalles.
const isServiceDisabled = details.some(
  (d) => d['@type']?.endsWith('ErrorInfo') && d.reason === 'SERVICE_DISABLED',
);
const isUserToggleOff =
  !isServiceDisabled && message.includes('script.google.com/home/usersettings');
```

> Detectar por substring del mensaje **no** funciona: los dos contienen «Apps Script API» y «enable».

### A.5 Por qué se archivó

| | Diseño actual | Con el botón |
|---|---|---|
| Casillas en el consentimiento | **1** | 3 |
| Pasos fuera de la app, por usuario | **0** | 1 (el interruptor) |
| Clicks dentro de la app | **1** | 2 |
| Techo de usuarios | sin límite práctico | **100** sin verificación |
| Trabajo del desarrollador | 15 min, una vez | ninguno adicional |
| Cuota de Apps Script | del desarrollador | de cada usuario |
| Código a escribir | **ninguno** | contexto de aprovisionamiento completo |

**El intercambio es malo**: se cambia una tarea del desarrollador de 15 minutos que se hace una sola
vez por un paso manual que hacen todos los usuarios, para siempre. Además, `script.projects` y
`script.deployments` son **scopes sensibles**: abrir la app a más de 100 personas exigiría pasar la
verificación de Google, que `drive.file` evita.

**Cuándo reconsiderarlo:** si la cuota de Apps Script del desarrollador empieza a apretar (decenas de
usuarios activos sincronizando mucho), o si dejar de estar en el camino de los datos de los usuarios
pasa a ser un requisito.

### A.6 Detalle de seguridad, si algún día se retoma

El script simplificado (sin validación de token) desplegado como `ANYONE_ANONYMOUS` deja el `/exec`
**abierto a cualquiera que tenga la URL**. En el diseño actual eso lo tapa la validación del token.

La mitigación decidida fue un **secreto compartido**: se genera un UUID al desplegar, se sustituye
como constante en el `Code.gs` antes de subirlo, se guarda junto a la URL y viaja en el cuerpo de
cada POST. El script falla cerrado si no coincide.

Otro detalle no obvio: al pasar de la API REST a `SpreadsheetApp` hay que poner **formato de texto
(`setNumberFormat('@')`) en toda columna no numérica**. `setValues()` interpreta los strings como si
los tecleara un usuario: un insumo llamado «12/03» se volvería fecha y uno que empiece por `=` una
**fórmula**. Es el equivalente del `valueInputOption: 'RAW'` que usa la API REST.

---

## Anexo B · Dónde vive cada cosa en el código

| Qué | Dónde |
|---|---|
| Todo lo que sabe que el proveedor es Google, en el navegador | `core/auth/infrastructure/google-code-client.ts` |
| Los scopes que se piden | mismo fichero, constante `SCOPES` |
| El adaptador que habla con el backend | `core/auth/infrastructure/backend-authenticator.ts` |
| El cliente confidencial (canje, refresco, cierre de sesión) | `firebase/functions/` — su contrato en [`../firebase/functions/README.md`](../firebase/functions/README.md) |
| La credencial y su caducidad | `core/auth/domain/value-objects/credential.ts` |
| Traducción de sesión → contrato compartido | `core/auth/infrastructure/session-credentials-provider.ts` |
| El puerto agnóstico del destino | `core/external-sync/domain/services/sync.gateway.ts` |
| Todo lo que sabe que el destino es una hoja | `core/external-sync/infrastructure/google-sheets.gateway.ts` |
| El transporte HTTP hacia Google | `core/external-sync/infrastructure/google-api.ts` |
| El esquema de la hoja y la fusión | `core/external-sync/infrastructure/sheet-schema.ts` + `sheet-merge.ts` |
| La cola durable | `core/external-sync/infrastructure/indexeddb-sync-outbox.ts` |
| Las cinco ramas de salida de la sincronización | `core/external-sync/application/use-cases/synchronize.use-case.ts` |
| La configuración del despliegue | `public/config.json` y `firebase/functions/.env`, con marcadores que sustituye el pipeline |
| La pantalla | `features/account/` |

**Cambiar de proveedor de identidad** es escribir otro `Authenticator` y tocar una línea de
`auth.providers.ts`. **Cambiar de destino** es escribir otro `SyncGateway` y tocar una línea de
`external-sync.providers.ts`. Ni `auth` ni `external-sync` nombran a Google en su dominio ni en su
capa de aplicación.
