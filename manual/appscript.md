# Integración con Google Sheets vía Apps Script

Guía completa de la parte **manual** de la integración: lo que hay que hacer una vez en Google Cloud
y en Google Apps Script para que la app pueda escribir el recetario en la hoja de cálculo de cada
usuario. El código de la app ya está listo; sin estos pasos, la pantalla `/cuenta` no puede conectar.

Se hace una sola vez por despliegue. Tiempo aproximado: **20 minutos**.

> **Los mismos pasos están dentro de la app**, en `/cuenta` → tarjeta **Puesta en marcha**, con
> botones de copiar para el código y para cada valor que hay que pegar en la consola de Google. Si
> tienes la app delante, es el camino corto; este documento añade el porqué de cada ajuste y el
> diagnóstico de fallos.
>
> El código del Web App vive en este mismo repositorio, bajo **`public/`** para que la app pueda
> servirlo y enseñarlo:
> [`public/apps-script/Code.gs`](../public/apps-script/Code.gs) y
> [`public/apps-script/appsscript.json`](../public/apps-script/appsscript.json). No hay que escribir
> nada: se copia y se pega.

> **Este documento es el «cómo». El «por qué» está en
> [`google-integration.md`](google-integration.md)**: por qué hace falta el login de Google, por qué
> el token va en el cuerpo del POST, por qué recargar la página obliga a reconectar, qué
> arquitecturas se descartaron y con qué datos. Si algo de aquí te parece arbitrario, la respuesta
> está allí.

---

## Estado de la integración

| Pieza                                | Dónde vive                                | Automático |
| ------------------------------------ | ----------------------------------------- | ---------- |
| Proyecto de Google Cloud + APIs      | console.cloud.google.com                  | ❌ manual  |
| Pantalla de consentimiento + Client ID | console.cloud.google.com                | ❌ manual  |
| Proyecto de Apps Script + despliegue | script.google.com                         | ❌ manual  |
| URL del Web App                      | `public/config.json`                      | ❌ manual  |
| Client ID de OAuth                   | `public/config.json`                      | ❌ manual (uno para todo el despliegue) |
| Creación de la hoja de cálculo       | la crea el script en el Drive del usuario | ✅ automático |
| Pestañas, cabeceras y escritura      | el script                                 | ✅ automático |

---

## 1 · Qué vas a montar

```
Navegador (la app)                    Apps Script (Web App)              Google
──────────────────                    ─────────────────────              ──────
1. El usuario pulsa «Conectar»
2. Google Identity Services  ───────────────────────────────────────►  elige cuenta
   devuelve un access_token   ◄───────────────────────────────────────  y da permiso
3. POST { op, accessToken, payload }  ─────►  4. valida el token  ─────►  tokeninfo
   (text/plain, sin preflight)                   (¿de quién es?
                                                  ¿de MI Client ID?)
                                             5. localiza o crea la
                                                hoja CON EL TOKEN     ─────►  Drive/Sheets API
                                                DEL USUARIO                    (Drive del usuario)
                                             6. upsert de las filas
   ◄─────  { ok, spreadsheetUrl, applied }
```

Tres cosas que conviene entender antes de tocar nada:

**La app nunca llama a las APIs de Google Sheets ni de Drive.** Solo habla con el Web App. Toda la
escritura la hace el script.

**El despliegue es «Ejecutar como: yo» y «Cualquiera», y aun así los datos siguen aislados.** Es la
parte que más confunde. Un navegador no puede mandar la cabecera `Authorization` a un Web App de
Apps Script: eso convertiría la llamada en «no simple» y el navegador haría antes una petición
`OPTIONS` (preflight CORS) que Apps Script no contesta. Por eso el token viaja en el **cuerpo** de un
POST `text/plain`, y por eso el despliegue tiene que aceptar peticiones sin sesión de Google.

Lo que autoriza no es el despliegue, es **el token del usuario**:

1. El script valida el token contra `tokeninfo` y **rechaza** el que no se haya emitido para tu
   Client ID (propiedad `ALLOWED_CLIENT_IDS`). Si esa propiedad está vacía, rechaza todo.
