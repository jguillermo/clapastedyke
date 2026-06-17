# Components (UI Library) Conventions

Applies to files in `src/app/components/`.

## Qué es `components/`

`components/` es la **librería de componentes de diseño**: piezas de UI **agnósticas y
reutilizables**. El **comportamiento** lo aporta **Angular CDK** (overlay, focus-trap, listbox,
a11y); el **estilo**, exclusivamente **utilidades de Tailwind v4 generadas del tema Migo**
(`src/styles/migo/theme.css`). **No hay CSS por componente** (`styleUrl`/`.css`): todo el estilo
son utilidades Tailwind en la plantilla y en el objeto `host`. No son páginas ni conocen rutas;
los consume cualquier feature.

> **Catálogo vivo:** [`src/app/components/README.md`](../../src/app/components/README.md) lista los
> componentes creados, cómo se usan y el roadmap de lo que falta. Al crear un componente, añade su
> fila y su sección de uso allí.

## Uso obligatorio: toda la UI se arma con estos componentes

**Cualquier plantilla HTML de la app (features, vistas, diálogos, texto, formularios, tarjetas…)
se construye con los componentes de esta librería**, no con HTML/CSS ad-hoc.

- Si el componente necesario **existe** → úsalo (`@components/...`).
- Si **no existe** → **créalo primero aquí** (con estas convenciones) y luego úsalo. **La tarea
  incluye crear el componente que falte**: la biblioteca crece conforme se necesita. Así se evita
  retrabajo y estilo duplicado.
- No se maquetan a mano botones, inputs, selects, diálogos, tarjetas, etc. en una feature cuando
  hay —o debería haber— un componente para ello.

**Única excepción — el mundo 3D** (`platform/three/*` + `features/game/*`): se renderiza con
**three.js**, no con DOM; **no** aplica esta regla.

## La regla de oro: CERO lógica de negocio

Un componente de `components/` **nunca** contiene ni conoce lógica de negocio. Solo presenta lo
que recibe y emite lo que ocurre. Si una pieza necesita saber **qué significan** los datos, no
va aquí.

| Permitido | Prohibido |
|---|---|
| Importar de `@angular/*` (core, common, forms) y `@angular/cdk/*` | Importar de `@core/`, `@features/`, `@platform/` |
| Componer con otros componentes de la librería (`@components/...`) | Inyectar servicios de dominio, use cases o repositorios |
| Estado de **UI** con signals (`open`, `focused`, `checked`) | Estado o reglas de **negocio** |
| Recibir datos por `input()`, emitir por `output()` | HTTP, IPC, `window.*`, `Router`, navegación |
| Estilar con utilidades del tema (`bg-brand`, `rounded-xl`, `gap-2`…) | Valores arbitrarios (`p-[40px]`, `bg-[#fff]`), `var(--token)` o CSS crudo |

> Esto es más estricto que las reglas de capas habituales: `components/` no importa de **ninguna**
> capa de la app, solo de Angular, CDK y de sí misma.

## Import rules

| Regla | Detalle |
|---|---|
| Solo Angular, CDK y componentes hermanos | `@angular/*`, `@angular/cdk/*`, `@components/...` |
| NUNCA `@core/`, `@features/`, `@platform/` | Sin dependencia de la app |
| Entre componentes de la librería, usar alias | `@components/form-field/form-field` (ver [path-aliases-conventions.md](path-aliases-conventions.md)) |

## Estructura

Un componente por carpeta; plantilla inline (componentes pequeños), spec co-locado. **Sin `.css`
por componente** — el estilo son utilidades Tailwind.

```
components/
├── button/
│   ├── button.ts        # plantilla + estilo (utilidades Tailwind) — sin .css
│   └── button.spec.ts
├── card/          # migo-card + partes (-header/-title/-subtitle/-body/-footer)
├── form-field/
├── input/
├── checkbox/
├── select/
└── dialog/        # solo el servicio MigoDialog (sin chrome)
```

## Naming

- **Sin sufijo `.component`** en fichero ni clase: `button.ts` / `class Button`.
- Selectores en kebab-case con prefijo **`migo-`** (es el design system Migo): `migo-select`,
  `migo-checkbox`, `migo-card-title`. **No `app-`** — ese prefijo es para las features
  (`app-home`, `app-ui-showcase`). `angular.json` mantiene `prefix: app`; los componentes del DS
  usan `migo-` por convención (no hay ESLint que lo imponga).
