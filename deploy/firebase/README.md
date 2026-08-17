# `deploy/firebase/` — todo el despliegue

Aquí está **todo** lo que define cómo y a dónde se publica la app. En `.github/` solo quedan los
workflows de GitHub Actions, que lanzan el despliegue pero no deciden nada de él.

| Fichero | Qué es |
|---|---|
| [`environments.json`](environments.json) | **La lista de ambientes y su configuración.** El único sitio donde se declaran |
| [`config.mjs`](config.mjs) | Genera el `config.json` de un ambiente a partir del anterior |
| [`firestore.rules`](firestore.rules) | Quién puede leer y escribir Firestore: **nadie**. Solo entra el Admin SDK desde [`api/auth`](../../api/auth/README.md) |
| [`firestore.indexes.json`](firestore.indexes.json) | Índices compuestos de Firestore. Vacío: las consultas de la API son de un solo campo, que Firestore indexa solo |
| [`../../firebase.json`](../../firebase.json) | Cómo se sirve el sitio y qué funciones hay. **Vive en la raíz y no puede moverse aquí** — ver abajo |

> Los dos ficheros de Firestore **sí** podrían estar en la raíz —es donde los deja `firebase init`—
> pero nada lo obliga: `firebase.json` los referencia por ruta y cualquier sitio **dentro** de la raíz
> del proyecto vale. Están aquí porque aquí es donde este repo dice que vive el despliegue.

Son **dos despliegues distintos y dos workflows distintos**: el frontend
([`deploy-frontend.yml`](../../.github/workflows/deploy-frontend.yml), Hosting) y el backend
([`deploy-backend.yml`](../../.github/workflows/deploy-backend.yml), Cloud Functions + las reglas de
Firestore). El procedimiento del backend está en [`manual/api.md`](../../manual/api.md); cuando hay
que publicar los dos, **primero el backend**.

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

Un bloque más en `environments.json` y un *environment* homónimo en GitHub con su secret. **El
workflow no se toca.** El procedimiento paso a paso está en
[`manual/firebase-deploy.md`](../../manual/firebase-deploy.md) → «Añadir un ambiente»; aquí solo el
diseño que lo hace posible.

---

## Por qué el Client ID no es un secret

Un Client ID de OAuth **no es una credencial**: viaja en el HTML de cualquier app web y lo que lo
protege es la lista de orígenes autorizados, no el ocultarlo. Guardarlo como secret lo habría hecho
invisible en el repo sin ganar nada, y habría partido en dos la configuración de cada ambiente.

Aquí está a la vista, versionado, y en el diff se ve qué usa cada ambiente. **El único secret de
verdad es `FIREBASE_SERVICE_ACCOUNT`**, que sí es una clave privada.

De dónde sale ese Client ID (proyecto de Cloud, pantalla de consentimiento, orígenes autorizados):
[`../google-client-id.md`](../google-client-id.md).

---

## Tres detalles del diseño que parecen rarezas

**`firebase.json` está en la raíz y no puede vivir en esta carpeta.** Se intentó, y el deploy falla:

```
Error: ../../dist/misaevol/browser is outside of project directory
```

El CLI fija la **raíz del proyecto** en el directorio del `firebase.json` (`detectProjectRoot`) y
después rechaza cualquier ruta relativa que se salga de ella (`Config.path`). Con el fichero en
`deploy/firebase/`, el build queda fuera y no hay ruta relativa legal que llegue a él. Es la única
excepción a «todo el despliegue en esta carpeta», y la impone la herramienta.

Fíjate en que la restricción es **salirse de la raíz**, no «estar en la raíz»: por eso las reglas de
Firestore y el `source` de cada función sí pueden vivir en subcarpetas, y de hecho lo hacen.

