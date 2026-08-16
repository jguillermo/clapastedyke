# Puesta en marcha de la integración con Google

Lo que hay que hacer **una vez, quien publica la app**, para que sus usuarios puedan guardar copia de
su recetario en su propio Drive. Diez minutos. Los usuarios no hacen nada de esto: para ellos es un
botón y una casilla.

> **El «por qué» está en [`google-integration.md`](google-integration.md)**: por qué hace falta el
> login de Google, por qué recargar la página obliga a reconectar, qué arquitecturas se descartaron y
> con qué datos medidos. Si algo de aquí parece arbitrario, la respuesta está allí.

---

## Qué hay que montar, y qué no

| Pieza | Quién | Cuándo |
| --- | --- | --- |
| Proyecto de Google Cloud + Sheets API + Drive API | quien publica la app | una vez |
| Pantalla de consentimiento + Client ID de OAuth | quien publica la app | una vez |
| `googleClientId` en `public/config.json` | quien publica la app | una vez |
| La hoja de cálculo del usuario | **la app**, sola | al conectar cada cuenta |
| Pestañas, cabeceras y escritura | **la app**, sola | en cada guardado |

**No hay nada que desplegar en la cuenta de nadie.** La app crea la hoja con la API de Sheets y
escribe en ella con el token del propio usuario. No hay Apps Script, ni URL de Web App, ni secretos
que custodiar.

---

## 1 · Proyecto de Google Cloud