- **No hay clases CSS internas propias** (`migo-btn`, `migo-field__label`…): el estilo son
  utilidades Tailwind. Las únicas clases con prefijo `migo-` que quedan son las que el CDK necesita
  como hook global del diálogo (`migo-dialog__panel`/`migo-dialog__backdrop`, definidas en
  `src/styles.css`). Para tests/hooks estables, apóyate en selectores semánticos (rol, elemento
  nativo, atributo ARIA), no en clases de utilidad.
- Para controles montados sobre un elemento nativo, **selector de atributo** sobre el nativo:
  `selector: 'button[migo-button], a[migo-button]'` (conserva la semántica accesible).
- El nombre de la clase puede divergir del selector si evita colisiones
  (`migo-input` → `class InputField`, para no chocar con el decorador `Input` de Angular).

## Reglas de componente (alineadas con CLAUDE.md)

- **Standalone** (default en v20+); **no** poner `standalone: true`.
- `ChangeDetectionStrategy.OnPush` siempre.
- `input()` / `output()` / `computed()` / `signal()`. Nada de `@Input`/`@Output`.
- **Host bindings dentro del objeto `host`** del decorador, nunca `@HostBinding`/`@HostListener`.
- Bindings de `class` (nunca `ngClass`/`ngStyle`).
- Control flow nativo (`@if`, `@for`, `@switch`).
- Plantilla **inline**; **sin `.css`/`styleUrl`** — el estilo son utilidades Tailwind del tema.
- **Estilo del host**: estilos base estáticos en `host: { class: '…' }`. Cuando las clases dependen
  de signals (variantes/tamaños/estado), un **único** binding `host: { '[class]': 'hostClasses()' }`
  con un `computed()` que devuelve la cadena completa (no mezclar `class:` estático con `[class]`).
- `inject()` en vez de constructor injection.
- Booleanos por input con `transform: booleanAttribute`.
- **Mobile-first (regla dura)**: base = móvil, se mejora con `sm:`/`md:`/`lg:`; sin anchos fijos que
  desborden; targets táctiles ≥ 44px (`min-h-11`). Verifica el componente a 375px en `/ui`. Detalle
  en [mobile-first-conventions.md](mobile-first-conventions.md).

## Form controls → `ControlValueAccessor`

Todo componente que sea un control de formulario (input, checkbox, select…) implementa
**`ControlValueAccessor`** y se registra con `NG_VALUE_ACCESSOR`, para enchufar con Reactive
Forms (`formControlName`, `[formControl]`) y `ngModel`.

```typescript
providers: [
  { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputField), multi: true },
]
// writeValue / registerOnChange / registerOnTouched / setDisabledState
```

`setDisabledState` actualiza un signal de UI; el valor vive en un signal y se emite en el evento
nativo (`input`, `change`). No hay validación de negocio dentro del control.

## Composición con `FormField`

`FormField` (`migo-form-field`) es el contenedor de **label + hint + error**: genera el `id`, la
relación ARIA (`for`, `aria-describedby`) y la región de error. Solo renderiza el `<label>` si
recibe `label` (así sirve de contenedor de solo-error para controles con etiqueta propia, como
el checkbox).

Los controles **se enganchan al `FormField` por DI opcional**, sin acoplarse a él:

```typescript
protected readonly field = inject(FormField, { optional: true });
protected readonly controlId = computed(() => this.field?.controlId ?? this.fallbackId);
protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
protected readonly isInvalid = computed(() => (this.field?.invalid() ?? false) || this.invalid());
```

Standalone (sin `FormField`) el control sigue funcionando y expone `ariaLabel` para la
accesibilidad.

## Dialog: servicio que abre un componente

El diálogo **no** es un componente declarativo: es un **servicio `MigoDialog`** (sobre
**`@angular/cdk/dialog`**) que **abre un componente**. El componente que se abre **es** el
diálogo.

```typescript
const ref = migoDialog.open<boolean>(ConfirmDialog, { data: { message }, ariaLabel: 'Confirmar' });
ref.closed.subscribe((result) => { ... });
```

- `MigoDialog.open(Componente, config?)` envuelve el `Dialog` de CDK y aplica los defaults Migo
  (`panelClass: migo-dialog__panel`, `backdropClass: migo-dialog__backdrop`). CDK Dialog ya aporta
  overlay centrado, backdrop, **focus-trap + restauración de foco**, **ESC** y bloqueo de scroll.
