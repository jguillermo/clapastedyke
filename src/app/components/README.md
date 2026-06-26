# Librería de componentes Migo (`@components`)

Componentes de UI **agnósticos** (cero lógica de negocio): comportamiento por **Angular CDK** (y
**librerías de UI agnósticas aprobadas** — hoy `swiper`),
estilo por **utilidades de Tailwind generadas del tema Migo** (`src/styles/migo/theme.css`) — sin
CSS por componente ni valores arbitrarios. Reglas completas en
[`.claude/rules/components-conventions.md`](../../../.claude/rules/components-conventions.md).

Se importan con el alias `@components/...` y se usan como standalone (`imports: [...]`).

## Política de uso (OBLIGATORIA)

**Toda la UI se construye con los componentes de esta librería.** Al escribir cualquier plantilla
HTML (features, vistas, diálogos, texto, formularios, tarjetas…) **se usan los componentes del DS**,
no HTML/CSS ad-hoc.

- Si el componente que necesitas **ya existe** → úsalo.
- Si **no existe** → **créalo aquí primero** (añádelo a la librería con sus convenciones) y luego
  úsalo. La tarea incluye crear el componente que falte; la biblioteca **crece conforme se
  necesita**. Así no se hace retrabajo ni se duplica estilo.
- No se maquetan botones, inputs, selects, diálogos, tarjetas, etc. "a mano" en una feature cuando
  hay (o debe haber) un componente para ello.

**Única excepción: el mundo 3D** (`platform/three/*` + `features/game/*`). Se renderiza con
**three.js**, no con DOM, así que **no** aplica esta regla.

**Mobile-first (regla dura).** Todo componente es mobile-first y debe verse y operarse bien a
**375px** en `/ui`: base = móvil, se mejora con `sm:`/`md:`/`lg:`; sin anchos fijos que desborden;
targets táctiles ≥ 44px (`min-h-11`). Detalle en
[`.claude/rules/mobile-first-conventions.md`](../../../.claude/rules/mobile-first-conventions.md).

## Estado