> **Cuidado con verificarlo solo con el emulador.** `emulators:start` **no** pasa por esa validación
> y acepta `../../` tan tranquilo. Un `public` mal puesto arranca perfecto en local y revienta en el
> deploy. Para comprobar de verdad esa parte hay que ejercitar el propio cargador de config:
>
> ```bash
> node -e 'const {Config}=require("firebase-tools/lib/config.js");
>          const c=Config.load({cwd:process.cwd()});
>          console.log(c.path(c.get("hosting.public")))'
> ```

Para lo demás —rewrite y cabeceras— el emulador sí vale, y no pide credenciales (acepta cualquier
proyecto que empiece por `demo-`):

```bash
npm run build
npx --yes firebase-tools emulators:start --only hosting --project demo-x
```

Con él vivo, cuatro comprobaciones (el emulador dice en qué puerto quedó; suele ser 5000 o 5002):

```bash
curl -sI http://127.0.0.1:5000/home          # 200 text/html · Cache-Control: no-cache   ← rewrite + shell sin cachear
curl -sI http://127.0.0.1:5000/              # 200 text/html · Cache-Control: no-cache
curl -sI http://127.0.0.1:5000/main-XXX.js   # 200 · immutable                            ← hasheado, cache eterna
curl -sI http://127.0.0.1:5000/chunk-NOPE.js # 404                                        ← NO rewrite
```

Además, `config.json` y `seed/**` responden `no-cache`.

### Por qué el rewrite es `**/!(*.*)` y el shell va `no-cache`

Las dos cosas arreglan el mismo fallo, visto desde los dos lados. Las rutas se cargan con `import()`,
así que un `main-*.js` pide **el `chunk-*.js` con el hash de su propio build**, y al publicar
**Firebase borra los ficheros que no estén en la release nueva**.

- **Con el rewrite `**`**, *cualquier* petición sin fichero detrás devolvía `index.html` con **200 y
  `content-type: text/html`**, incluida la de un chunk ya borrado. El navegador recibía HTML
  disfrazado de módulo y soltaba *«Failed to fetch dynamically imported module»*, sin 404 que
  interpretar. `**/!(*.*)` manda a `index.html` **solo las rutas del router** (las que no llevan
  extensión: `/home`, `/cuenta`, anidadas incluidas) y deja que lo que parece un fichero falle como
  lo que es.
- **La cabecera `no-cache` solo cubría `/index.html`**, que es una ruta que nadie pide: el shell se
  sirve en `/`, `/home`, `/cuenta`… y ahí Firebase ponía su defecto, **`max-age=3600`**. Durante una
  hora tras publicar, abrir la app servía el `index.html` viejo desde la caché del navegador → el
  `main-*.js` viejo (guardado `immutable`) → y sus chunks, ya borrados del servidor. Recargar no
  arreglaba nada. Por eso las entradas `/` y `**/!(*.*)` de `headers` llevan el mismo `no-cache` que
  `/index.html`: **el shell siempre revalida, los ficheros hasheados nunca lo hacen.**

Del lado de la app, el mismo fallo lo recoge `platform/stale-build/` (enganchado en `app.config.ts`
con `withNavigationErrorHandler`): reconoce el error de chunk y recarga a la ruta pedida para traerse
el build nuevo, en lugar de dejar la pantalla congelada. Cubre a quien tuviera la app **ya abierta**
cuando se publicó, que es lo que ninguna cabecera puede arreglar.

**El ambiente se escribe a mano, no se elige de un desplegable.** Para que GitHub pinte un
desplegable hay que declarar los valores como literales dentro del propio workflow (`type: choice`
→ `options:`), y entonces habría **dos** sitios donde mantener la lista. Se prefirió que
`environments.json` sea el único. La caja de texto no admite erratas: el job `Validar ambiente`
comprueba el nombre, normaliza mayúsculas y espacios (`PROD` → `prod`), y si no existe falla
**antes de compilar** listando los que sí.

**Ese job de validación va aparte, sin `environment:`.** GitHub **crea al vuelo** cualquier
environment que un job referencie. Si el nombre se resolviera en el job que despliega, una errata
dejaría sembrado un environment fantasma —sin secrets ni protecciones— antes de fallar.