- El componente abierto inyecta **`MigoDialogRef`** para cerrarse (`ref.close(resultado)`) y
  **`MIGO_DIALOG_DATA`** para recibir datos. Ambos se re-exportan desde `dialog.service.ts`
  (son el `DialogRef`/`DIALOG_DATA` de CDK con nombre de marca).
- **Nombre accesible** vía `MigoDialogConfig.ariaLabel` al abrir (el contenedor de CDK Dialog lo
  lee en init).
- **El componente de contenido vive en `features/`**, no en `components/` (su texto es contenido
  de la app). El DS solo aporta el servicio.
- **El Dialog es un shell agnóstico**: NO aporta chrome (ni título, ni cuerpo, ni acciones). El
  contenedor del overlay es **transparente** (`.migo-dialog__panel .cdk-dialog-container` en
  `src/styles.css`: `background: transparent; padding: 0`). Toda la vista (superficie, header,
  body, footer) la pone el componente enviado, **típicamente con un `migo-card`**.
- **El ancho** lo decide quien abre vía `MigoDialogConfig.width` (CDK), no el shell.
- Solo el **backdrop** y la **animación** de entrada son globales (los crea el CDK fuera de
  cualquier componente).

## Card (superficie / maquetación)

`Card` es la pieza de maquetación del DS y la superficie que normalmente se monta dentro de un
diálogo. Composición por subcomponentes:

- **`migo-card`** (`class Card`): contenedor. Inputs `variant` (`elevated`|`outlined`|`filled`),
  `elevation` (`sm`|`md`|`lg`, solo elevated), `interactive` (hover sube sombra + cursor +
  focus-ring; pone `tabindex=0`). `rounded-xl overflow-hidden`, **sin padding** (lo ponen las
  partes). Las variantes se resuelven en un `computed()` enlazado a `host: { '[class]': … }`.
- **`migo-card-header`**: fila con slot `[card-icon]` (icono leading), bloque de título/subtítulo
  (contenido por defecto) y slot `[card-actions]` (trailing, `ms-auto`).
- **`migo-card-title`** (`<h3>`), **`migo-card-subtitle`** (`<p>` muted).
- **`migo-card-body`**: contenido con padding.
- **`migo-card-footer`**: fila de acciones a la derecha, con `border-t`.

Sombras por nivel: `shadow-sm/md/lg`. Iconos: se proyectan (`[card-icon]`), no hay sistema de
iconos propio. Todo el estilo con utilidades del tema.

> **Contenido proyectado sin `::ng-deep`.** Para estilar lo que llega por `ng-content` (icono y
> acciones del header), se envuelve el slot en un `<span class="contents [&>*]:size-6 …">`:
> `contents` evita una caja vacía cuando no se proyecta nada, y la **variante de hijo** `[&>*]:`
> aplica utilidades del tema al contenido proyectado. **Prohibido `::ng-deep`** (no hay CSS).
> Nota: las variantes arbitrarias estructurales (`[&>*]:`, `[&.cdk-option-active]:`) **sí** se
> permiten — lo prohibido son los **valores** arbitrarios (`size-[24px]`, `bg-[#fff]`).

## Iconos — SIEMPRE `migo-icon`

**Prohibido incrustar `<svg>` sueltos en plantillas.** Todo icono se pinta con
**`<migo-icon name="…">`** (`components/icon/`), que lee un **registro tipado**
(`icon.registry.ts`) y lo pinta como `<svg fill="currentColor">`.

Esta regla es **exclusivamente para iconos** (glifos inline de la UI). Las imágenes SVG
(logos, ilustraciones, fondos) van en `src/assets/images/` y se cargan con `NgOptimizedImage`
o `<img>` — nunca con `<migo-icon>`.

### Prefijos de librería

Los nombres de icono llevan un prefijo que identifica su librería de origen:

| Prefijo | Librería | Formato del nombre |
|---------|----------|--------------------|
| `mat:` | Material Design Icons (Filled, 24×24) | snake_case original (`mat:expand_more`) |
| `custom:` | Iconos propios sin librería externa | cualquiera |

Ejemplo: `<migo-icon name="mat:check" size="md" color="brand" />`

El `name` es `input.required<IconName>` → un nombre inexistente es **error de compilación**.
El nombre después del prefijo es **el nombre original de la librería**, nunca traducido.