2. El script **no usa `SpreadsheetApp` ni `DriveApp`** — esas APIs actuarían con la identidad del
   dueño del script. Usa las **APIs REST con el token de quien llama**, así que la hoja se crea y se
   escribe en el Drive de ese usuario y en ningún otro.

**El permiso que se pide es el más estrecho que sirve: `drive.file`.** Da acceso solo a los ficheros
que la propia app crea, así que Google lo considera *no sensible* y no exige un proceso de
verificación. La contrapartida está en la sección 12: el script **no puede ver** una hoja que hayas
creado tú a mano.

---

## 2 · Proyecto de Google Cloud y APIs

1. Entra en [console.cloud.google.com](https://console.cloud.google.com/) y crea un proyecto (o elige
   uno existente). El nombre da igual; por ejemplo `clapastedyke`.
2. Ve a **APIs y servicios → Biblioteca** y habilita las dos:
   - **Google Sheets API**
   - **Google Drive API**

> **Por qué aquí.** El token se emite para el Client ID de *este* proyecto, y las llamadas del script
> consumen la cuota de *este* proyecto. Si las APIs no están habilitadas, el script responderá
> `INTERNAL` con un mensaje de Google del tipo *«Google Sheets API has not been used in project …»*.

---

## 3 · Google Auth Platform (el consentimiento)

> **Google renombró esta pantalla.** Lo que antes era «Pantalla de consentimiento de OAuth» ahora se
> llama **Google Auth Platform** y está partido en secciones: *Overview · Branding · Audience ·
> Clients · Data Access · Verification Center · Settings*. Es lo mismo, con otros nombres. Abajo va
> la equivalencia.

Si es un proyecto nuevo verás **«Google Auth Platform not configured yet»** y un botón **Get
started**. Te pedirá cuatro cosas seguidas:

1. **App name** — el nombre que verá el usuario al conectar (p. ej. `Clapastedyke`).
2. **User support email** — tu correo.
3. **Audience** → **External**. (*Internal* solo existe con Google Workspace y limitaría la app a tu
   organización.)
4. **Contact information** — tu correo. Aceptas la política y **Create**.

Después, dos secciones:

### `Data Access` — los permisos (antes «Permisos / scopes»)

**Add or remove scopes**. Los de identidad salen en la lista; `drive.file` puede que no, así que usa
la caja **«Manually add scopes»** y pega estos cuatro:

| Scope                                        | Para qué                                    |
| -------------------------------------------- | ------------------------------------------- |
| `openid`                                      | identificar la cuenta de forma estable      |
| `.../auth/userinfo.email`                     | saber a qué correo pertenece la hoja        |
| `.../auth/userinfo.profile`                   | mostrar el nombre en la pantalla de cuenta  |
| `https://www.googleapis.com/auth/drive.file`  | crear y escribir **solo** la hoja de la app |

> **Si un scope no aparece, falta el paso 2.** Los permisos de una API solo se ofrecen cuando esa
> API está habilitada en el proyecto. Comprueba Sheets y Drive en *APIs y servicios → Biblioteca*.

**Estos cuatro y ninguno más.** Cada scope extra es una casilla más que el usuario tiene que marcar
en la pantalla de consentimiento. Con estos cuatro ve **una sola**: la de Drive.

### `Audience` — los usuarios de prueba

Baja a **Test users → Add users** y añade el correo de cada persona que vaya a usarla (máximo 100).
**Quien no esté en la lista verá un error al conectar**, aunque todo lo demás esté bien.

> **¿Hay que publicar la app?** Solo si van a usarla más de 100 personas o no quieres ir añadiendo
> correos. Al publicar, Google muestra una pantalla de «app no verificada» que el usuario puede
> saltarse; **no hace falta pasar la verificación** porque `drive.file` no es un scope sensible.

---

## 4 · Client ID de OAuth

Ahora está en **Google Auth Platform → `Clients` → Create client** (antes: *APIs y servicios →
Credenciales → Crear credenciales*).