1. Entra en [console.cloud.google.com](https://console.cloud.google.com/projectcreate) y crea un
   proyecto (por ejemplo `Clapastedyke`).
2. En **APIs y servicios → Biblioteca**, activa **Google Sheets API** y **Google Drive API**.

---

## 2 · Pantalla de consentimiento

En **Google Auth Platform**:

- **Tipo de usuario:** Externo.
- **Data Access → permisos.** Solo estos cuatro:

  | Scope | Para qué |
  | --- | --- |
  | `openid` | identificar la cuenta de forma estable |
  | `.../auth/userinfo.email` | saber a qué correo pertenece la hoja |
  | `.../auth/userinfo.profile` | mostrar el nombre en la pantalla de cuenta |
  | `https://www.googleapis.com/auth/drive.file` | crear y escribir **solo** la hoja de la app |

  `drive.file` alcanza **únicamente los ficheros que la app crea**. No es un scope sensible: Google
  no exige verificación y no hay techo de usuarios.

- **Audience.** Mientras esté en *Testing* hay que añadir el correo de cada persona a mano (máximo
  100), y **quien no esté en la lista verá un error al conectar**. Publicando la app se acaba esa
  tarea: aparece una pantalla de «app no verificada» que el usuario se salta con un clic, y **no hace
  falta pasar la verificación** precisamente porque `drive.file` no es sensible.

---

## 3 · Client ID de OAuth

En **Credenciales → Crear credenciales → ID de cliente de OAuth**, tipo **Aplicación web**.

En «Orígenes de JavaScript autorizados» pon el origen desde el que se sirve la app —el dominio, sin
ruta—, uno por ambiente:

```
http://localhost:4200
https://TU-PROJECT-ID-DEV.web.app
https://TU-PROJECT-ID-DEV.firebaseapp.com
https://TU-PROJECT-ID-PROD.web.app
https://TU-PROJECT-ID-PROD.firebaseapp.com
```

Firebase Hosting publica cada sitio en **dos dominios a la vez**, y para Google son orígenes
distintos: si registras solo uno del par, entrar por el otro da `Error 400: origin_mismatch`. Y hay
**dos ambientes** (`dev` y `prod`), que son dos proyectos de Firebase separados — de ahí las cuatro
entradas. Si conectas un dominio propio, añádelo también.

También puedes usar **un Client ID por ambiente**, y entonces cada uno lleva solo los orígenes de su
proyecto; el workflow inyecta el que corresponda desde el secret de ese ambiente. Ver
[`firebase-deploy.md`](firebase-deploy.md).

---

## 4 · Configurar la app

El Client ID es lo único que hay que configurar, y va al bloque `config` de **su ambiente** en
[`deploy/firebase/environments.json`](../deploy/firebase/environments.json):

```jsonc
{
  "dev": {
    "projectId": "migo-dev-20b41",
    "config": {
      "debug": true,
      "googleClientId": "123456-abc.apps.googleusercontent.com",
      "syncPollSeconds": 120
    }
  }
}
```

> **No lo edites en `public/config.json`.** Ese fichero está **generado**: lo reescribe
> `npm run config` desde el bloque `dev`, y el despliegue hace lo mismo con el bloque del ambiente
> que toque. Un cambio a mano ahí se pierde en el siguiente `npm run config`.

Ese `config.json` se lee **en runtime**, así que la app no se recompila para cambiarlo: se edita
`environments.json` y se vuelve a desplegar (ver [`firebase-deploy.md`](firebase-deploy.md)).

`"debug"` controla el registro en consola; los ambientes de trabajo lo traen en `true` y los
publicados en `false` (los `warn` y `error` se ven igual: eso no se puede apagar).
`"syncPollSeconds"` es opcional (por defecto 120, o sea 2 minutos): cada cuántos segundos se
comprueba si otro dispositivo escribió en la hoja.

---

## 5 · Comprobar que funciona

Entra en **`/cuenta`** y pulsa **Conectar con Google**. La pantalla recorre cuatro pasos:

| Paso | Qué comprueba |
| --- | --- |
| Conectando con tu cuenta de Google | el consentimiento y el permiso `drive.file` |
| Preparando tu hoja en Drive | `sheets.spreadsheets.create` — la hoja del usuario |
| Enviando y leyendo un dato de prueba | escribe en `_meta!B6` y **lo vuelve a leer** de la hoja |
| Sincronizando tu recetario | el recetario completo, tabla por tabla |

El tercero es el que de verdad dice que funciona: que la hoja exista no prueba que se pueda escribir,
y que una escritura no dé error no prueba que lo escrito esté. Si un paso falla, los siguientes se
quedan pendientes y el motivo sale bajo el paso roto.

Lista de comprobación del montaje completo:

- [ ] `/cuenta` recorre los cuatro pasos hasta *Conexión lista* y muestra el correo de la cuenta.
- [ ] La hoja aparece en la **raíz** del Drive de esa cuenta, con sus 7 pestañas y sus cabeceras.
- [ ] En `_meta!B6` hay un identificador: es el último dato de prueba que fue y volvió.
- [ ] Crear una receta añade su fila en `Recetas` y sus líneas en `RecetaInsumos`.
- [ ] Editar el precio de un insumo **actualiza** su fila; no crea una segunda.
- [ ] Pulsar **Sincronizar todo** dos veces seguidas deja el mismo número de filas (idempotencia).
- [ ] Con la red cortada, el estado pasa a **Error** y la app sigue guardando en local; al volver la
      red, **Sincronizar todo** deja la hoja al día.
- [ ] Borrar la hoja y volver a conectar crea otra: la app se da cuenta preguntándole a Drive.
- [ ] Conectar con una **segunda cuenta** crea una hoja distinta en su Drive, y ninguna fila de la
      primera aparece en ella.

---

## 6 · Solución de problemas

| Síntoma | Causa | Solución |
| --- | --- | --- |
| *«Google no acepta este origen»* | Falta el origen en el Client ID | Paso 3 — el origen sin la ruta |
| Al conectar: *«acceso bloqueado, la app no ha completado la verificación»* | La cuenta no está en la lista de usuarios de prueba | Paso 2, *Audience* — o publica la app |
| La ventana de Google no se abre | Bloqueador de ventanas emergentes | Permite las emergentes de este sitio y reintenta |
| *«No has concedido el permiso…»* | Se conectó sin aceptar la casilla de Drive | Cierra sesión, vuelve a conectar y acepta |
| *«Tu sesión con Google ha caducado»* | El token dura una hora | Vuelve a **Conectar**; los cambios pendientes se reintentan |
| *«Tu hoja ya no está donde estaba»* | La borraron o está en la papelera | Se recrea sola al volver a conectar; también hay **Crear una hoja nueva** |
| *«El dato de prueba no ha vuelto igual…»* | La hoja existe pero la escritura no cuaja | Pulsa **Crear una hoja nueva** |
| *«Google está limitando las peticiones»* | Cuota de la API | Espera y reintenta; la sincronización es idempotente |
| Sincronizaciones lentas con miles de filas | Cada envío reescribe la pestaña entera | Es correcto pero no escala; con miles de recetas habría que paginar |

---

## Dónde está cada cosa en el código

Los dos contextos son **agnósticos a la tecnología**: su dominio y sus casos de uso no nombran ni a
Google ni a Sheets. Todo lo concreto está en `infrastructure/`, y se elige en un `provide*()`.

| Pieza | Fichero |
| --- | --- |
| Autenticación (contexto genérico) | `core/auth/` — puerto `Authenticator` |
| **Todo lo específico de Google Identity** | `core/auth/infrastructure/google-authenticator.ts` |
| Sincronización (contexto genérico) | `core/external-sync/` — puerto `SyncGateway` |
| **Todo lo específico de Sheets y Drive** | `core/external-sync/infrastructure/google-sheets.gateway.ts` |
| El transporte HTTP hacia Google | `core/external-sync/infrastructure/google-api.ts` |
| El esquema de la hoja | `core/external-sync/infrastructure/sheet-schema.ts` |
| La fusión (upsert y reemplazo por padre) | `core/external-sync/infrastructure/sheet-merge.ts` |
| Dónde tiene su hoja cada cuenta | `core/external-sync/infrastructure/indexeddb-sync-target.repository.ts` |
| La cola durable | `core/external-sync/infrastructure/indexeddb-sync-outbox.ts` |
| La configuración del despliegue | `public/config.json` |
| La pantalla | `features/account/` |