### Cómo añadir un icono

1. `npm install -D <paquete>` — **solo dev**; no llega al bundle de producción.
2. Abrir el SVG del icono en `node_modules/<paquete>/…` y copiar el atributo `d` del `<path>`.
3. Registrar en `icon.registry.ts`: añadir el nombre al sub-tipo de la librería (`MatIconName`,
   etc.) y el `d` a `ICON_PATHS`.
4. Añadir un comentario inline: `// mat · <nombre original>`.
5. Si es una **librería nueva**: definir un nuevo sub-tipo, ampliar la unión `IconName` y
   documentar la fuente y la ruta de los SVGs en el bloque de cabecera del registro.

### Iconos propios (`custom:`)

Si no existe un icono adecuado en ninguna librería, añadir el nombre a `CustomIconName` con un
comentario `// custom · descripción`.

### Resto de reglas de uso

- **`size`** (`xs|sm|md|lg|xl` → `size-3.5/4/5/6/8`) y **`color`** (`current` + semánticos →
  `text-*`) salen de inputs del DS; viven en el `<svg>` interno. Las clases de **animación**
  (`opacity-*`, `rotate-*`, `transition-*`) las pone el consumidor en el propio `<migo-icon>`
  (van al host, afectan al svg) — así no chocan con el tamaño. Ej. checkbox (check con `opacity`),
  select (chevron con `rotate-180`).
- Decorativo por defecto (`aria-hidden`); con `ariaLabel` pasa a `role="img"` + `aria-label`.
- En slots de icono (`[card-icon]`) se proyecta un `<migo-icon card-icon name="mat:…" size="lg">`.
- Excepción: glifos que **no** son icono (p.ej. la barra de indeterminado del checkbox) siguen
  siendo un elemento con utilidades de tamaño del tema, no un `migo-icon`.

## Select con CDK Overlay + Listbox

El `Select` (panel desplegable) sí usa **CDK Overlay** declarativo:

- El panel vive en un **`<ng-template cdkConnectedOverlay>` dentro del componente**. Como las
  utilidades de Tailwind son **globales** (no scoped), el estilo del panel funciona aunque el DOM
  se proyecte fuera del componente — **desaparece** cualquier dependencia de la encapsulación.
- Lista con `cdkListbox` + `cdkOption` (`@angular/cdk/listbox`): teclado (flechas, Home/End,
  type-ahead), roles ARIA y gestión de foco. `cdkTrapFocus cdkTrapFocusAutoCapture` para el foco.
- Estado abierto/cerrado con un signal interno; abre/cierra en respuesta a eventos del overlay
  (`overlayOutsideClick`, `overlayKeydown`).
- **Estado de opción con variantes nativas de Tailwind**: la selección se estila con
  `aria-selected:` (+ `group`/`group-aria-selected:` para el check interior) y `aria-disabled:`,
  no con clases propias; el resaltado de teclado del CDK con `[&.cdk-option-active]:bg-surface-sunken`.

## Accesibilidad (requisito duro)

- Debe pasar **todos los checks de AXE** y cumplir **WCAG AA** (contraste, foco, ARIA). **Única
  excepción aceptada**: la regla AXE `meta-viewport` (el viewport bloquea el zoom a propósito) — no
  se arregla, se deshabilita esa regla puntual. Ver
  [mobile-first-conventions.md](mobile-first-conventions.md).
- Foco visible siempre con `focus-visible:shadow-focus focus-visible:outline-none` (utilidad del
  tema; el token es `--shadow-focus`).
- Preferir elementos nativos (`<button>`, `<input>`) y `<label for>` reales.
- Respetar `prefers-reduced-motion` con la variante `motion-reduce:` (p.ej. `motion-reduce:transition-none`).

## Estilo: solo utilidades Tailwind del tema Migo

> **OBLIGATORIO: en `components/` se estiliza EXCLUSIVAMENTE con Tailwind.** No es opcional ni una
> preferencia: ningún componente de la librería puede llevar `.css`/`styleUrl`, CSS puro,
> `var(--token)`, `[style]` con medidas/colores, ni valores arbitrarios (`p-[40px]`, `bg-[#fff]`).
> Si una pieza no se puede expresar con utilidades del tema, **se añade el token al tema**; nunca se
> escapa a CSS. (La única excepción de toda la app es el render three.js, que no es DOM.)