1. **Application type**: **Web application**.
2. **Authorized JavaScript origins** — uno por cada sitio desde el que se abra la app:

   ```
   http://localhost:4200          ← desarrollo (ng serve y los E2E)
   http://127.0.0.1:4200          ← el mismo servidor por la otra vía; ver abajo
   https://TU-USUARIO.github.io   ← la demo publicada
   ```

   > **Es el origen, sin ruta**: `https://tu-usuario.github.io`, **no**
   > `https://tu-usuario.github.io/clapastedyke/`. Con la ruta incluida, Google rechaza el formulario
   > o la conexión falla.
   >
   > **`localhost` y `127.0.0.1` son orígenes DISTINTOS para Google**, aunque sean la misma máquina.
   > Los servidores locales suelen imprimir las dos URLs al arrancar; si registras una y abres la
   > otra, sale `Error 400: origin_mismatch`. Lo cómodo es registrar las dos.
   >
   > Y ojo con el **puerto**: si 4200 está ocupado, muchos servidores estáticos cogen otro sin
   > avisar. Para salir de dudas, en la consola del navegador: `location.origin` — eso, carácter por
   > carácter, es lo que tiene que estar registrado.

3. **Authorized redirect URIs**: ninguno. El modelo de token de Google Identity Services no los usa.
4. Copia el **Client ID** (acaba en `.apps.googleusercontent.com`). Lo necesitas dos veces: en el
   paso 6 y en el paso 8.

---

## 5 · Proyecto de Apps Script

