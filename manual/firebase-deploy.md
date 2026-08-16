# Despliegue en Firebase Hosting

La app se publica en **Firebase Hosting** con un workflow **manual**
([`.github/workflows/deploy-firebase.yml`](../.github/workflows/deploy-firebase.yml)). No hay
despliegue automático: mergear a `main` no publica nada. Publicar es una decisión que se toma
eligiendo un ambiente y pulsando un botón.

Un **ambiente** es un **proyecto de Firebase independiente** bajo la misma cuenta de Google: no
comparten hosting, ni cuota, ni credenciales. Hoy hay dos, `dev` y `prod`, pero **el número no está
fijado en ningún sitio** — los ambientes son datos, y añadir `stage`, `lab` o `qa` no toca el
workflow. Ver [«Añadir un ambiente»](#añadir-un-ambiente).

> **Antes se desplegaba en GitHub Pages.** Ya no: el workflow `deploy-demo.yml` se borró, y con él
> el `--base-href /clapastedyke/` y el `404.html` que hacían falta allí. Si el sitio antiguo sigue
> vivo, se apaga en `Settings → Pages → Source: None`.

---

## Dónde vive cada valor

Esta es la pregunta importante, y la respuesta es corta: **la lista de ambientes es un fichero**, y
lo secreto está fuera del repo. Nada de configuración vive dentro del workflow.

| Sitio | Qué contiene | Secreto |
|---|---|---|
| [`deploy/firebase/environments.json`](../deploy/firebase/environments.json) | **La lista de ambientes**: a qué proyecto de Firebase va cada uno (`projectId`) y el `config.json` con el que corre la app | No |
| **Environments de GitHub**, uno por ambiente | `FIREBASE_SERVICE_ACCOUNT` | Sí |

```jsonc
// deploy/firebase/environments.json
{
  "dev": {
    "projectId": "migo-dev-20b41",     // a qué proyecto de Firebase se sube
    "config": {                        // ← ESTO ES el config.json publicado, tal cual
      "debug": true,
      "googleClientId": "2229…apps.googleusercontent.com",
      "syncPollSeconds": 120
    }
  },
  "prod": { "projectId": "…", "config": { "debug": false, … } }
}
```

Fuera de `config` va lo que necesita el **despliegue** y la app no ve (hoy solo `projectId`). Dentro
de `config` va, literalmente, **el `config.json` que se publica**: el bloque se copia entero, sin
transformar. Si mañana `config.json` gana una clave, se añade ahí y no se toca nada más.

> **`public/config.json` es un fichero GENERADO** desde el bloque `dev`, con `npm run config`. No se
> edita a mano. Está commiteado porque `ng serve`, `ng build` y los E2E lo necesitan, pero la fuente
> de verdad es `environments.json`. El despliegue usa **el mismo script** con otra salida
> (`--out dist/misaevol/browser/config.json`), así que local y CI no pueden divergir.

El nombre del ambiente es la bisagra: **la clave en `environments.json` y el nombre del *environment*
de GitHub tienen que ser el mismo, en minúsculas.** Eso es lo que hace que `secrets.*` resuelva a
las credenciales del proyecto correcto sin un solo `if` en el workflow.

---

## Puesta en marcha (una sola vez, y hay que hacerla por cada ambiente)

**Repite los pasos 1 a 5 completos para `dev` y para `prod`.** Son proyectos independientes: cada
uno tiene su propia cuenta de servicio y su propia clave. No reutilices la de dev en prod — si se
filtra una, se lleva los dos por delante.

### Paso 1 · Crear el proyecto de Firebase

En <https://console.firebase.google.com>, con tu cuenta de Google: *Crear un proyecto* → nómbralo
p. ej. `clapastedyke-dev`. Analytics no hace falta.

Dentro del proyecto: **Compilación → Hosting → Comenzar**. La consola te ofrecerá instalar la CLI y
correr `firebase init`; **sáltate esos pasos** — el `firebase.json` ya está en el repo y
`firebase init` lo sobrescribiría.

Anota el **Project ID** (el identificador con guiones que sale bajo el nombre, no el nombre bonito;
Firebase a veces le añade un sufijo aleatorio).

### Paso 2 · Escribirlo en `deploy/firebase/environments.json`

```jsonc
{
  "dev": {
    "projectId": "migo-dev-20b41",
    "config": { "debug": true, "googleClientId": "2229…", "syncPollSeconds": 120 }
  },
  "prod": {
    "projectId": "clapastedyke-prod",
    "config": { "debug": false, "googleClientId": "2229…", "syncPollSeconds": 120 }
  }
}
```

Aquí va también el **Client ID de OAuth** de cada ambiente (`config.googleClientId`): no es un
secreto —lo protege la lista de orígenes autorizados, no el ocultarlo— y tenerlo a la vista deja en
el diff qué usa cada ambiente.

Después, `npm run config` para regenerar `public/config.json`, y commitea los dos. Si te dejas el
placeholder `TU-PROJECT-ID-…`, el workflow falla en el primer job con un mensaje que te manda aquí,
sin llegar a compilar ni a desplegar nada.

### Paso 3 · Una cuenta de servicio por proyecto

GitHub Actions no puede abrir un navegador para iniciar sesión, así que despliega con una **cuenta
de servicio**: un usuario de máquina con su propia clave.

En el proyecto de Firebase: ⚙️ **Configuración del proyecto → Cuentas de servicio →
Generar nueva clave privada** → se descarga un `.json`.

> Ese fichero es una credencial con permiso para publicar en ese proyecto. **No se commitea, no se
> pega en un chat.** Si se filtra, se revoca en
> [Google Cloud → IAM → Cuentas de servicio](https://console.cloud.google.com/iam-admin/serviceaccounts)
> borrando esa clave.

Si al desplegar diera un error de permisos, dale a esa cuenta el rol **Firebase Hosting Admin**
(`roles/firebasehosting.admin`) en [IAM](https://console.cloud.google.com/iam-admin/iam) del
proyecto correspondiente.

### Paso 4 · El *environment* de GitHub y su secret

Aquí es donde se separan de verdad los ambientes.

En `Settings → Environments → New environment`, crea uno con **exactamente la misma clave** que en
`environments.json`, en minúsculas: `dev`, `prod`, …

Dentro de **cada** environment, `Add environment secret`. Solo hay uno:

| Secret | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | El **contenido íntegro** del JSON del paso 3 — ábrelo con un editor y pega todo, desde la `{` hasta la `}`. **Uno distinto por ambiente**: cada JSON abre su proyecto |

Dos avisos sobre ese pegado, que son los fallos habituales: no es la **ruta** al fichero, es su
contenido; y **no le quites los `\n`** del `private_key`, que son los que permiten firmar el JWT.

⚠️ **No lo pongas en `Settings → Secrets → Actions` (los de repositorio)**: ahí sería compartido por
todos los ambientes y desplegar a dev publicaría con las credenciales de prod. Tiene que ser un
**environment secret**, dentro de su environment.

> **El Client ID de OAuth no está aquí, y es deliberado.** No es una credencial: viaja en el HTML de
> cualquier app web y lo protege la lista de orígenes autorizados. Vive en `environments.json`, a la
> vista y versionado, junto al resto de la configuración de su ambiente.

#### Opcional pero recomendado: protecciones en `prod`

En el environment `prod`, `Deployment protection rules`:

- **Required reviewers** → tú mismo. Así un deploy a prod queda en espera hasta que lo apruebas
  desde la propia UI de Actions. Es la red que impide publicar por inercia.
- **Deployment branches** → `Selected branches` → `main`. Impide desplegar a prod desde una rama de
  trabajo.

Los ambientes de trabajo (`dev`, `stage`, `lab`…) se dejan sin protecciones: son justo el sitio
donde quieres desplegar cualquier rama sin pedir permiso.

### Paso 5 · Orígenes de OAuth (dos por ambiente)

Firebase publica cada sitio en **dos dominios**, y para Google son orígenes distintos. Con dos
ambientes son cuatro entradas; con cuatro ambientes, ocho.

En Google Cloud → *APIs y servicios → Credenciales → tu Client ID de tipo «Aplicación web»* →
**Orígenes de JavaScript autorizados**:

```
http://localhost:4200
https://clapastedyke-dev.web.app
https://clapastedyke-dev.firebaseapp.com
https://clapastedyke-prod.web.app
https://clapastedyke-prod.firebaseapp.com
```

Si registras solo uno de cada par, entrar por el otro da `Error 400: origin_mismatch`. **No hace
falta ningún URI de redirección**: la app usa el flujo popup de Google Identity Services
([`google-integration.md`](google-integration.md) §2.2).

Si usas **un Client ID por ambiente**, cada uno lleva solo los orígenes de su proyecto (más
`localhost` en el de desarrollo).

---

## Añadir un ambiente

Dos pasos, y **el workflow no se toca**. El nombre del ambiente que escribes al lanzarlo se valida
contra `environments.json`, así que la lista de ambientes que existen es literalmente ese fichero.

1. **Un bloque en [`deploy/firebase/environments.json`](../deploy/firebase/environments.json)** — con el proyecto de
   Firebase ya creado y Hosting activado (pasos 1 y 2):

   ```jsonc
   "stage": {
     "projectId": "clapastedyke-stage",
     "config": { "debug": true, "googleClientId": "…", "syncPollSeconds": 120 }
   }
   ```

2. **Un environment `stage` en GitHub** con su secret `FIREBASE_SERVICE_ACCOUNT` (pasos 3 y 4), y
   los dos orígenes del proyecto nuevo en el Client ID (paso 5).

Ya está: `Run workflow` escribiendo `stage` despliega.

Detalle completo del diseño (por qué es una caja de texto y no un desplegable, y por qué la
validación va en un job aparte) en [`deploy/firebase/README.md`](../deploy/firebase/README.md).

---

## Desplegar

`Actions → Desplegar en Firebase Hosting → Run workflow`. Se eligen dos cosas:

- **Branch** — de qué rama se compila.
- **Ambiente** — se escribe: `dev`, `prod`, o el que hayas añadido. Da igual mayúsculas o espacios
  de más (`PROD` vale); si el nombre no existe, el job `Validar ambiente` falla **antes de
  compilar** y te lista los que sí.

El workflow:

1. Valida el ambiente y saca su `projectId` de `environments.json`.
2. Compila con `npm run build` (producción, con presupuestos de tamaño).
3. Escribe `dist/misaevol/browser/config.json` con el bloque `config` del ambiente, usando el mismo
   script que `npm run config`.
4. Sube `dist/misaevol/browser` al proyecto de Firebase de ese ambiente.

La URL publicada queda enlazada en la propia ejecución (el recuadro del environment) y en el
resumen del job.

**El flujo normal es desplegar a `dev` primero**, comprobarlo, y luego lanzar el mismo commit a
`prod`. Como el build es determinista y toda la diferencia está en `config.json`, lo que validas en
dev es lo que se publica en prod.

### Cambiar la configuración de un ambiente

- `debug`, `googleClientId`, `syncPollSeconds` → editar su bloque `config` en
  `deploy/firebase/environments.json`, `npm run config` si tocaste `dev`, commitear y **volver a
  desplegar**.
- La cuenta de servicio → cambiar el secret de **ese** environment y **volver a desplegar**.

No hay ningún fichero en un servidor que se pueda editar en caliente: Hosting sirve un artefacto
inmutable. La configuración se aplica en el momento del despliegue, no después.

### Desde local

Para una prueba rápida, con el `projectId` que quieras de `environments.json`:

```bash
npx --yes firebase-tools login                                        # una sola vez
npm run build
node deploy/firebase/config.mjs dev --out dist/misaevol/browser/config.json
npx --yes firebase-tools deploy --only hosting \
  --config deploy/firebase/firebase.json --project migo-dev-20b41
```

Dos cosas que no se pueden saltar:

- **La línea de `config.mjs`.** Sin ella subes el `public/config.json` del repo, que es el de `dev`:
  si estabas desplegando a otro ambiente, publicarías su configuración equivocada.
- **`--config`**, porque el `firebase.json` no está en la raíz y sin él el CLI no lo encuentra.

Por eso mismo, para un despliegue de verdad usa el workflow: ahí ese orden no se puede olvidar.

---

## Qué hay en `firebase.json`, y por qué

Vive en [`deploy/firebase/firebase.json`](../deploy/firebase/firebase.json) y es **uno solo para
todos los ambientes**: lo que cambia entre ellos es el proyecto de destino y el `config.json`, no
cómo se sirve el sitio.

| Clave | Por qué |
|---|---|
| `"public": "../../dist/misaevol/browser"` | El builder `application` de Angular deja el cliente ahí. Los `../` son porque el CLI resuelve esta ruta **desde el directorio del `firebase.json`**, que no es la raíz. Apuntar a `dist/misaevol` publicaría además `3rdpartylicenses.txt` y un `prerendered-routes.json` que no pinta nada |
| `"rewrites"` → `/index.html` | La app es una SPA sin hash: sin esto, recargar `/home` daría 404. Sustituye al truco del `404.html` de GitHub Pages |
| `Cache-Control: immutable` en `js/css/woff2` | El build usa `outputHashing: "all"`, así que el nombre cambia con el contenido y cachear un año es seguro |
| `Cache-Control: no-cache` en `index.html`, `config.json` y `seed/**` | `main.ts` lee `config.json` **antes** de arrancar. Si el CDN lo cachease, un cambio de configuración tardaría en verse |

---

## Cuando algo falla

| Síntoma | Causa | Arreglo |
|---|---|---|
| `Ambiente 'x' desconocido` | No hay bloque con esa clave en `environments.json` | El error lista los que sí existen |
| `no tiene un projectId real` | Sigue el placeholder `TU-PROJECT-ID-…` | Paso 2 |
| `El environment 'x' no tiene el secret FIREBASE_SERVICE_ACCOUNT` | El secret está en los de repositorio, o en otro environment, o el environment no existe | Paso 4 — tiene que ser un **environment secret** del environment homónimo |
| `Failed to authenticate, have you run firebase login?` | `FIREBASE_SERVICE_ACCOUNT` mal pegado: la ruta en vez del contenido, falta una llave, o se «limpiaron» los `\n` del `private_key`. El mensaje es genérico y tapa la causa — con `--debug` sale la de verdad (`invalid_grant`, `error:1E08010C`…) | Volver a pegar el JSON entero, tal cual |
| `invalid_grant: Invalid grant: account not found` | La cuenta de servicio se borró, o la clave se revocó | Generar una clave nueva (paso 3) |
| `HTTP Error: 403` al desplegar | La cuenta de servicio no tiene permiso en ese proyecto | Rol **Firebase Hosting Admin** en IAM (paso 3) |
| `Failed to get Firebase project …` | El `projectId` no existe o es el nombre en vez del ID | Cópialo de la consola de Firebase |
| El deploy a prod se queda «Waiting» | Está pidiendo aprobación (protección del environment) | Apruébalo desde la propia ejecución en Actions |
| Desplegué a dev y se actualizó prod | El secret está como secret de repositorio, no de environment | Paso 4 |
| El sitio se publica con el `config.json` de otro ambiente | Desplegaste a mano y te saltaste `config.mjs` | Usa el workflow, o repite la secuencia completa de «Desde local» |
| `public/config.json` vuelve a cambiar solo | Es un fichero **generado**; lo reescribe `npm run config` | Edita `environments.json`, no el `config.json` |
| La home carga, pero recargar `/home` da 404 | Falta el `rewrites` de `firebase.json` | No lo toques; si lo tocaste, restáuralo |
| `Error 400: origin_mismatch` al conectar Google | Falta ese origen concreto — son **dos por ambiente** | Paso 5 |
| La consola no muestra trazas `[events]` en prod | `debug: false`, que es lo correcto | Los `warn` y `error` se ven siempre; en dev tienes `debug: true` |
