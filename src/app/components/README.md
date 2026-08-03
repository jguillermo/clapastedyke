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
| [Spacer](#spacer) | `migo-spacer` | Presentacional (separador horizontal) | — | ✅ |
| [Card](#card) (+ partes) | `migo-card` (+ `-header/-title/-subtitle/-body/-footer`) | Presentacional | — | ✅ |
| [FormField](#formfield) | `migo-form-field` | Layout de campo | — | ✅ |
| [Input](#input) | `migo-input` | Control de texto | ✅ | ✅ |
| [UnitInput](#unitinput) | `migo-unit-input` | Control numérico con unidad dentro | ✅ | ✅ |
| [Autocomplete](#autocomplete) | `migo-autocomplete` | Texto con completado fantasma | ✅ | ✅ |
| [Combobox](#combobox) | `migo-combobox` | Texto: fantasma (1) + desplegable (2+) | ✅ | ✅ |
| [Checkbox](#checkbox) | `migo-checkbox` | Control booleano | ✅ | ✅ |
| [Select](#select) | `migo-select` | Control (CDK Overlay+Listbox) | ✅ | ✅ |
| [Badge](#badge) | `migo-badge` | Presentacional (píldora de característica) | — | ✅ |
| [Alert](#alert) | `migo-alert` | Presentacional (aviso en línea) | — | ✅ |
| [CopyField](#copyfield) | `migo-copy-field` | Presentacional (valor + copiar) | — | ✅ |
| [Table](#table) | `migo-table` | Hoja de cálculo (`<table>` + teclado) | — | ✅ |
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

`variant`: `primary` \| `secondary` \| `ghost` \| `danger` · `size`: `2xs` (28) \| `xs` (32) \|
`sm` (36) \| `md` (44, default) \| `lg` (52) \| `xl` (56) \| `2xl` (64) · `loading` · `block` ·
`disabled`. Slots: `[icon-leading]`, contenido (label), `[icon-trailing]`.

El botón **no** lleva separación automática entre icono y texto: usa un [`migo-spacer`](#spacer)
entre ambos. Así el botón solo-icono queda limpio (sin hueco sobrante). Solo `md` (44px) cumple el
target táctil ≥44px por sí solo; los tamaños menores son para acciones secundarias/compactas (ver
mobile-first).

```html
<button migo-button variant="primary" size="md" [loading]="saving()">Guardar</button>
<a migo-button variant="ghost" href="...">Cancelar</a>
<!-- icono + texto: separa con migo-spacer -->
<button migo-button variant="secondary">
  <migo-icon icon-leading name="mat:add" size="sm" /><migo-spacer />Agregar
</button>
<!-- icono solo: sin spacer, sin hueco -->
<button migo-button variant="ghost" aria-label="Cerrar">
  <migo-icon icon-leading name="mat:close" size="sm" />
</button>
```

## Spacer

`migo-spacer` — separador **horizontal** sin nada visible: solo añade hueco (caja `inline-block`
vacía con ancho del tema). Úsalo donde necesites separar dos elementos en línea — típicamente entre
el icono y el texto de un botón. `size`: `sm` (4px) \| `md` (8px, default) \| `lg` (12px) ·
`hideOnMobile` (booleano): si se activa, desaparece en móvil y reaparece en `sm+` — pensado para
botones que en móvil ocultan su texto y dejan solo el icono (el spacer se va con el texto).

```html
<!-- entre icono y texto -->
<migo-icon icon-leading name="mat:edit" size="sm" /><migo-spacer />Editar

<!-- el texto se oculta en móvil → el spacer también -->
<migo-icon icon-leading name="mat:add" size="sm" />
<migo-spacer hideOnMobile /><span class="hidden sm:inline">Añadir</span>
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
`seamless` · `paper`. Output `selected` (string): se emite al **terminar** la selección (Tab / Enter o
clic en el desplegable, **no** al completar en línea con →), para que el consumidor avance al siguiente
campo (p. ej. la grilla de insumos enfoca la columna de cantidad). Es el control de nombre que usa la
grilla de insumos (`seamless`).

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
`disabled`. Una vez elegida una opción, su label se muestra como una **píldora/tag** dentro del
disparador (no texto plano) — confirma visualmente que la selección quedó puesta.

```html
<migo-select [options]="countries" placeholder="País" formControlName="country" />
```

## Badge

`migo-badge` — píldora presentacional para una característica corta (p.ej. el sabor o el tamaño de
una receta). Sin lógica, sin CVA (no es control de formulario). El texto es el contenido
proyectado. `size`: `sm` (default) · `xs` (más compacta, para varias juntas bajo un título).

Es un **dato secundario**: se dibuja con **contorno y sin relleno**, para que se vea el fondo a
través y no sobresalga. Por eso el texto va en `text-body` y no en `text-muted`: sin relleno propio
hereda el fondo de debajo, y `text-muted` sobre el papel del libro 3D se queda en 3.9:1 (por debajo
del 4.5:1 de WCAG AA). La jerarquía la marcan el tamaño y el peso, no una mancha de color.

```html
<migo-badge>Vainilla</migo-badge>
<migo-badge size="xs">Porciones: 40</migo-badge>
```

## Alert

`migo-alert` — **aviso en línea**: un mensaje con peso semántico que se queda en la página (a
diferencia de un toast, que pasa). `variant`: `info` (default) · `success` · `warning` · `error`.
`heading` es un título opcional; el cuerpo es contenido proyectado.

El **texto va en `text-body`, no en el color de la variante**. El color semántico se reserva al
icono y al borde: sobre `bg-*-soft`, un `text-error` se queda por debajo del 4.5:1 de WCAG AA.

El **rol ARIA cambia con la urgencia**: `error` (o `assertive`) usa `role="alert"`, que interrumpe
al lector de pantalla; el resto usa `role="status"`, que espera turno. Un aviso informativo que
interrumpe molesta tanto como un error que pasa desapercibido.

```html
<migo-alert variant="error">No se ha podido guardar la receta.</migo-alert>

<migo-alert variant="warning" heading="Falta un paso">
  Activa la API de Apps Script en tu cuenta y vuelve a intentarlo.
</migo-alert>
```

## CopyField

`migo-copy-field` — un valor de **solo lectura que el usuario tiene que llevarse a otro sitio**: una
URL que pegar en otra pestaña, un identificador que teclear en una consola. `value` es obligatorio;
`ariaLabel` (para cuando no hay `migo-form-field`) y `copyLabel` son opcionales. Emite `copied` con
el valor. **No es un `ControlValueAccessor`**: no edita nada.

Se copia con el **`Clipboard` del CDK**, no con `navigator.clipboard`: es síncrono, devuelve
`boolean` (así hay una rama de fallo real que pintar) y no exige contexto seguro.

**El nombre accesible del botón no cambia al copiar.** Cambiar el nombre de un elemento que tiene el
foco se anuncia de forma inconsistente entre lectores de pantalla, y duplicaría lo que ya dice la
región viva. Lo que cambia es el icono; la confirmación va en un `role="status"` aparte.

El `<input readonly>` no es decorativo: da **scroll horizontal** cuando el valor no cabe (crítico a
375px) y se autoselecciona al enfocarlo, así que **Tab + Cmd/Ctrl+C funciona sin tocar el botón** —
que es también la salida cuando el portapapeles falla. Por eso es `readonly` y no `disabled`: un
`disabled` no recibe foco ni se puede seleccionar.

```html
<migo-copy-field ariaLabel="URL del sincronizador" [value]="webAppUrl()" />

<migo-form-field label="URL del sincronizador" hint="No hace falta que hagas nada con ella.">
  <migo-copy-field [value]="webAppUrl()" />
</migo-form-field>
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

## Table

`migo-table` — shell de **hoja de cálculo** sobre un `<table>` real (`role="grid"`): cabecera por
columna, celdas pegadas y navegación por teclado (↑/↓/Enter cambian de fila; ←/→ saltan de celda en
el borde del cursor; **Tab nativo** fila-mayor). Presentacional y agnóstico del editor: el consumidor
proyecta una `<ng-template>` que pinta el control de cada celda (típicamente
`migo-combobox`/`migo-unit-input` `seamless`). Datos y lógica (fila vacía, validación) los aporta el
feature.

**Eliminar fila**: la tabla **no** trae columna de acciones. Si el feature necesita borrar, añade su
propia columna con un botón y llama a `migo-table.remove(rowIndex)` (vía referencia de plantilla
`#table`), que dispara la salida `removeRow`. Así el feature decide cuándo/dónde mostrar el botón.

**Tamaño de columna** (`size`): los anchos se expresan **en la escala del tema** (no valores
arbitrarios ni `[style]`): `table-auto` da `'fit'` y la pista compartida nativamente; px/`%`/flexible
se mapean a utilidades del tema vía mapas de literales.

| `size` | Comportamiento | Utilidad |
|---|---|---|
| `number` (px) | ancho fijo | `w-*` (p.ej. `96`→`w-24`) |
| `'40%'` | porcentaje | fracción (`w-2/5`) |
| `'fit'` | ajustado al contenido (sin partirse) | `w-px whitespace-nowrap` |
| *(omitido)* | flexible (absorbe lo que sobra) | `auto` (sin width) |

Inputs: `columns` (`{ name, size?, align?, max? }[]`) · `rows` · `ariaLabel` · `bleed` (en móvil
rompe el padding del padre y va borde a borde) · `maxWidth` (`'reading'|'page'`). Output: `removeRow`
(índice). Métodos públicos: `focusCell(r, c)` · `remove(index)` (dispara `removeRow`).

**Mobile-first**: vertical **nunca scrollea** (crece; scrollea el contenedor exterior). Las columnas
flexibles (`auto`) absorben el ancho sobrante; si las fijas/% suman de más, hay **scroll horizontal**
de fallback. `bleed` lleva la tabla a los bordes en móvil. Los inputs de celda llevan `min-w-0`
(variante `[&_input]:`) para que `table-auto` respete los anchos fijos.

```html
<migo-table
  #table
  [columns]="[{ name: 'Insumo' }, { name: 'Cantidad', size: 'fit', align: 'center' }, { name: '', size: 'fit' }]"
  [rows]="lineControls()"
  bleed
  (removeRow)="removeLine($event)"
>
  <ng-template let-line let-r="rowIndex" let-c="colIndex">
    <div [formGroup]="line">
      @switch (c) {
        @case (0) { <migo-combobox seamless formControlName="name" [suggestions]="names()" /> }
        @case (1) { <migo-unit-input seamless formControlName="quantity" [unit]="unit(r)" /> }
        @case (2) {
          <!-- botón de eliminar: lo pinta el feature y dispara removeRow vía la API de la tabla -->
          <button migo-button variant="ghost" size="sm" aria-label="Quitar fila" (click)="table.remove(r)">
            <migo-icon icon-leading name="mat:close" size="sm" />
          </button>
        }
      }
    </div>
  </ng-template>
</migo-table>
```

## SelectTag

`migo-select-tag` — campo único estilo **Select2**: una caja con **chips** de lo elegido + un input;
al escribir abre un **panel** (CDK Overlay) con sugerencias **agrupadas por tipo** y permite **crear**
valores; **una por tipo** (un tipo con valor se oculta de las opciones — quitar su chip lo vuelve a
ofrecer). Cada chip lleva su propia **×** para quitarlo. Toda la lógica vive en el componente; el
consumidor solo configura `types` e interpreta la salida. Inputs: `types`
(`{key,label,values,allowCreate?,validate?,extraField?}[]`), `value?` (`Record<tipo,valor>`),
`placeholder?`, `ariaLabel?`. Outputs: `valueChange` (`Record<tipo,valor>`) y `created`
(`{typeKey,value,extra}`, solo cuando se completa la creación de un valor nuevo con `extraField`).

```html
<migo-select-tag [types]="charTypes()" (valueChange)="onChars($event)" placeholder="Añade…" />
```

**`extraField`** — cuando un tipo lo declara (`{ label, placeholder? }`), tras elegir a qué grupo
añadir el valor nuevo, el panel pide **un dato numérico más** (p.ej. un factor de escalado) antes de
confirmar; al completarse, emite `created` para que el consumidor lo persista con su propio caso de
uso (el componente no llama a ningún servicio).

```html
<migo-select-tag
  [types]="[
    { key: 'flavor', label: 'Sabor', values: flavorLabels(), allowCreate: true },
    { key: 'portions', label: 'Porciones', values: portionLabels(), allowCreate: true, extraField: { label: 'Factor de escalado' } },
    { key: 'mold', label: 'Molde', values: moldLabels(), allowCreate: true, extraField: { label: 'Factor de escalado' } }
  ]"
  [value]="propertyValue()"
  (valueChange)="propertyValue.set($event)"
  (created)="onPropertyCreated($event)"
/>
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
- [x] **Alert / Banner** (`migo-alert`) — ✅ hecho: aviso en línea info/success/warning/error, con
      icono por variante y `role` según urgencia (`alert` vs `status`).
- [ ] **Toast / Snackbar** (servicio `MigoToast` sobre CDK Overlay) — notificaciones efímeras.

### Prioridad media (navegación / overlays)
- [ ] **Tooltip** (`migoTooltip` directiva, CDK Overlay).
- [ ] **Menu / Dropdown** (`migo-menu`, CDK Menu `@angular/cdk/menu`).
- [ ] **Tabs** (`migo-tabs` + `migo-tab`).
- [ ] **Accordion / Expansion** (`migo-accordion`, CDK Accordion).
- [x] **Badge** (`migo-badge`) — ✅ hecho: píldora presentacional de característica corta, una
      variante neutral. `migo-chip` (interactivo/eliminable) sigue pendiente si se necesita.
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
