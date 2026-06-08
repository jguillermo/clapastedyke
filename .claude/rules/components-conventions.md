# Components (UI Library) Conventions

Applies to files in `src/app/components/`.

## Qué es `components/`

`components/` es la **librería de componentes de diseño**: piezas de UI **agnósticas y
reutilizables**. El **comportamiento** lo aporta **Angular CDK** (overlay, focus-trap, listbox,
a11y); el **estilo**, exclusivamente los **tokens del design system Migo**
(`src/styles/migo/*.css`). No son páginas ni conocen rutas; los consume cualquier feature.

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
| Estilar con tokens Migo (`var(--brand)`, `var(--r-md)`…) | Hardcodear colores/medidas fuera de tokens |

> Esto es más estricto que las reglas de capas habituales: `components/` no importa de **ninguna**
> capa de la app, solo de Angular, CDK y de sí misma.

## Import rules

| Regla | Detalle |
|---|---|
| Solo Angular, CDK y componentes hermanos | `@angular/*`, `@angular/cdk/*`, `@components/...` |
| NUNCA `@core/`, `@features/`, `@platform/` | Sin dependencia de la app |
| Entre componentes de la librería, usar alias | `@components/form-field/form-field` (ver [path-aliases-conventions.md](path-aliases-conventions.md)) |

## Estructura

Un componente por carpeta; plantilla inline (componentes pequeños), CSS externo, spec co-locado.

```
components/
├── button/
│   ├── button.ts
│   ├── button.css
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
- Las **clases CSS internas** también llevan el prefijo `migo-` (`migo-btn`, `migo-field__label`,
  `migo-dialog__panel`).
- Para controles montados sobre un elemento nativo, **selector de atributo** sobre el nativo:
  `selector: 'button[migo-button], a[migo-button]'` (conserva la semántica accesible).
- El nombre de la clase puede divergir del selector si evita colisiones
  (`migo-input` → `class InputField`, para no chocar con el decorador `Input` de Angular).

## Reglas de componente (alineadas con CLAUDE.md)

- **Standalone** (default en v20+); **no** poner `standalone: true`.
- `ChangeDetectionStrategy.OnPush` siempre.
- `input()` / `output()` / `computed()` / `signal()`. Nada de `@Input`/`@Output`.
- **Host bindings dentro del objeto `host`** del decorador, nunca `@HostBinding`/`@HostListener`.
- Bindings de `class` y `style` (nunca `ngClass`/`ngStyle`).
- Control flow nativo (`@if`, `@for`, `@switch`).
- Plantilla **inline** para piezas pequeñas; estilos en `.css` externo vía `styleUrl`.
- `inject()` en vez de constructor injection.
- Booleanos por input con `transform: booleanAttribute`.

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
  focus-ring; pone `tabindex=0`). `border-radius: var(--r-xl)`, `overflow: hidden`, **sin padding**
  (lo ponen las partes). Variantes con `[class.migo-card--*]` (class bindings).
- **`migo-card-header`**: fila con slot `[card-icon]` (icono leading), bloque de título/subtítulo
  (contenido por defecto) y slot `[card-actions]` (trailing, `margin-inline-start:auto`).
- **`migo-card-title`** (`<h3>`), **`migo-card-subtitle`** (`<p>` muted).
- **`migo-card-body`**: contenido con padding.
- **`migo-card-footer`**: fila de acciones a la derecha, con `border-top`.

Sombras por nivel: `--shadow-sm/md/lg`. Iconos: se proyectan (`[card-icon]`), no hay sistema de
iconos propio. Todo el estilo con tokens Migo.

## Select con CDK Overlay + Listbox

El `Select` (panel desplegable) sí usa **CDK Overlay** declarativo:

- El panel vive en un **`<ng-template cdkConnectedOverlay>` dentro del componente**: la
  **encapsulación emulada sigue aplicando los estilos scoped** del `.css` (los selectores
  `[_ngcontent-xxx]` casan por atributo, no por posición en el DOM). **No** hace falta
  `ViewEncapsulation.None`.
- Lista con `cdkListbox` + `cdkOption` (`@angular/cdk/listbox`): teclado (flechas, Home/End,
  type-ahead), roles ARIA y gestión de foco. `cdkTrapFocus cdkTrapFocusAutoCapture` para el foco.
- Estado abierto/cerrado con un signal interno; abre/cierra en respuesta a eventos del overlay
  (`overlayOutsideClick`, `overlayKeydown`).

## Accesibilidad (requisito duro)

- Debe pasar **todos los checks de AXE** y cumplir **WCAG AA** (contraste, foco, ARIA).
- Foco visible siempre con `box-shadow: var(--focus-ring)` y `outline: none` (solo
  `:focus-visible`).
- Preferir elementos nativos (`<button>`, `<input>`) y `<label for>` reales.
- Respetar `@media (prefers-reduced-motion: reduce)` en transiciones/animaciones.

## Estilo: solo tokens Migo

Todo valor de color, espaciado, radio, sombra, tipografía y motion sale de un token CSS de
`src/styles/migo/` (`--brand`, `--surface-card`, `--text-body`, `--border-subtle`, `--r-md`,
`--r-pill`, `--s4`, `--shadow-lg`, `--focus-ring`, `--ease-out`, `--dur-base`…). **Nunca** hex,
px sueltos ni colores crudos en el `.css` del componente, salvo casos inevitables
(p.ej. dimensiones de un glifo).

## Testing

- Spec **co-locado** junto al componente (`button.spec.ts`), vitest + `TestBed` con globals.
- Para form controls, probar el CVA con un host que use `[formControl]` (escribe valor → input;
  teclea → control; `control.disable()` → deshabilitado).
- Para el `Select` (overlay), abrir y aserir contra el panel en `document` (`.migo-select__panel`);
  `afterEach(() => fixture?.destroy())` para limpiar el overlay.
- Para `MigoDialog`, abrir un componente de prueba y aserir su contenido en `document` (+ la clase
  `.migo-dialog__backdrop`); `ref.close(x)` resuelve `ref.closed`. Cerrar con `Dialog.closeAll()`
  en `afterEach`.
- Los specs de `components/` van junto al componente (idiomático Angular); la regla de
  `testing/` de [unit-tests-conventions.md](unit-tests-conventions.md) aplica solo a `core/`.

## Showcase

El banco de pruebas / documentación viva vive en `features/ui-showcase/` (ruta `/ui`), **fuera**
de `components/`. Compone los componentes con un form reactivo real. Es el sitio para validar
visualmente y correr AXE.
