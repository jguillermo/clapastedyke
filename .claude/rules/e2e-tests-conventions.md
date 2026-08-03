# E2E Test Conventions

Applies to **todo** el testing end-to-end del proyecto, que vive **exclusivamente** en la carpeta
`e2e/` de la raíz.

## CRITICAL: todos los E2E viven en `e2e/`, prueban `src/app/features` y son journeys completos

Tres reglas duras, sin excepción:

1. **Ubicación única — `e2e/`.** No hay E2E en `src/`, ni junto al componente, ni en ninguna otra
   carpeta de tests: **la carpeta `tests/` de la raíz no existe y no debe volver a crearse.** Todo
   lo relativo a E2E (config, specs, page objects, fixtures, helpers) está bajo `e2e/`. Si aparece
   un spec de Playwright fuera de `e2e/`, se **mueve** a `e2e/specs/`, no se duplica.
2. **Sujeto único — las features.** Un E2E ejercita una **vista de `src/app/features/`** por la
   ruta del usuario (`/home` → estación → diálogo → dato guardado). Los componentes del design
   system (`src/app/components/`) **no** se prueban aquí: su cobertura por estado/variante es el
   `play` de su `*.stories.ts` (ver [components-conventions.md](components-conventions.md)).
3. **Forma única — el journey completo.** Un test **no** es un caso de uso: es un **recorrido
   largo** que encadena varios casos en una sola sesión (poner un dato mal → intentar guardar →
   ver el error → corregirlo → guardar → comprobar el resultado → seguir con el caso siguiente).
   **Está prohibido el test de una sola comprobación.** Ver
   [«Journeys completos»](#critical-un-test--un-journey-no-un-caso-de-uso).

> **Cuando se pida "crear tests E2E", se crean SIEMPRE con la forma de esta regla**: un spec bajo
> `e2e/specs/<área>/<vista>/`, usando los **page objects** de `e2e/pages/` y el **fixture** de
> `e2e/fixtures/app-fixture.ts`. Nunca un spec suelto con `page.locator(...)` a pelo, nunca un
> `playwright.config.ts` nuevo, nunca una carpeta de tests paralela.

## CRITICAL: un test = un journey, no un caso de uso

**Lo caro de un E2E no es la interacción: es el arranque.** Cada test recibe de Playwright un
contexto de navegador nuevo, y eso significa rehacer entero el camino más lento que hay —
levantar el navegador, bootstrap de Angular, sembrar IndexedDB, montar la vista (y, con
`webgl: true`, además el motor 3D). Comprobar un botón cuesta milisegundos; llegar hasta él,
segundos. **Partir un flujo en tests pequeños no añade cobertura: multiplica arranques.**

Por eso la unidad de test es el **journey**: un test arranca la app **una vez** y recorre dentro
de esa misma sesión todos los casos que compartan punto de partida.

```typescript
// MAL — tres tests, tres arranques, cero cobertura extra
test('Guardar está deshabilitado sin nombre', async ({ openCatalog, catalog, form }) => { … });
test('con nombre se habilita', async ({ openCatalog, catalog, form }) => { … });
test('sin insumos avisa', async ({ openCatalog, catalog, form }) => { … });

// BIEN — un arranque, el camino entero, con su error y su corrección
test('Nuevo en Queques → Guardar deshabilitado → nombre válido → Guardar sin insumos avisa → añadir insumo → guardar → aparece listada', async ({
  openCatalog, catalog, form, grid,
}) => {
  await openCatalog();                                   // ← el único arranque del test
  await catalog.newRecipeIn('Queques').click();
  await form.waitReady();
  await expect(form.save).toBeDisabled();                // caso 1
  await form.name.fill('Bizcocho E2E');
  await expect(form.save).toBeEnabled();                 // caso 2
  await form.save.click();
  await expect(grid.error).toHaveText('Agrega al menos un ingrediente.');   // caso 3
  await grid.fillExistingLine(0, SUPPLIES.harina.name, '200');
  await form.save.click();
  await form.waitClosed();
  await expect(catalog.recipe('Queques', 'Bizcocho E2E')).toBeVisible();    // terminal
});
```

### Cómo se encadena sin volverlo frágil

| Regla | Por qué |
|---|---|
| **Encadena por punto de partida, no por tema.** Todo lo que se prueba desde el catálogo abierto va en el mismo journey. | Cada punto de partida distinto es un arranque distinto. |
| **Ordena los casos según lo que escriben.** Primero los que **no** persisten (validaciones, cancelar, medir el layout), después los que sí. | El estado inicial del caso *n+1* es lo que dejó el caso *n*; el seed intacto solo existe al principio. |
| **Cada caso termina en su estado terminal antes de empezar el siguiente.** Diálogo cerrado (`waitClosed()`), dato releído, vista de vuelta. | Un caso que arranca sobre un overlay a medio cerrar es una intermitencia, no un test. |
| **Si un caso deja la app en un sitio impredecible, va el último.** Escape sobre overlays anidados es el ejemplo: cierra el popover y *a veces* también el diálogo y el libro. | Así no hace falta normalizar el estado (recargar) en mitad del journey. |
| **Datos propios por caso** (`'… E2E'` en cada nombre) cuando el caso escribe. | Dos casos que pelean por la misma receta se estorban. |
| **Un journey que ya no cabe en la cabeza se parte por punto de partida**, nunca por aserción. | El límite es la legibilidad, no el número de `expect`. |

Los comentarios dentro del test marcan dónde empieza cada caso. Eso es lo que sustituye a tener
un `test()` por caso: se lee igual de bien y cuesta un arranque en vez de seis.

## Estructura de `e2e/`

```
e2e/
├── playwright.config.ts      # ÚNICA config de Playwright del repo
├── tsconfig.json             # type-check de la suite (standalone: NO extiende el de la raíz)
├── fixtures/
│   └── app-fixture.ts        # `test`/`expect` extendidos: page objects + opciones + guardas
├── pages/
│   └── <vista>.page.ts       # un page object por vista de features/ (o por parte estable)
├── support/
│   ├── seed.ts               # constantes del seed (estado inicial de cada test)
│   ├── webgl.ts              # anulación de WebGL para la ruta accesible DOM
│   └── static-server.mjs     # sirve el build compilado (no `ng serve`)
└── specs/
    └── <área>/<vista>/<caso>.spec.ts
```

`specs/` **espeja la estructura de `src/app/features/`**: una carpeta por área, una por vista, y un
fichero por **eje del flujo** (no por componente, no por elemento y **no por caso**). Dentro de cada
fichero hay **uno o dos journeys**, no una lista de comprobaciones.

| Feature | Specs |
|---|---|
| `features/game/home/` | `specs/game/home/home-3d.spec.ts` (con WebGL) · `home-dom.spec.ts` (ruta accesible) · `home.mobile.spec.ts` |
| `features/recipe-book/book-3d/` | `specs/recipe-book/book-3d/*.spec.ts` (3D) + `specs/recipe-book/fallback/catalog*.spec.ts` (sin WebGL) |
| `features/recipe-book/book-3d/recipe-overlay/` | `specs/recipe-book/recipe-overlay/recipe-overlay.spec.ts` |
| `features/recipe-book/recipe-form/` | `specs/recipe-book/recipe-form/{create-recipe,edit-recipe,dismiss}.spec.ts` + su `.mobile` |
| `features/recipe-book/_shared/supply-grid/` | `specs/recipe-book/supply-grid/supply-grid.spec.ts` |
| `features/recipe-book/_shared/price-capture/` | `specs/recipe-book/price-capture/price-capture.spec.ts` |
| `features/recipe-book/supply-list/` | `specs/recipe-book/supply-list/supply-list.spec.ts` |
| `features/recipe-book/supplies-dialog/` | `specs/recipe-book/supplies-dialog/supplies-dialog.spec.ts` + su `.mobile` |

**Toda feature nueva estrena su carpeta de specs en el mismo PR que la crea.** No es opcional: una
feature sin E2E se considera incompleta.

## Comandos

```bash
npm run test:e2e          # typecheck:e2e + ng build + Playwright (toda la suite: desktop + mobile)
npm run test:e2e:ui       # lo mismo, en modo UI de Playwright
npm run test:e2e:debug    # inspector (asume que ya hay build)
npm run test:e2e:report   # abre el último informe HTML
npm run typecheck:e2e     # type-check SOLO de la suite (tsc -p e2e/tsconfig.json)
npm run e2e:serve         # sirve el build ya compilado en :4200 (para depurar a mano)
```

Se sirve el **build compilado** (`dist/misaevol/browser`) con `support/static-server.mjs`, no
`ng serve`: la app carga como en producción y cada navegación es un fichero estático — más rápido y
determinista.

## CRITICAL: la suite es independiente de `src/` (por construcción)

Los E2E prueban la app como **caja negra**, a través del **build compilado**. Su única dependencia
del proyecto Angular es ese artefacto (`dist/misaevol/browser`), producido por `ng build` antes de
arrancar Playwright. **Nada bajo `e2e/` importa código de `src/`** — ni con alias (`@core/*`,
`@app/*`, `@components/*`, `@features/*`, `@platform/*`) ni con rutas relativas (`../src/app/…`).

Por qué: si un spec importa una entidad del dominio o un token del tema, deja de verificar lo que el
usuario recibe y empieza a verificar lo que el código dice de sí mismo. Un refactor que rompa la app
seguiría pasando en verde porque test y producción comparten la misma mentira. Además el suite dejaría
de poder correr contra un build ya publicado.

**No es convención, son dos cerrojos** en `e2e/tsconfig.json` (que **no** extiende el tsconfig raíz,
justo para no heredar sus `paths`):

| Cerrojo | Bloquea | Error |
|---|---|---|
| `"paths": {}` | `import … from '@core/…'` | `TS2307` |
| `"rootDir": "."` | `import … from '../src/app/…'` | `TS6059` |

`npm run typecheck:e2e` los verifica y corre **dentro de `npm run test:e2e`**, antes del build: un
import a `src/` no llega ni a compilar. Ninguno de los dos se quita.

**Lo que sí se comparte es el contrato observable**, no el código: la URL (`/home`), los nombres
accesibles (`Guardar`, `Nombre`), los roles/ARIA y el DOM que la vista publica.

### `public/` SÍ es fuente de datos compartida

La prohibición es sobre `src/`. **`public/` está permitido**: son assets publicados —los sirve el
mismo build que prueban los E2E—, no código de la app. Es el sitio para compartir datos entre app y
suite.

Por eso `e2e/support/seed.ts` **lee** `public/seed/recipe-book.seed.json` (con `readFileSync`, no
con un `import`) y **deriva** de él los hechos del estado inicial: categorías, recetas, sabores,
capacidades, nombres de insumo y cuántos hay. Antes eran una transcripción a mano con una nota de
«si el JSON cambia, actualiza esto» — deriva silenciosa. Ya no puede desalinearse.

Lo que **sigue siendo literal** es lo que el test espera **ver en pantalla**: el total de una receta
(lo calcula `PreviewRecipeCost`) y el empaque de un insumo (la vista normaliza 1000 g → «1 kg»).
Recalcularlo en el test sería duplicar la lógica bajo prueba — el test asertaría su propia
aritmética. Cada literal lleva una **guarda** contra el dato crudo del JSON: si el seed cambia, el
módulo falla al importarse con un mensaje que dice qué actualizar.

**Nunca** se importa una entidad, un VO ni un token del tema para construir un valor esperado.

## Cómo se escribe un spec (forma obligatoria)

```typescript
import { test, expect } from '../../../fixtures/app-fixture';   // ← NUNCA de '@playwright/test'
import { SUPPLIES } from '../../../support/seed';

/**
 * Qué flujo cubre este fichero y por qué (una vista de features/, su punto de entrada
 * y su estado terminal).
 */
test.describe('Formulario de receta · crear', () => {
  test('nueva receta con un insumo del catálogo → guardar → aparece en su categoría', async ({
    openCatalog,   // fixture: navega hasta la vista
    catalog,       // page objects
    form,
    grid,
  }) => {
    await openCatalog();

    await catalog.newRecipeIn('Queques').click();
    await form.waitReady();
    await form.name.fill('Bizcocho E2E');
    await grid.fillExistingLine(0, SUPPLIES.harina.name, '500');
    await form.save.click();

    await form.waitClosed();
    await expect(catalog.recipe('Queques', 'Bizcocho E2E')).toBeVisible();   // ← estado terminal
  });
});
```

Reglas de la forma:

| Regla | Detalle |
|---|---|
| `test`/`expect` del fixture | `import { test, expect } from '.../fixtures/app-fixture'` — nunca de `@playwright/test` (perderías page objects, la anulación de WebGL y la guarda de errores). |
| Cero selectores en el spec | Todo locator vive en un **page object**. Si falta uno, se **añade al page object**, no se escribe `page.locator('.foo')` en el test. |
| Locators semánticos | `getByRole`, `getByLabel`, atributos ARIA, elemento nativo. **Nunca** clases de utilidad Tailwind (`.bg-brand`) ni clases BEM (ya no existen). |
| `data-test-id` solo como último recurso | Cuando no hay rol ni nombre accesible posible. Si hace falta, probablemente falta accesibilidad en la vista: arréglala primero. |
| Aserciones web-first | `await expect(locator).toBeVisible()` (auto-retry). **Prohibido** `waitForTimeout` como sincronización, `sleep`, o contar milisegundos. |
| Estado inicial = el seed | Cada test arranca en un contexto de navegador nuevo (IndexedDB vacía) y el seed se resiembra. **No hay limpieza entre tests** ni `beforeEach` de datos: se leen las constantes de `support/seed.ts`. |
| Sin errores no capturados | El fixture `pageErrors` es `auto` y falla el test si la vista lanza un error de página. No se desactiva. |

### Page objects

Uno por vista de `features/` (o por parte estable y reutilizable, como la grilla de insumos). Es el
único sitio con conocimiento del DOM:

```typescript
export class RecipeFormPage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.locator('app-recipe-form');
  readonly name = this.root.getByLabel('Nombre');
  readonly save = this.root.getByRole('button', { name: 'Guardar' });

  /** Espera a que el diálogo esté montado y operable. */
  async waitReady(): Promise<void> { … }

  /** Espera a que el CDK haya retirado el panel del overlay (no solo desmontado el componente). */
  async waitClosed(): Promise<void> { … }
}
```

- Expone **locators** (`readonly`) y **acciones compuestas** (`fillExistingLine`, `setPurchase`),
  no aserciones de negocio — esas van en el spec.

> ### CRITICAL: el nombre de una acción se exige `exact`
>
> `getByRole`/`getByLabel`/`getByText` coinciden por **subcadena**. En una vista donde el usuario
> teclea nombres —el libro es exactamente eso— cualquier acción cuyo rótulo aparezca dentro de un
> dato tecleado deja de ser única, y el locator resuelve a dos elementos:
>
> ```typescript
> // MAL — la fila de la receta «Con insumo nuevo» también se llama así
> getByRole('button', { name: 'Nuevo' })
> // BIEN
> getByRole('button', { name: 'Nuevo', exact: true })
> ```
>
> Es un fallo que **no aparece con tests aislados** (nadie había creado esa receta todavía) y sí
> en cuanto un journey encadena crear y volver a listar — y en producción lo dispararía un
> usuario llamando «Nuevo bizcocho» a una receta. Regla: **toda acción de la vista se localiza
> con `exact: true`**; se deja sin `exact` solo cuando el rótulo no puede colisionar dentro de su
> raíz y está justificado en un comentario.
>
> El reverso también importa: **no escondas `.first()` dentro de un locator de consulta.** Con
> recetas homónimas (`Crema Chantilly` está en Rellenos y en Coberturas), un `.first()` en el page
> object hace que `expect(...).toBeVisible()` pase aunque falte una de las dos. El locator
> devuelve las que haya —así el spec puede contar— y quien necesite pulsar una elige `.first()`
> en el sitio de la llamada.
- Documenta con JSDoc **qué vista** representa y las trampas del control (p.ej. el
  `migo-unit-input` lee la unidad en `keydown`, así que se pulsa la tecla, no se escribe).
- Se registra en `fixtures/app-fixture.ts` para llegar por destructuring a cada test.

### Fixtures

`fixtures/app-fixture.ts` extiende `base.extend<AppOptions & AppFixtures>` y aporta:

- **Page objects** (`home`, `catalog`, `form`, `grid`, `priceCapture`, `supplies`, `supplyList`, …).
- **Atajos de navegación** (`openHome`, `openCatalog`, `openBook3d`): llevan a la vista y esperan a
  que esté operable. Si un flujo nuevo repite ≥ 4 líneas de navegación, se añade su fixture aquí.
- **`pageErrors`** (`auto`): falla el test si hubo errores no capturados.
- **La opción `webgl`** (ver abajo).

## WebGL: la ruta accesible es el modo por defecto

`Home3d` y `RecipeBook3d` detectan WebGL y, si no lo hay, renderizan su **ruta accesible en DOM**.
La suite explota eso:

- **Por defecto `webgl: false`** — se anula el contexto WebGL (`support/webgl.ts`) y la vista cae al
  DOM: determinista, sin GPU, milisegundos. **Aquí se prueban los flujos de negocio.**
- **Los specs del mundo/libro 3D declaran `test.use({ webgl: true })`** y viven en su propia carpeta
  (`specs/game/home/`, `specs/recipe-book/book-3d/`, `specs/recipe-book/recipe-overlay/`).
- En 3D el único texto accesible del contenido es la región `aria-live` (`book.announce`): se
  sincroniza contra **ella**, no contra el canvas.

```typescript
test.describe('Libro 3D · paginación', () => {
  test.use({ webgl: true });      // ← el bloque entero corre con el motor 3D real
  …
});
```

## Mobile-first: `*.mobile.spec.ts`

La regla dura mobile-first se verifica **a 375px** ([mobile-first-conventions.md](mobile-first-conventions.md)).
La config tiene dos proyectos:

| Proyecto | Viewport | Qué corre |
|---|---|---|
| `desktop` | 1280×800 | todo **menos** `*.mobile.spec.ts` |
| `mobile` | 375×667 + `hasTouch` | **solo** `*.mobile.spec.ts` |

Un spec móvil se llama `<vista>.mobile.spec.ts`, vive en la carpeta de su vista y comprueba lo que
la regla exige: sin desbordamiento horizontal, diálogos full-bleed (body scrollea, header/footer
fijos), grillas que apilan o scrollean, targets ≥ 44px, viewport sin zoom. Interactúa con `tap()`,
no `click()`.

No se duplica la suite entera en móvil: un spec móvil por vista con lo que **cambia** en móvil.

## Core principle: flujos completos, no estados intermedios

**Un test de flujo completo siempre vale más que un test de estado intermedio.** Es la otra cara de
[«un test = un journey»](#critical-un-test--un-journey-no-un-caso-de-uso): además de encadenar
varios casos por sesión, **cada** caso llega hasta su final.

Un estado intermedio (apareció un botón, se abrió un modal, hay un spinner) solo prueba que un paso
funcionó — no dice nada de si la feature sirve. Cada test empieza en el **punto de entrada del
usuario** y termina en el **estado terminal observable**.

**Mal — estado intermedio:**
```typescript
test('el formulario se abre', async ({ openCatalog, catalog, form }) => {
  await openCatalog();
  await catalog.newRecipeIn('Queques').click();
  await expect(form.root).toBeVisible();      // ← ¿y luego?
});
```

**Bien — flujo completo:**
```typescript
test('Nuevo en Queques → nombre + insumo → guardar → aparece en la categoría', async ({
  openCatalog, catalog, form, grid,
}) => {
  await openCatalog();
  await catalog.newRecipeIn('Queques').click();
  await form.waitReady();
  await form.name.fill('Bizcocho E2E');
  await grid.fillExistingLine(0, SUPPLIES.harina.name, '500');
  await form.save.click();
  await form.waitClosed();
  await expect(catalog.recipe('Queques', 'Bizcocho E2E')).toBeVisible();
});
```

`waitReady()` / `waitClosed()` / `waitFor()` **conducen** el flujo; solo el `expect` final asserta
el resultado. Esa es la distinción — no son "aserciones intermedias".

### Qué cuenta como estado final

- Un dato **persistido y proyectado de vuelta** (la receta aparece en su categoría; el insumo está
  en la lista al reabrir el diálogo).
- Una **ruta/vista cambiada** (el libro se desmontó y volvió la cocina).
- Un elemento **ocultado de forma permanente** (el diálogo se cerró y el CDK retiró su overlay).
- Un **error estable sin salida** (el mensaje persiste y no hay acción alternativa).

Cuando un test necesita comprobar una **validación**, no termina en "apareció el error": corrige el
motivo y llega a guardar, o descarta y comprueba que el catálogo quedó intacto.

## Naming

El nombre describe el **camino completo**, con `→` entre pasos:

| Mal | Bien |
|---|---|
| `muestra el botón de reintentar` | `error al guardar → reintentar → receta guardada → aparece listada` |
| `al pulsar Nuevo se abre el modal` | `Nuevo en Queques → Cancelar → el catálogo queda intacto` |
| `el total se calcula` | `dos insumos → el total suma ambas líneas → guardar` |

El `describe` agrupa por **vista + escenario**, usando `·` como separador:
`'Formulario de receta · validación'`, `'Captura de precio · insumo nuevo'`.

## Mapear el flujo antes de escribir

Antes de escribir los tests de una vista, se mapea su **máquina de estados**:

1. **Leer los `input()`** de la vista/diálogo — definen su configuración por contexto.
2. **Leer los `output()` y sus handlers en el consumidor** — definen qué es un estado terminal
   *en ese contexto* (p.ej. `(closed)="showBook.set(false)"` → terminal = libro desmontado).
3. **Enumerar cada camino** desde la entrada hasta un terminal.
4. **Agrupar los caminos que comparten punto de partida en un journey** y ordenarlos según lo que
   escriben (primero los que no persisten). **No** se hace un test por camino: eso es justo lo que
   prohíbe [«un test = un journey»](#critical-un-test--un-journey-no-un-caso-de-uso).

Ejemplo — `RecipeForm` abierto desde el libro:

```
Nuevo «Categoría» → nombre + insumo → Guardar          → receta listada
Nuevo «Categoría» → Cancelar                            → catálogo intacto
Nuevo «Categoría» → × cabecera                          → catálogo intacto
Nuevo «Categoría» → Escape                              → catálogo intacto
Nuevo «Categoría» → Guardar sin nombre                  → Guardar deshabilitado → Cancelar
Nuevo «Categoría» → Guardar sin insumos                 → error de la grilla → añadir → guardar
Receta existente  → renombrar → Guardar                 → la lista muestra el nombre nuevo
Receta existente  → insumo sin precio → Guardar         → pide precio → ponerlo → guardar
```

Cuando el contexto cambia la configuración (con/sin WebGL, móvil/escritorio), **los caminos
divergen: se cubren ambos**.

## Extraer helpers

Cuando varios tests comparten una secuencia (≥ 4 líneas), se extrae:

- Secuencia de **navegación** reutilizable en varios specs → **fixture** en `app-fixture.ts`
  (`openCatalog`).
- Secuencia de **interacción con una vista** → **método del page object**
  (`grid.fillExistingLine`, `priceCapture.setPurchase`).
- Secuencia propia de **un solo spec** → función `async` con JSDoc en la cabecera del fichero.

Los nombres describen la secuencia de acciones, no el elemento del DOM.

## Cómo validar un fichero de tests

Cuando se pida "validar" o "revisar" un spec contra estas convenciones:

1. **Leer el fichero actual del disco** — nunca del historial de git, diffs ni versiones cacheadas.
2. **Comprobar cada test** con la checklist y emitir un diagnóstico.

### Checklist por test

| Regla | Comprobación |
|---|---|
| Ubicación | ¿Está bajo `e2e/specs/<área>/<vista>/`, espejando `src/app/features/`? |
| Fixture | ¿Importa `test`/`expect` de `fixtures/app-fixture`? |
| Page objects | ¿Cero `page.locator(...)`/selectores crudos en el spec? |
| **Journey** | ¿El test encadena **varios casos** en un solo arranque, o es un caso suelto que debería fusionarse con otro del mismo punto de partida? |
| **Un arranque** | ¿Hay un único `openX()`/`goto()` por test (salvo una normalización documentada al final)? |
| Flujo completo | ¿Cada caso del journey acaba en un estado terminal, y el `expect` final también? |
| Orden | ¿Los casos que no persisten van antes que los que escriben, y lo impredecible al final? |
| Naming | ¿Usa `→` y describe el camino entero, no un elemento? |
| Sincronización | ¿Aserciones web-first, sin `waitForTimeout` como espera? |
| Semántica | ¿Locators por rol/ARIA, sin clases de utilidad? |

### Checklist de cobertura del fichero

| Regla | Comprobación |
|---|---|
| Todos los caminos | ¿Cada camino de la máquina de estados tiene test? |
| Variantes de contexto | ¿Se cubren WebGL sí/no y móvil donde el comportamiento difiere? |
| Recuperación de error | ¿Cada validación/error se lleva hasta su terminal (corregir y guardar, o descartar)? |
| Feature cubierta | ¿Cada vista de `src/app/features/` tiene su carpeta de specs? |

### Formato del diagnóstico

- **Violaciones** — tests que rompen una regla (con la regla y qué arreglar).
- **Flujos que faltan** — caminos sin test.
- **Veredicto** — PASS (todo cumple y está cubierto) o FAIL (con la lista).