| Componente | Selector | Tipo | Reactive Forms (CVA) | Estado |
|---|---|---|:---:|:---:|
| [Icon](#icon) | `migo-icon` | Presentacional | — | ✅ |
| [Button](#button) | `button[migo-button]`, `a[migo-button]` | Presentacional | — | ✅ |
| [Card](#card) (+ partes) | `migo-card` (+ `-header/-title/-subtitle/-body/-footer`) | Presentacional | — | ✅ |
| [FormField](#formfield) | `migo-form-field` | Layout de campo | — | ✅ |
| [Input](#input) | `migo-input` | Control de texto | ✅ | ✅ |
| [UnitInput](#unitinput) | `migo-unit-input` | Control numérico con unidad dentro | ✅ | ✅ |
| [Autocomplete](#autocomplete) | `migo-autocomplete` | Texto con completado fantasma | ✅ | ✅ |
| [Combobox](#combobox) | `migo-combobox` | Texto: fantasma (1) + desplegable (2+) | ✅ | ✅ |
| [Checkbox](#checkbox) | `migo-checkbox` | Control booleano | ✅ | ✅ |
| [Select](#select) | `migo-select` | Control (CDK Overlay+Listbox) | ✅ | ✅ |
| [Grid](#grid) | `migo-grid` | Hoja de cálculo (celdas + teclado) | — | ✅ |
| [SelectTag](#selecttag) | `migo-select-tag` | Etiquetas tipo Select2 (chips + autocompletar) | — | ✅ |
| [Dialog](#dialog) | `MigoDialog` (servicio) | Servicio (CDK Dialog) | — | ✅ |
| [Swiper](#swiper) | `migo-swiper` (+ `migoSwiperSlide`) | Carrusel con pestañas (Swiper Element) | — | ✅ |

---

## Icon

`migo-icon` — pinta un icono de **Material Design** desde un registro SVG tipado
(`icon/icon.registry.ts`). `name` (requerido, `IconName`) · `size`: `xs` (14) \| `sm` (16) \|
`md` (20, default) \| `lg` (24) \| `xl` (32) · `color`: `current` (default, hereda) \| `brand` \|
`body` \| `heading` \| `muted` \| `accent` \| `fresh` \| `celebrate` \| `success` \| `warning` \|
`error` \| `info` \| `on-brand` · `ariaLabel` (si se da, pasa a `role="img"`; por defecto es
decorativo `aria-hidden`).

Para **añadir un icono**: copia su `path` oficial de Material (filled, `viewBox 0 0 24 24`,
single-path) a `IconName` + `ICON_PATHS` en `icon/icon.registry.ts`. **No se usan `<svg>` sueltos**
en plantillas — todo icono va por `migo-icon`. Las clases de animación (`opacity-*`, `rotate-*`,
`transition-*`) se ponen en el propio `<migo-icon>`.

```html
<migo-icon name="check" />
<migo-icon name="settings" size="lg" color="brand" />
<migo-icon name="close" ariaLabel="Cerrar" />
<!-- animado por el consumidor (chevron del select) -->
<migo-icon name="expand_more" size="xs" color="muted" [class.rotate-180]="open()" />
```

## Button

`variant`: `primary` \| `secondary` \| `ghost` \| `danger` · `size`: `sm` \| `md` \| `lg` ·
`loading` · `block` · `disabled`. Slots: `[icon-leading]`, contenido (label), `[icon-trailing]`.

```html
<button migo-button variant="primary" size="md" [loading]="saving()">Guardar</button>
<a migo-button variant="ghost" href="...">Cancelar</a>
```

## Card

`migo-card` — `variant`: `elevated` \| `outlined` \| `filled` \| `warm` (papel cálido, hoja del libro) · `elevation`: `sm` \| `md` \| `lg`
(solo elevated) · `interactive` · `fill`. Partes: `migo-card-header` (slots `[card-icon]`,
`[card-actions]`), `migo-card-title`, `migo-card-subtitle`, `migo-card-body`, `migo-card-footer`.

**`fill`** (mobile-first): el card **llena** su contenedor (columna a toda altura) y el
`migo-card-body` pasa a ser la **única zona scrollable**; header/footer quedan fijos. Pierde el radio
en móvil (`rounded-none sm:rounded-xl`). Es el patrón para un componente abierto como **diálogo**:
en móvil el `MigoDialog` es full-bleed y el card con `fill` ocupa toda la pantalla. Ver
[`mobile-first-conventions.md`](../../../.claude/rules/mobile-first-conventions.md).

```html
<migo-card variant="elevated" elevation="md">
  <migo-card-header>
    <migo-icon card-icon name="layers" size="lg" />
    <migo-card-title>Título</migo-card-title>
    <migo-card-subtitle>Subtítulo</migo-card-subtitle>
    <button migo-button card-actions variant="ghost" aria-label="Cerrar">✕</button>
  </migo-card-header>
  <migo-card-body>Contenido…</migo-card-body>
  <migo-card-footer>
    <button migo-button variant="ghost">Cancelar</button>
    <button migo-button>Aceptar</button>
  </migo-card-footer>
</migo-card>
```

## FormField

Contenedor de **label + hint + error** con relación ARIA. `label` · `hint` · `error` · `required`.
Solo pinta el `<label>` si hay `label` (sirve de contenedor solo-error para el checkbox).

```html
<migo-form-field label="Email" hint="..." required [error]="emailError()">
  <migo-input type="email" formControlName="email" />
</migo-form-field>
```

## Input

`migo-input` — control de texto, `ControlValueAccessor`. `type` (`text`/`email`/`password`/
`number`/`search`/`tel`/`url`) · `placeholder` · `ariaLabel` · `invalid` · `disabled`.

```html
<migo-input type="email" placeholder="hola@migo.com" formControlName="email" />
```

## UnitInput

`migo-unit-input` — control numérico que muestra la **unidad dentro del input, junto al número**
que se escribe (el número crece con el contenido). `ControlValueAccessor` (valor `string`, admite
tokens como `1 kg`). Presentacional: la **unidad la calcula el consumidor** y se pasa por `unit`;
el componente no interpreta ni convierte. Inputs: `unit` · `placeholder` · `ariaLabel` · `invalid`
· `disabled`.

```html
<!-- `weightUnit()` lo resuelve el feature desde el dominio (p.ej. un value object) -->
<migo-unit-input formControlName="weight" [unit]="weightUnit()" (unitToken)="setUnit($event)" placeholder="1" />
```

El valor es **solo el número**; teclear `k`/`g`/`u` no escribe la letra, emite `unitToken` para que
el consumidor fije la unidad. Variante `seamless` (sin borde) para celdas de grilla; variante
`paper` (renglón inferior + realce cálido `surface-warm`) para integrarse a una hoja del libro.

## Autocomplete

`migo-autocomplete` — texto con **completado fantasma en línea**: al escribir, el resto de la primera
sugerencia que coincide aparece tenue dentro del campo; se acepta con Tab / → / Enter. Sin overlay.
`ControlValueAccessor`. Inputs: `suggestions` (string[]) · `placeholder` · `ariaLabel` · `invalid` ·
`disabled` · `seamless` · `paper` (renglón + realce cálido para una hoja del libro).

```html
<migo-autocomplete formControlName="name" [suggestions]="ingredientNames()" placeholder="Harina" />
```

## Combobox

`migo-combobox` — texto con **dos modos** según las coincidencias de lo tecleado:

- **1 coincidencia que empieza por** lo escrito → **fantasma en línea** (sufijo tenue; se acepta con
  Tab / → / Enter), con el scroll sincronizado al input para que **no se desalinee** con nombres largos.
- **2+ coincidencias**, o **1 que solo contiene** lo escrito → **desplegable** debajo (CDK Overlay +
  `role="listbox"`) para elegir con ratón o teclado (↑/↓, Enter, Tab, Esc).

La coincidencia del desplegable es **por contenido** (substring); el fantasma solo completa **por
prefijo**. `ControlValueAccessor` (valor `string`); se integra con `<migo-form-field>`. Inputs iguales
a Autocomplete: `suggestions` (string[]) · `placeholder` · `ariaLabel` · `invalid` · `disabled` ·
`seamless` · `paper`. Es el control de nombre que usa la grilla de insumos (`seamless`).

```html
<migo-combobox seamless formControlName="name" [suggestions]="ingredientNames()" ariaLabel="Ingrediente" />
```

## Checkbox

`migo-checkbox` — control booleano, `ControlValueAccessor`. `indeterminate` · `invalid` ·
`disabled`. La etiqueta es el contenido proyectado.

```html
<migo-checkbox formControlName="terms">Acepto los términos</migo-checkbox>
```

## Select

`migo-select` — combobox (CDK Overlay + Listbox), `ControlValueAccessor`. `options:
SelectOption[]` (`{ value, label, disabled? }`) · `placeholder` · `ariaLabel` · `invalid` ·
`disabled`.

```html
<migo-select [options]="countries" placeholder="País" formControlName="country" />
```

## Dialog

**Servicio que abre un componente** (`@angular/cdk/dialog`). El Dialog es un shell agnóstico: el
componente enviado **es** el diálogo (normalmente un `migo-card`). API: `MigoDialog.open(Comp,
config)`, `MigoDialogRef` (`.close(result)`, `.closed`), `MIGO_DIALOG_DATA`. Config útil: `data`,
`ariaLabel`, `width`.

```ts
const ref = this.dialog.open<boolean>(ConfirmDialog, {
  width: '480px',
  ariaLabel: 'Confirmar',
  data: { title, message },
});
ref.closed.subscribe((result) => { ... });
```

```ts
// dentro del componente abierto
protected readonly ref = inject<MigoDialogRef<boolean>>(MigoDialogRef);
protected readonly data = inject<ConfirmDialogData>(MIGO_DIALOG_DATA);
```

Ejemplo vivo de todos los componentes: ruta **`/ui`** (`features/ui-showcase/`).

## Grid

`migo-grid` — shell de **hoja de cálculo**: cabecera por columna, celdas pegadas, navegación por
teclado (↑/↓/Enter cambian de fila; ←/→ saltan de celda en el borde del cursor) y botón de eliminar
fila. Presentacional y agnóstico del editor: el consumidor proyecta una `<ng-template>` que pinta el
control de cada celda (típicamente `migo-combobox`/`migo-unit-input` `seamless`). Datos y lógica
(fila vacía, validación) los aporta el feature. Inputs: `columns` (`{label, width?}[]`) · `rows` ·
`protectLastRow` · `removable` (default `true`; `false` oculta la columna de acciones) · `ariaLabel`.
Output: `removeRow` (índice).

**Mobile-first**: en pantallas estrechas la grilla **scrollea en horizontal** (no se aplasta) — las
columnas conservan ancho (`min-w-32` las flexibles, `shrink-0` las de ancho fijo).

```html
<migo-grid [columns]="columns" [rows]="lineControls()" (removeRow)="removeLine($event)">
  <ng-template let-line let-r="rowIndex" let-c="colIndex">
    <div [formGroup]="line">
      @switch (c) {
        @case (0) { <migo-combobox seamless formControlName="name" [suggestions]="names()" /> }
        @case (1) { <migo-unit-input seamless formControlName="quantity" [unit]="unit(r)" /> }
      }
    </div>
  </ng-template>
</migo-grid>
```

## SelectTag

`migo-select-tag` — campo único estilo **Select2**: una caja con **chips** de lo elegido + un input;
al escribir abre un **panel** (CDK Overlay) con sugerencias **agrupadas por tipo** y permite **crear**
valores; **una por tipo** (elegir reemplaza). Toda la lógica vive en el componente; el consumidor solo
configura `types` e interpreta la salida. Inputs: `types` (`{key,label,values,allowCreate?}[]`),
`value?` (`Record<tipo,valor>`), `placeholder?`, `ariaLabel?`. Output: `valueChange`
(`Record<tipo,valor>`).

```html
<migo-select-tag [types]="charTypes()" (valueChange)="onChars($event)" placeholder="Añade…" />
```

---

## Swiper

`migo-swiper` — carrusel **mobile-first** con una fila de **pestañas accesibles** sincronizada con el
swipe. Envuelve **Swiper Element** (web component): `register()` se llama una vez en `main.ts` y su CSS
vive en el shadow DOM (no toca Tailwind ni el CSS global). El `CUSTOM_ELEMENTS_SCHEMA` queda
**encapsulado** en el componente. Cada slide se declara con la directiva `migoSwiperSlide` sobre un
`<ng-template>` con su `label` (texto de la pestaña). Input: `ariaLabel?`. Output: `indexChange`
(índice activo). Método: `slideTo(i)`. Tabs con patrón ARIA (`tablist`/`tab`/`tabpanel`, roving
tabindex, ←/→/Home/End).

```html
<migo-swiper ariaLabel="Tipos de receta">
  <ng-template migoSwiperSlide label="Queques">…</ng-template>
  <ng-template migoSwiperSlide label="Rellenos">…</ng-template>
  <ng-template migoSwiperSlide label="Coberturas">…</ng-template>
</migo-swiper>
```

---

## Roadmap — por desarrollar

Pendiente (ningún componente de abajo existe todavía). Orden sugerido por uso típico:

### Prioridad alta (formularios / feedback)
- [ ] **Textarea** (`migo-textarea`) — multilínea con autosize (`@angular/cdk/text-field`), CVA.
- [ ] **Radio / RadioGroup** (`migo-radio-group` + `migo-radio`) — CVA, `@angular/cdk/a11y`.
- [ ] **Switch / Toggle** (`migo-switch`) — booleano, CVA.
- [ ] **Spinner / Progress** (`migo-spinner`, `migo-progress-bar`) — estados de carga.
- [ ] **Alert / Banner** (`migo-alert`) — info/success/warning/error inline (tokens semánticos).
- [ ] **Toast / Snackbar** (servicio `MigoToast` sobre CDK Overlay) — notificaciones efímeras.

### Prioridad media (navegación / overlays)
- [ ] **Tooltip** (`migoTooltip` directiva, CDK Overlay).
- [ ] **Menu / Dropdown** (`migo-menu`, CDK Menu `@angular/cdk/menu`).
- [ ] **Tabs** (`migo-tabs` + `migo-tab`).
- [ ] **Accordion / Expansion** (`migo-accordion`, CDK Accordion).
- [ ] **Badge / Chip** (`migo-badge`, `migo-chip`).
- [ ] **Avatar** (`migo-avatar`) — imagen/iniciales.

### Prioridad baja (datos / formularios avanzados)
- [ ] **Table** (`migo-table`, CDK Table) — orden, selección.
- [ ] **Pagination** (`migo-paginator`).
- [x] **Combobox / Autocomplete** (CDK Overlay + Listbox) — ✅ hecho: `migo-combobox` (fantasma 1 + desplegable 2+).
- [ ] **Date picker** (CDK Overlay + calendario).
- [ ] **Slider** (`migo-slider`).
- [x] **Icon** (`migo-icon`) — ✅ hecho: registro SVG tipado de Material (`icon/icon.registry.ts`),
      inputs `name`/`size`/`color`/`ariaLabel`. Todo icono va por `migo-icon` (no `<svg>` sueltos).

> Mantener este README al día: al crear un componente, añadir su fila a **Estado**, su sección de
> uso y marcar/quitar su entrada del **Roadmap**.