El design system se expresa como **tema de Tailwind v4** (`@theme` en `src/styles/migo/theme.css`),
que **genera** una utilidad por cada token semántico. Todo el estilo de la app son esas utilidades.

- **El tema es la única fuente.** `theme.css` define los tokens semánticos (limpiando los defaults
  de Tailwind con `--<namespace>-*: initial`) sobre la paleta primitiva de `palette.css`
  (`:root`, **sin** utilidades). Solo se exponen utilidades **semánticas**: `bg-brand`,
  `text-body`, `bg-surface-card`, `border-border-subtle`, `rounded-xl`, `shadow-lg`,
  `shadow-focus`, `text-h1`, `font-display`, `ease-out`, `duration-base`… La paleta cruda
  (`miel-600`, `terra-500`, `cacao-900`) **no** genera utilidades y **no** se usa.
- **PROHIBIDO valores arbitrarios** de Tailwind (`p-[40px]`, `bg-[#fff]`, `text-[13px]`,
  `min-h-[44px]`), `var(--token)` y CSS crudo. Si falta un valor, se **añade como token al tema**
  (lo decide el design system), no se inventa en la plantilla. *(Sin ESLint que lo imponga: es
  convención + code review.)*
- **Spacing**: la escala 4px nativa de Tailwind **coincide 1:1** con la escala Migo
  (`p-4` = 16px = `--s4` … `p-24` = 96px; `--touch-min` 44px = `min-h-11`). Usa esos pasos; no
  redefine spacing.
- **Variantes arbitrarias estructurales sí, valores no.** `[&>*]:`, `[&.cdk-option-active]:`,
  `peer-*`, `group-*`, `aria-*`, `motion-reduce:` están permitidas (seleccionan/condicionan; no
  introducen medidas/colores mágicos).
- **Renombres por colisión de namespace** (color de texto vs tamaño de fuente, ambos `text-*`):
  los **colores** de texto conservan el nombre Migo (`text-body`, `text-heading`, `text-muted`,
  `text-overline`); la **escala de tamaños** renombra los que chocan — `body-l`→`text-lead`,
  `body`→`text-base`, `body-s`→`text-sm`, `overline`→`text-eyebrow` (headings: `text-display`,
  `text-h1`…`text-h4`). Los colores de borde Migo (`--border-subtle/strong`) generan
  `border-border-subtle`/`border-border-strong` (doble `border` esperado).
- **Iconos**: van por `<migo-icon>` (ver sección "Iconos"), nunca `<svg>` sueltos. Glifos que no son
  icono (p.ej. la barra de indeterminado del checkbox) se dimensionan con pasos de escala
  (`w-2.5 h-0.5`), nunca con trucos de borde a px sueltos.

Las animaciones globales que apuntan a DOM del CDK (backdrop/panel del diálogo) **sí** viven como
CSS global en `src/styles.css` — no pueden ser utilidades porque el CDK genera ese DOM.

## Testing

- Spec **co-locado** junto al componente (`button.spec.ts`), vitest + `TestBed` con globals.
- Para form controls, probar el CVA con un host que use `[formControl]` (escribe valor → input;
  teclea → control; `control.disable()` → deshabilitado).
- Para el `Select` (overlay), abrir y aserir contra el panel en `document` por **rol**
  (`[role="listbox"]`, `[role="option"]`), no por clases de utilidad;
  `afterEach(() => fixture?.destroy())` para limpiar el overlay.
- En general, los specs consultan el DOM por **selector semántico** (elemento nativo, rol, atributo
  ARIA) o por la utilidad que codifica la variante (`bg-error`, `min-h-11`), nunca por clases BEM
  (`migo-*`), que ya no existen.
- Para `MigoDialog`, abrir un componente de prueba y aserir su contenido en `document` (+ la clase
  `.migo-dialog__backdrop`); `ref.close(x)` resuelve `ref.closed`. Cerrar con `Dialog.closeAll()`
  en `afterEach`.
- Los specs de `components/` van junto al componente (idiomático Angular); la regla de
  `testing/` de [unit-tests-conventions.md](unit-tests-conventions.md) aplica solo a `core/`.

## Showcase

El banco de pruebas / documentación viva vive en `features/ui-showcase/` (ruta `/ui`), **fuera**
de `components/`. Compone los componentes con un form reactivo real. Es el sitio para validar
visualmente y correr AXE.
