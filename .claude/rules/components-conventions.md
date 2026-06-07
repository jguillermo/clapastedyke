# Components (UI Library) Conventions

Applies to files in `src/app/components/`.

## Qué es `components/`

`components/` es la **librería de componentes de diseño**: piezas de UI **agnósticas y
reutilizables**. El **comportamiento** lo aporta **Angular CDK** (overlay, focus-trap, listbox,
a11y); el **estilo**, exclusivamente los **tokens del design system Migo**
(`src/styles/migo/*.css`). No son páginas ni conocen rutas; los consume cualquier feature.

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
├── form-field/
├── input/
├── checkbox/
├── select/
└── dialog/
```

## Naming

- **Sin sufijo `.component`** en fichero ni clase: `button.ts` / `class Button`.
- Selectores en kebab-case con prefijo `app-`: `app-select`, `app-checkbox`, `app-dialog`.
- Para controles montados sobre un elemento nativo, **selector de atributo** sobre el nativo:
  `selector: 'button[app-button], a[app-button]'` (conserva la semántica accesible).
- El nombre de la clase puede divergir del selector si evita colisiones
  (`app-input` → `class InputField`, para no chocar con el decorador `Input` de Angular).

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

`FormField` (`app-form-field`) es el contenedor de **label + hint + error**: genera el `id`, la
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

## Componentes con CDK Overlay (Dialog, Select)

Para popups (diálogo, panel de select) usar **CDK Overlay**. Patrón:

- El contenido del overlay vive en un **`<ng-template>` dentro del componente**. Al portarlo
  (`TemplatePortal` / `cdkConnectedOverlay`), la **encapsulación emulada sigue aplicando los
  estilos scoped** del `.css` del componente (los selectores `[_ngcontent-xxx]` casan por
  atributo, no por posición en el DOM). **No** hace falta `ViewEncapsulation.None`.
- Lo que el CDK crea **fuera** del componente (el **backdrop**) no recibe estilos scoped → su
  estilo es **global** y vive en `src/styles.css` (p.ej. `.app-dialog__backdrop`). Es la única
  excepción global y debe documentarse en el `.css` del componente.
- Foco: `cdkTrapFocus cdkTrapFocusAutoCapture` (de `@angular/cdk/a11y`) atrapa el foco y lo
  devuelve al disparador al cerrar.
- Para listas seleccionables (select) usar `cdkListbox` + `cdkOption` (`@angular/cdk/listbox`):
  aportan teclado (flechas, Home/End, type-ahead), roles ARIA y gestión de foco.
- El estado abierto/cerrado es **declarativo** vía un input (`[open]`) o un signal interno; el
  componente adjunta/desadjunta el overlay en un `effect()` y emite la salida correspondiente.

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
- Para overlays, abrir y aserir contra el panel en `document` (`.app-dialog__panel`,
  `.app-select__panel`); `afterEach(() => fixture?.destroy())` para limpiar el overlay.
- Los specs de `components/` van junto al componente (idiomático Angular); la regla de
  `testing/` de [unit-tests-conventions.md](unit-tests-conventions.md) aplica solo a `core/`.

## Showcase

El banco de pruebas / documentación viva vive en `features/ui-showcase/` (ruta `/ui`), **fuera**
de `components/`. Compone los componentes con un form reactivo real. Es el sitio para validar
visualmente y correr AXE.
