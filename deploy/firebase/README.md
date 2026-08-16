# `deploy/firebase/` — todo el despliegue

Aquí está **todo** lo que define cómo y a dónde se publica la app. En `.github/` solo queda el
workflow de GitHub Actions, que lanza el despliegue pero no decide nada de él.

| Fichero | Qué es |
|---|---|
| [`environments.json`](environments.json) | **La lista de ambientes y su configuración.** El único sitio donde se declaran |
| [`config.mjs`](config.mjs) | Genera el `config.json` de un ambiente a partir del anterior |
| [`firebase.json`](firebase.json) | Cómo se sirve el sitio: qué carpeta, el rewrite de SPA y las cabeceras de caché. **Uno solo para todos los ambientes** |

Cada ambiente es un **proyecto de Firebase distinto** bajo la misma cuenta de Google. Hoy hay dos,
`dev` y `prod`, pero el número no está fijado en ninguna parte: los ambientes son **datos**, no
código.

---

## `environments.json`

```jsonc
{
  "dev": {
    "projectId": "migo-dev-20b41",          // a qué proyecto de Firebase se sube
    "config": {                             // ← ESTO ES el config.json publicado, tal cual
      "debug": true,
      "googleClientId": "2229…apps.googleusercontent.com",
      "syncPollSeconds": 120
    }
  },
  "prod": { … }
}
```

Dos niveles, y la separación importa:

- **Fuera de `config`** va lo que necesita el **despliegue** y la app no llega a ver: hoy solo
  `projectId`.
- **Dentro de `config`** va, literalmente, **el `config.json` que se publica**. No hay
  transformación ninguna: el bloque se copia entero. Añadir una clave nueva a `config.json` es
  añadirla aquí, en cada ambiente, y ya está — ni el script ni el workflow se tocan.

> **`public/config.json` es un fichero GENERADO.** No se edita a mano: se regenera con
> `npm run config` desde el bloque `dev`. Está commiteado porque `ng serve`, `ng build` y los E2E lo
> necesitan, pero la fuente de verdad es `environments.json`. Si editas uno a mano, el siguiente
> `npm run config` se lo lleva por delante.

```bash
npm run config              # public/config.json ← ambiente dev (lo normal en local)
npm run config -- prod      # public/config.json ← ambiente prod (para reproducir un bug de prod)
```

El despliegue usa **el mismo script** con otra salida
(`--out dist/misaevol/browser/config.json`), así que local y CI no pueden divergir.

---

## Añadir un ambiente (`stage`, `lab`, `qa`…)

Dos pasos. **El workflow no se toca.**

**1 · Un bloque en `environments.json`**, con el proyecto de Firebase ya creado y Hosting activado:

```jsonc
"stage": {
  "projectId": "clapastedyke-stage",
  "config": { "debug": true, "googleClientId": "…", "syncPollSeconds": 120 }
}
```

**2 · Un *environment* homónimo en GitHub** (`Settings → Environments → New environment`, nombre
`stage`, **en minúsculas**) con su único secret:

| Secret | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | El JSON de la cuenta de servicio **de ese proyecto** |

Y en Google Cloud, añade los dos orígenes del proyecto nuevo (`https://<projectId>.web.app` y
`https://<projectId>.firebaseapp.com`) a los orígenes autorizados de su Client ID.

Con eso, `Run workflow` escribiendo `stage` ya despliega.

---

## Por qué el Client ID no es un secret

Un Client ID de OAuth **no es una credencial**: viaja en el HTML de cualquier app web y lo que lo
protege es la lista de orígenes autorizados, no el ocultarlo. Guardarlo como secret lo habría hecho
invisible en el repo sin ganar nada, y habría partido en dos la configuración de cada ambiente.

Aquí está a la vista, versionado, y en el diff se ve qué usa cada ambiente. **El único secret de
verdad es `FIREBASE_SERVICE_ACCOUNT`**, que sí es una clave privada.

---

## Tres detalles del diseño que parecen rarezas

**El `public` del `firebase.json` empieza por `../../`.** El CLI toma como raíz del proyecto **el
directorio donde está el `firebase.json`**, no aquel desde el que lo lanzas. Por eso la ruta sube dos
niveles y por eso toda invocación lleva `--config`:

```bash
npx --yes firebase-tools deploy --only hosting \
  --config deploy/firebase/firebase.json --project <projectId>
```

Si algún día se mueve esta carpeta, hay que **recontar los `../`**. Comprobarlo no requiere
desplegar ni tener credenciales — el emulador acepta cualquier proyecto que empiece por `demo-`:

```bash
npm run build
npx --yes firebase-tools emulators:start --only hosting \
  --config deploy/firebase/firebase.json --project demo-x
```

Arranca imprimiendo `Serving hosting files from: …`. Si esa ruta no apunta al build, el `public`
está mal. Con el emulador vivo se comprueba lo demás con `curl`: una ruta profunda (`/home`) debe
dar 200 —es el rewrite—, e `index.html`, `config.json` y `seed/**` deben responder con
`Cache-Control: no-cache` mientras los `.js`/`.css` hasheados responden `immutable`.

**El ambiente se escribe a mano, no se elige de un desplegable.** Para que GitHub pinte un
desplegable hay que declarar los valores como literales dentro del propio workflow (`type: choice`
→ `options:`), y entonces habría **dos** sitios donde mantener la lista. Se prefirió que
`environments.json` sea el único. La caja de texto no admite erratas: el job `Validar ambiente`
comprueba el nombre, normaliza mayúsculas y espacios (`PROD` → `prod`), y si no existe falla
**antes de compilar** listando los que sí.

**Ese job de validación va aparte, sin `environment:`.** GitHub **crea al vuelo** cualquier
environment que un job referencie. Si el nombre se resolviera en el job que despliega, una errata
dejaría sembrado un environment fantasma —sin secrets ni protecciones— antes de fallar.
