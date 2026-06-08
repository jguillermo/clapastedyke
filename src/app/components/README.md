# Librería de componentes Migo (`@components`)

Componentes de UI **agnósticos** (cero lógica de negocio): comportamiento por **Angular CDK**,
estilo por los **tokens Migo** (`src/styles/migo/*.css`). Reglas completas en
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

## Estado

| Componente | Selector | Tipo | Reactive Forms (CVA) | Estado |
|---|---|---|:---:|:---:|
| [Button](#button) | `button[migo-button]`, `a[migo-button]` | Presentacional | — | ✅ |
| [Card](#card) (+ partes) | `migo-card` (+ `-header/-title/-subtitle/-body/-footer`) | Presentacional | — | ✅ |
| [FormField](#formfield) | `migo-form-field` | Layout de campo | — | ✅ |
| [Input](#input) | `migo-input` | Control de texto | ✅ | ✅ |
| [Checkbox](#checkbox) | `migo-checkbox` | Control booleano | ✅ | ✅ |
| [Select](#select) | `migo-select` | Control (CDK Overlay+Listbox) | ✅ | ✅ |
| [Dialog](#dialog) | `MigoDialog` (servicio) | Servicio (CDK Dialog) | — | ✅ |

---

## Button

`variant`: `primary` \| `secondary` \| `ghost` \| `danger` · `size`: `sm` \| `md` \| `lg` ·
`loading` · `block` · `disabled`. Slots: `[icon-leading]`, contenido (label), `[icon-trailing]`.

```html
<button migo-button variant="primary" size="md" [loading]="saving()">Guardar</button>
<a migo-button variant="ghost" href="...">Cancelar</a>
```

## Card

`migo-card` — `variant`: `elevated` \| `outlined` \| `filled` · `elevation`: `sm` \| `md` \| `lg`
(solo elevated) · `interactive`. Partes: `migo-card-header` (slots `[card-icon]`, `[card-actions]`),
`migo-card-title`, `migo-card-subtitle`, `migo-card-body`, `migo-card-footer`.

```html
<migo-card variant="elevated" elevation="md">
  <migo-card-header>
    <svg card-icon>…</svg>
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
- [ ] **Tag input / Autocomplete** (CDK Overlay + Listbox).
- [ ] **Date picker** (CDK Overlay + calendario).
- [ ] **Slider** (`migo-slider`).
- [ ] **Icon** — decidir estrategia (sprite SVG vs componente `migo-icon`); hoy los iconos se
      proyectan como `<svg>` sueltos.

> Mantener este README al día: al crear un componente, añadir su fila a **Estado**, su sección de
> uso y marcar/quitar su entrada del **Roadmap**.
