# Integración con Google — modelo mental y decisiones

Este documento es el **por qué**. El paso a paso para ponerlo en marcha está en
[`google-setup.md`](google-setup.md); aquí está lo que hay que entender antes de tocarlo, las alternativas
que se evaluaron y los datos medidos que respaldan cada decisión.

Se escribió después de una investigación con pruebas reales contra la API de Google (agosto 2026).
Los resultados del [Anexo A](#anexo-a--el-botón-«desplegar-sincronizador»-investigado-y-archivado)
costaron una tarde de obtener; están aquí para no repetirla.

---

## 1 · Qué es la integración, y qué no es

**La app es local-first.** IndexedDB es la fuente de verdad y no hay backend. La integración con
Google Sheets es **opcional y aditiva**: un espejo de una sola vía (app → hoja) que el usuario
enciende si quiere.

Consecuencias que conviene tener presentes:

- **Con la integración apagada no cambia nada.** Es el estado por defecto: `public/config.json` sale
  del repositorio con `googleClientId` vacío.
- **Nunca se lee de la hoja.** El puerto `SyncGateway` solo tiene `send()`. Si algún día la hoja
  fuera también entrada, habría que resolver conflictos, merge y deduplicación entre dos fuentes que
  escriben a la vez — un capítulo aparte, no una ampliación.
- **Guardar nunca depende de la red.** El caso de uso escribe en IndexedDB y encola; la
  sincronización va por su cuenta y su fallo no bloquea nada.

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

Lo que hoy usa el proyecto es el **modelo de token de Google Identity Services** (popup). El modelo
de código con `ux_mode: 'redirect'` existe, pero devuelve un `code` que hay que canjear **en un
servidor**: redirect exige backend.

### 2.3 Un cliente de navegador no obtiene refresh token

El token caduca en **~1 hora** y no hay forma fiable de renovarlo en silencio. El flujo implícito
(`response_type=token`), que sería la vía sin backend, **fue eliminado en OAuth 2.1** por fuga de
tokens en la URL — y arrastraba el mismo problema.

Por tanto: **la reconexión periódica no es un defecto de la implementación, es una propiedad de la
plataforma.** La única forma de evitarla es un cliente confidencial (un servidor que custodie
refresh tokens), que es justamente lo que este proyecto no quiere ser.

### 2.4 La credencial no se persiste: recargar la página obliga a reconectar

`Credential` vive **solo en memoria** (`core/auth/domain/value-objects/credential.ts`). No está en
`localStorage`, ni en IndexedDB, ni en una cookie. Es deliberado: cerrar sesión o recargar la borra
sin que haya que acordarse de limpiar nada, y un token no se queda olvidado en el disco del usuario.

Esto muerde más que la caducidad de una hora: **F5 = reconectar**, aunque hayan pasado cinco
segundos.

Se puede cambiar, y este es el intercambio:

| Dónde guardarlo | Sobrevive a… | Coste |
|---|---|---|
| **Memoria** (lo actual) | nada | Reconectar en cada recarga |
| `sessionStorage` | recarga sí, cerrar pestaña no | El token es legible por cualquier XSS mientras dure |
| IndexedDB / `localStorage` | todo, hasta que caduque | Igual, y además persiste en disco |

Ninguna opción pasa de **1 hora**, porque ahí caduca el token.

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

El scope se lee así: *«solo los ficheros específicos de Drive que uses con esta app»*. No es «solo
lectura» ni «solo crear»: sobre **los ficheros que la app ha creado** puede todo — leerlos, escribirlos
y borrarlos. Sobre el resto del Drive, nada; ni siquiera listarlo.

De ahí sale toda la arquitectura actual: la app **crea** la hoja, y por haberla creado puede
**escribirla**, sin pedir un permiso más ancho y sin nada intermedio. Medido: crear la hoja con solo
`drive.file` devuelve 200 ([Anexo A.2](#a2-resultados-medidos-3-agosto-2026-cuenta-real)).

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
Navegador                                            Drive del usuario
─────────                                            ─────────────────
IndexedDB (fuente de verdad)
    │
    │ evento de dominio
    ▼
SyncOutbox (cola durable)
    │
    │ Authorization: Bearer <token DEL USUARIO>
    │
    ├─ GET  drive/v3/files/{id}          ¿sigue estando la hoja?
    ├─ POST sheets/v4/spreadsheets       crearla, la primera vez
    ├─ GET  …/values:batchGet            leer lo que ya hay
    │       (fusionar por id, en la app)
    └─ POST …/values:batchUpdate  ───────────────────►  «Clapastedyke — Recetario»
```

**Entre la app y la hoja no hay nada.** No hay servidor, ni script alojado, ni intermediario que
custodie credenciales: la autorización es el token del propio usuario, que vive en memoria y muere
con la sesión. Lo único que se recuerda entre sesiones es **el id de su hoja** — un identificador de
fichero, no un secreto.

Y por `drive.file`, ese token solo alcanza los ficheros que esta app creó. Aunque alguien se lo
llevara, no podría leer nada más del Drive de esa persona.

### 4.1 El token va donde tiene que ir: en la cabecera

Las APIs REST de Google **sí responden al preflight CORS**, así que desde el navegador se llaman como
cualquier otra: `Authorization: Bearer …` y `Content-Type: application/json`. Está en
`core/external-sync/infrastructure/google-api.ts`, que es el único sitio del contexto que hace red.

Merece la pena saber que la excepción era Apps Script: **un Web App no contesta al `OPTIONS`**, así
que cualquier cabecera propia mataba la llamada antes de salir y obligaba a mandar el token dentro
del cuerpo con `text/plain`. Todo aquel rodeo desapareció al quitar el script de en medio.

### 4.2 Por qué `drive.file` y no otro scope

`drive.file` alcanza **solo los ficheros que la propia app crea**. No puede listar ni leer nada más
del Drive del usuario. Por eso Google **no lo considera sensible** y no exige verificación de la app.

En la pantalla de consentimiento se lee: *«See, edit, create, and delete only the specific Google
Drive files you use with this app»*. Esa coletilla final es todo.

La alternativa (`drive` a secas) daría acceso al Drive entero. **Un scope de solo lectura no es
viable**: la app escribe.

---

## 5 · Puesta en marcha

El procedimiento completo está en [`google-setup.md`](google-setup.md). Aquí solo las **trampas** que se
descubrieron ejecutándolo, porque son las que hacen perder una tarde:

### 5.1 Google renombró la consola

Lo que la documentación de Google (y muchos tutoriales) llaman «Pantalla de consentimiento de OAuth»
ahora es **Google Auth Platform**, partido en secciones:

| Antes | Ahora |
|---|---|
| Pantalla de consentimiento → Datos de la app | `Branding` |
| Pantalla de consentimiento → Tipo de usuario / Usuarios de prueba | `Audience` |
| Pantalla de consentimiento → Permisos | `Data Access` |
| Credenciales → Crear credenciales → ID de cliente | `Clients` |

### 5.2 Los scopes no aparecen si la API no está habilitada

En `Data Access` solo se ofrecen los permisos de las APIs **habilitadas en el proyecto**. Si
`drive.file` no aparece, falta habilitar Google Drive API en *APIs y servicios → Biblioteca*.

Los que no salgan en la lista se añaden con la caja **«Manually add scopes»**.

### 5.3 `localhost` y `127.0.0.1` son orígenes distintos para Google

Aunque sean la misma máquina. Los servidores locales imprimen las dos URLs al arrancar; si registras
una y abres la otra, sale `Error 400: origin_mismatch`. **Registra las dos.**

Y ojo con el **puerto**: si el 4200 está ocupado, muchos servidores estáticos cogen otro sin avisar.
Para salir de dudas, en la consola del navegador:

```js
location.origin;  // esto, carácter por carácter, es lo que tiene que estar registrado
```

### 5.4 Sin usuarios de prueba, nadie puede conectar

Mientras la app esté en modo *Testing*, **todo correo que vaya a usarla tiene que estar en
`Audience → Test users`** (máximo 100). Quien no esté verá un error de acceso aunque el resto esté
perfecto.

### 5.5 Cada scope extra es una casilla más

Google presenta los permisos como **casillas desmarcadas** que el usuario tiene que marcar una por
una. Si no las marca, el token vuelve **sin esos permisos y sin error aparente** — el fallo aparece
mucho después y sin relación visible con la causa.

Con los cuatro scopes de este diseño, el usuario ve **una sola casilla**: la de Drive. Los tres
primeros (`openid`, `email`, `profile`) no suman ninguna.

> `GoogleAuthenticator` se protege de esto comprobando `credential.allows(DRIVE_FILE_PERMISSION)`
> nada más recibir el token, y falla con un mensaje accionable. **Cualquier scope nuevo necesita su
> comprobación equivalente.**

### 5.6 El techo de 100 usuarios, y cómo se quita

Mientras la pantalla de consentimiento esté en *Testing*, hay que añadir el correo de cada persona a
mano y **quien no esté en la lista ve un error al conectar**. Publicándola se acaba esa tarea: sale
una pantalla de «app no verificada» que se salta con un clic, y **no hace falta pasar la
verificación** porque `drive.file` no es un scope sensible. Es el único límite operativo que queda.

---

## 6 · Diagnóstico

| Síntoma | Causa | Arreglo |
|---|---|---|
| `Error 400: origin_mismatch` | El origen no está registrado, o es `127.0.0.1` vs `localhost`, o el puerto cambió | Ver 5.3 |
| `UNAUTHENTICATED` | El token caducó (dura una hora) | Reconectar; lo pendiente se reintenta |
| `REJECTED` | El usuario no marcó la casilla de Drive, o revocó el acceso | Reconectar y marcarla |
| `TARGET_GONE` | La hoja se borró o está en la papelera | Se recrea sola al reconectar; también **Crear una hoja nueva** |
| Al recargar pide reconectar | **Es el comportamiento correcto** | Ver 2.4 |
| `INTERNAL` con «*… API has not been used in project …*» | Falta habilitar Sheets o Drive API | *APIs y servicios → Biblioteca* |

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
| Todo lo que sabe que el proveedor es Google | `core/auth/infrastructure/google-authenticator.ts` |
| Los scopes que se piden | mismo fichero, constante `SCOPES` |
| La credencial y su caducidad | `core/auth/domain/value-objects/credential.ts` |
| Traducción de sesión → contrato compartido | `core/auth/infrastructure/session-credentials-provider.ts` |
| El puerto agnóstico del destino | `core/external-sync/domain/services/sync.gateway.ts` |
| Todo lo que sabe que el destino es una hoja | `core/external-sync/infrastructure/google-sheets.gateway.ts` |
| El transporte HTTP hacia Google | `core/external-sync/infrastructure/google-api.ts` |
| El esquema de la hoja y la fusión | `core/external-sync/infrastructure/sheet-schema.ts` + `sheet-merge.ts` |
| La cola durable | `core/external-sync/infrastructure/indexeddb-sync-outbox.ts` |
| Las cinco ramas de salida de la sincronización | `core/external-sync/application/use-cases/synchronize.use-case.ts` |
| La configuración del despliegue | `public/config.json` |
| La pantalla | `features/account/` |

**Cambiar de proveedor de identidad** es escribir otro `Authenticator` y tocar una línea de
`auth.providers.ts`. **Cambiar de destino** es escribir otro `SyncGateway` y tocar una línea de
`external-sync.providers.ts`. Ni `auth` ni `external-sync` nombran a Google en su dominio ni en su
capa de aplicación.