1. Entra en [script.google.com](https://script.google.com/) y crea un **proyecto nuevo**. Ponle un
   nombre reconocible: `Clapastedyke · sincronización`.
2. Borra el contenido de `Código.gs` y pega **todo** [`public/apps-script/Code.gs`](../public/apps-script/Code.gs).
3. Muestra el manifiesto: **⚙ Configuración del proyecto → Mostrar el archivo de manifiesto
   "appsscript.json"**. Abre el fichero que aparece en el editor y sustituye su contenido por
   [`public/apps-script/appsscript.json`](../public/apps-script/appsscript.json):

   ```json
   {
     "timeZone": "America/Lima",
     "dependencies": {},
     "exceptionLogging": "STACKDRIVER",
     "runtimeVersion": "V8",
     "oauthScopes": ["https://www.googleapis.com/auth/script.external_request"],
     "webapp": { "executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS" }
   }
   ```

   El único permiso que el script necesita para sí mismo es **hacer peticiones externas**
   (`script.external_request`): todo lo demás lo hace con el token del usuario.

4. Guarda (**Ctrl/Cmd + S**).

---

## 6 · Propiedades del script

En **⚙ Configuración del proyecto → Propiedades de la secuencia de comandos → Añadir propiedad**:

| Propiedad            | Valor                                          | Obligatoria |
| -------------------- | ---------------------------------------------- | ----------- |
| `ALLOWED_CLIENT_IDS` | el Client ID del paso 4 (varios, separados por comas) | **Sí** |
| `SPREADSHEET_NAME`   | `Clapastedyke — Recetario`                      | No (es el valor por defecto) |

> **`ALLOWED_CLIENT_IDS` es el cerrojo de seguridad.** Sin ella el script **rechaza todas las
> peticiones** (falla cerrado, a propósito). Con ella, un token emitido para otra aplicación —aunque
> sea válido— no sirve para escribir aquí.

---

## 7 · Desplegar como aplicación web

**Implementar → Nueva implementación → ⚙ → Aplicación web**:

| Campo                | Valor                  |
| -------------------- | ---------------------- |
| Descripción          | `v1`                   |
| **Ejecutar como**    | **Yo** (tu cuenta)     |
| **Quién tiene acceso** | **Cualquiera**       |

Pulsa **Implementar**. La primera vez Google pedirá autorizar el script (es tu propia autorización
para que pueda hacer peticiones externas): acepta.

Copia la **URL de la aplicación web**. Termina en `/exec`:

```
https://script.google.com/macros/s/AKfycb…/exec
```

> ⚠️ La URL que acaba en **`/dev`** no sirve: exige sesión de Google y devuelve HTML en vez de JSON.
> Si la app dice *«La respuesta del Apps Script no es JSON»*, casi siempre es esto.

**Comprobación rápida:** abre la URL `/exec` en una pestaña. Debes ver
`{"ok":true,"service":"clapastedyke-sheet-sync",...}`. Si en su lugar sale una pantalla de inicio de
sesión, el despliegue no está en «Cualquiera».

---

## 8 · Conectar la app

Dos datos, en dos sitios distintos a propósito:

**La URL del script → `public/config.json`** (es del despliegue, igual para todos):

```json
{
  "debug": false,
  "appsScriptUrl": "https://script.google.com/macros/s/AKfycb…/exec",
  "googleClientId": ""
}
```

Se lee en runtime, así que **se puede cambiar sin recompilar**: basta editar el fichero dentro de
`dist/misaevol/browser/` en el servidor.

`"debug"` es lo que controla el registro en consola. El repo lo trae en `true` (para desarrollar); en
un despliegue publicado ponlo en **`false`** para no volcar el detalle del flujo en la consola del
usuario. Los `warn` y los `error` se ven igual: eso no se puede apagar. Ver
[logging-conventions.md](.claude/rules/logging-conventions.md). Al desplegarse en GitHub Pages con
`--base-href /clapastedyke/`, la app lo pide como `config.json` relativo y resuelve solo.

**El Client ID → también `public/config.json`**, en `googleClientId`. Es uno solo para todo el
despliegue —identifica a la aplicación, no al usuario—, así que **no se pide en la pantalla**:
`/cuenta` lo lee de aquí y se limita a decir si está o no configurado.

> Ni la URL ni el Client ID se configuran desde la app: son del despliegue, no del usuario.

---

## 9 · Primer arranque

1. Arranca la app (`ng serve`) y entra en **`/cuenta`** (o pulsa **Cuenta**, arriba a la derecha en la
   cocina).
2. Pulsa **Conectar con Google**. La pantalla enseña una lista de cinco pasos que se van marcando:

   | Paso                                     | Qué comprueba                                                        |
   | ---------------------------------------- | -------------------------------------------------------------------- |
   | Leyendo la configuración de la app       | que el despliegue trae `googleClientId`                                |
   | Conectando con tu cuenta de Google       | el consentimiento y el permiso `drive.file`                            |
   | Preparando la hoja en tu Drive           | `op: hello` — el script localiza la hoja o la crea                     |
   | Enviando y leyendo un dato de prueba     | `op: verify` — escribe en `_meta!B6` y **lo vuelve a leer** de la hoja |
   | Sincronizando tu recetario               | `op: upsert` con el recetario entero                                   |

   El cuarto es el que de verdad dice que la integración funciona: que la cuenta conecte no prueba
   que se pueda escribir, y que una escritura no dé error no prueba que lo escrito esté. Si un paso
   falla, los siguientes se quedan pendientes y el motivo sale bajo el paso roto — busca su código en
   [Solución de problemas](#12--solución-de-problemas). **Reintentar** vuelve a empezar desde arriba:
   los cinco pasos son idempotentes.
3. Elige la cuenta y acepta el permiso *«Ver y gestionar los archivos de Google Drive que hayas
   abierto o creado con esta aplicación»*.
4. Al terminar los cinco pasos deberías ver:
   - **Conexión lista** bajo la lista;
   - el estado en **Al día** y la fecha de la última sincronización;
   - el enlace **Abrir la hoja en Google Sheets**;
   - en tu Drive, en la **raíz**, un fichero **«Clapastedyke — Recetario»** con estas pestañas:

     | Pestaña         | Contenido                                              |
     | --------------- | ------------------------------------------------------ |
     | `Insumos`       | un insumo por fila, con su precio de compra y su empaque |
     | `Recetas`       | una receta por fila, con categoría, sabor y capacidades  |
     | `RecetaInsumos` | una línea por insumo de cada receta                      |
     | `Categorias`, `Sabores`, `Capacidades` | tablas de referencia que citan las recetas |
     | `_meta`         | versión del esquema, fecha de la última sincronización y, en la fila 6, el último dato de prueba |

5. Vuelve a la cocina, crea o edita una receta y mira la hoja: la fila aparece o se actualiza sola,
   sin que el guardado tarde más de lo normal.

---

## 10 · Volver a desplegar tras editar `Code.gs`

**Guardar el fichero NO despliega nada.** Es la causa número uno de «he arreglado el error y sigue
igual».

**Implementar → Gestionar implementaciones → ✏️ (editar) → Versión: _Nueva versión_ → Implementar.**

Así se conserva **la misma URL `/exec`** y no hay que tocar `config.json`. Si en su lugar creas una
*Nueva implementación*, obtendrás una URL distinta y tendrás que actualizar la configuración.

---

## 11 · Verificación

Lista de comprobación del montaje completo:

- [ ] La URL `/exec` abierta en el navegador devuelve `{"ok":true,"service":"clapastedyke-sheet-sync",…}`
      con `"ops":["hello","upsert","verify"]` — si falta `verify`, el despliegue está anticuado (paso 10).
- [ ] `/cuenta` recorre los **cinco pasos** hasta *Conexión lista* y muestra el correo de la cuenta.
- [ ] En `_meta!B6` hay un identificador: es el último dato de prueba que fue y volvió.
- [ ] La hoja aparece en la **raíz** del Drive de esa cuenta, con sus 7 pestañas y sus cabeceras.
- [ ] Crear una receta añade su fila en `Recetas` y sus líneas en `RecetaInsumos`.
- [ ] Editar el precio de un insumo **actualiza** su fila; no crea una segunda.
- [ ] Pulsar **Sincronizar todo** dos veces seguidas deja el mismo número de filas (idempotencia).
- [ ] Con la red cortada, el estado pasa a **Error** con un mensaje, y la app sigue guardando en
      local; al volver la red, **Sincronizar todo** deja la hoja al día.
- [ ] **Cerrar sesión** vacía el estado: sin correo, sin enlace a la hoja, estado *Sin conectar*.
- [ ] Conectar con una **segunda cuenta** crea una hoja distinta en el Drive de esa cuenta, y ninguna
      fila de la primera aparece en ella.

### Probar el script sin la app

`Code.gs` incluye una función `test_()`. Para usarla:

1. Consigue un `access_token` de la cuenta con el scope `drive.file` —el más cómodo es
   [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) con tu propio Client ID, o
   copiarlo de la app en depuración.
2. Pégalo en la constante `TEST_ACCESS_TOKEN` de la función.
3. Ejecuta `test_` desde el editor y mira **Ver → Registros**: debe salir un JSON con `"ok":true`.

---

## 12 · Solución de problemas

| Síntoma                                                                     | Causa                                                              | Solución                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Error de **CORS** en la consola del navegador                                | Alguien añadió una cabecera propia o `application/json` a la llamada | La app manda `text/plain` sin cabeceras extra a propósito. No tocar `apps-script-endpoint.ts`. |
| *«La respuesta del Apps Script no es JSON»*                                  | La URL acaba en `/dev`, o el despliegue pide iniciar sesión         | Usa la URL `/exec` y despliega con acceso **Cualquiera** (paso 7)                              |
| `Script function not found: doPost`                                          | El proyecto no está desplegado como aplicación web                  | Paso 7                                                                                          |
| *«Operación desconocida: verify»*                                            | El script desplegado es anterior a la comprobación de ida y vuelta  | Copia el `Code.gs` actual y **vuelve a desplegar** (paso 10)                                    |
| *«El dato de prueba no ha vuelto igual que como se envió»*                   | La hoja existe pero la escritura no cuaja: despliegue a medias, o el `_meta` protegido | Vuelve a desplegar (paso 10); si sigue, borra la hoja y deja que el script la recree |
| `CLIENT_MISMATCH`                                                            | El token se emitió para otro Client ID                              | Revisa `ALLOWED_CLIENT_IDS` (paso 6) y `googleClientId` en `public/config.json`                 |
| *«El script no tiene ALLOWED_CLIENT_IDS configurado»*                        | Falta la propiedad                                                  | Paso 6 — sin ella el script rechaza todo por diseño                                            |
| `SCOPE_MISSING`                                                              | Se conectó sin aceptar el permiso de Drive                          | Cierra sesión, vuelve a conectar y acepta la casilla                                            |
| `UNAUTHENTICATED` / *«El token no es válido o ha caducado»*                  | El token dura una hora                                              | Vuelve a **Conectar con Google**; los cambios pendientes se reintentan                          |
| La ventana de Google no se abre                                              | Bloqueador de ventanas emergentes                                   | Permite las emergentes de este sitio y reintenta                                                |
| *«Google no acepta este origen»*                                             | Falta el origen en el Client ID                                     | Paso 4 — el origen sin la ruta                                                                  |
| Al conectar: *«acceso bloqueado, la app no ha completado la verificación»*   | La cuenta no está en la lista de usuarios de prueba                 | Paso 3, apartado 4                                                                              |
| Borré la hoja                                                                | —                                                                    | Se vuelve a crear sola en la siguiente sincronización                                           |
| Creé la hoja a mano y el script no la ve                                     | `drive.file` solo alcanza los ficheros creados por la app           | Deja que la cree el script; es la contrapartida de no pedir acceso a todo el Drive             |
| `QUOTA` o *«Google está limitando las peticiones»*                           | Límite de `UrlFetchApp` (20 000 llamadas/día en cuentas gratuitas)  | Espera y reintenta; la sincronización es idempotente                                            |
| Sincronizaciones muy lentas con miles de filas                               | El script reescribe la pestaña entera en cada envío                 | Es correcto pero no escala; con miles de recetas habría que paginar `Code.gs`                  |

---

## 13 · Aislamiento entre cuentas y privacidad

Qué se guarda, dónde y hasta cuándo:

| Dato                            | Dónde vive                                | Al cerrar sesión |
| ------------------------------- | ----------------------------------------- | ---------------- |
| `access_token`                  | **solo memoria** del navegador            | desaparece (además se revoca en Google) |
| Correo, nombre y avatar         | **solo memoria**                          | desaparece       |
| Enlace a la hoja                | **solo memoria**                          | desaparece       |
| Cambios pendientes de sincronizar | **solo memoria**                        | se descartan     |
| Client ID                       | `public/config.json` del despliegue       | intacto: es configuración de la app, no un dato del usuario |
| Recetas e insumos               | IndexedDB (como siempre) + la hoja del usuario | intactos: la integración no cambia la persistencia local |
| Mapeo `cuenta → hoja`           | propiedades del script, una entrada por usuario | se conserva, para reutilizar la hoja al volver |

Tres mecanismos sostienen el aislamiento, y conviene no desmontarlos por descuido:

1. **El token nunca se persiste.** Recargar la página deja la app sin sesión; no hay nada que borrar.
2. **Número de sesión (`epoch`).** Cada conexión y cada cierre lo incrementan. Toda petición apunta el
   suyo al salir y se descarta al volver si ya no coincide: una respuesta lenta de la cuenta A no
   puede aplicarse cuando ya está conectada la cuenta B.
3. **El script actúa siempre con el token de quien llama.** No hay ninguna ruta de código que use la
   identidad del dueño del script para tocar una hoja.

---

## Anexo · El contrato con el script

Por si hay que depurar a mano o escribir otro cliente.

**Petición** — `POST <url>/exec`, `Content-Type: text/plain;charset=utf-8`:

```jsonc
{
  "op": "hello" | "upsert" | "verify",
  "requestId": "uuid-v4",        // idempotencia: reenviar el mismo id no vuelve a escribir
  "accessToken": "ya29…",
  "sentAt": "2026-07-30T12:00:00.000Z",
  "probe": "uuid-v4",             // solo en `verify`: el dato que tiene que volver
  "payload": {                    // solo en `upsert`; cada lista puede faltar
    "supplies":    [{ "id": "…", "name": "…", "baseUnit": "g", "usage": "recipe",
                      "priceAmount": 4.5, "pricePerValue": 1000, "pricePerUnit": "g",
                      "currency": "PEN", "syncedAt": "…" }],
    "recipes":     [{ "id": "…", "name": "…", "categoryId": "…", "categoryName": "…",
                      "flavorId": null, "flavorLabel": null,
                      "portionsCapacityId": null, "portionsCapacityLabel": null,
                      "moldCapacityId": null, "moldCapacityLabel": null,
                      "lineCount": 7, "syncedAt": "…" }],
    "recipeLines": [{ "recipeId": "…", "recipeName": "…", "supplyId": "…", "supplyName": "…",
                      "quantity": 500, "unit": "g", "syncedAt": "…" }],
    "categories":  [{ "id": "…", "name": "…", "syncedAt": "…" }],
    "flavors":     [{ "id": "…", "label": "…", "syncedAt": "…" }],
    "capacities":  [{ "id": "…", "group": "portions", "label": "…", "factor": 10, "syncedAt": "…" }]
  }
}
```

**Respuesta** — siempre HTTP 200; el resultado va en el cuerpo (Apps Script no expone bien los
códigos de estado):

```jsonc
{ "ok": true, "schemaVersion": 1,
  "account": { "sub": "…", "email": "…", "name": "…", "picture": "…" },
  "spreadsheetId": "1AbC…", "spreadsheetUrl": "https://…", "created": false,
  "applied": { "supplies": 3, "recipes": 1, "recipeLines": 7 },
  "echo": "uuid-v4",              // solo en `verify`: lo LEÍDO de la hoja tras escribir el probe
  "cached": false }

{ "ok": false, "error": { "code": "UNAUTHENTICATED", "message": "…" } }
```

Códigos de error: `UNAUTHENTICATED`, `CLIENT_MISMATCH`, `SCOPE_MISSING`, `BAD_REQUEST`, `QUOTA`,
`INTERNAL`.

**`verify` no pasa por la caché de `requestId`**, a propósito: su razón de ser es tocar la hoja de
verdad, así que devolver el resultado recordado de otra petición no demostraría nada. Escribe
`['pruebaConexion', probe, sentAt]` en `_meta!A6:C6` y devuelve en `echo` **lo que lee** de esa misma
celda; quien llama compara. Si `echo` no coincide con `probe`, la hoja existe pero no se está
escribiendo bien.

**Claves de escritura:** `Insumos`, `Recetas`, `Categorias`, `Sabores` y `Capacidades` hacen *upsert*
por `id`. `RecetaInsumos` se reemplaza **por receta entera** (se borran las líneas de esa receta y se
reinsertan), que es lo que hace que borrar un insumo de una receta se refleje en la hoja.

---

## Dónde está cada cosa en el código

Los dos contextos son **agnósticos a la tecnología**: su dominio y sus casos de uso no nombran ni a
Google ni a Sheets. Todo lo concreto está en `infrastructure/`, y se elige en un `provide*()`.

| Pieza                                      | Fichero                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Web App                                    | `public/apps-script/Code.gs` (servido con la app: `/cuenta` lo lee y lo enseña) |
| La guía dentro de la app                   | `src/app/features/account/account.html` + `external-sync/…/get-sync-setup.use-case.ts` |
| Autenticación (contexto genérico)          | `src/app/core/auth/` — puerto `Authenticator`                                 |
| **Todo lo específico de Google**           | `src/app/core/auth/infrastructure/google-authenticator.ts` — y solo ahí       |
| Sincronización (contexto genérico)         | `src/app/core/external-sync/` — puerto `SyncGateway`                          |
| **Todo lo específico de Sheets/Apps Script** | `src/app/core/external-sync/infrastructure/apps-script-sync.gateway.ts` + `apps-script-endpoint.ts` (el detalle del CORS) |
| Quién elige cada implementación            | `auth.providers.ts` · `external-sync.providers.ts` — una línea cada uno       |
| Proyección del recetario a filas           | `src/app/core/recipe-book/application/use-cases/export-recipe-book-rows.use-case.ts` |
| Pantalla `/cuenta`                         | `src/app/features/account/`                                                   |
| Configuración de despliegue                | `public/config.json` + `src/app/core/_common/infrastructure/config/`          |
