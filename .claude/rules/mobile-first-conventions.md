# Mobile-First Conventions

Applies to **toda la UI DOM** de la app: `src/app/components/`, `src/app/features/` y el HUD DOM
superpuesto al canvas 3D. **Excepción:** el render three.js (`platform/three/*` + el render 3D de
`features/game/*`) no es DOM y no aplica.

> **Regla dura.** La app se usa **principalmente en móvil**; el uso en móvil debe ser **fluido y
> sólido**. Mobile-first no es una mejora opcional: es el modo por defecto de maquetar. Cada
> componente y cada feature **debe** cumplir esta regla y verificarse a **375px** de ancho en `/ui`.

## Principio: mobile-first, nunca desktop-first

Las utilidades **base (sin prefijo) describen el MÓVIL**. Las pantallas grandes se tratan como una
**mejora progresiva** con los prefijos `sm:`/`md:`/`lg:`. Está **prohibido** el patrón desktop-first
(una utilidad base pensada para escritorio que se "arregla" para móvil).

```html
<!-- Correcto — base = móvil, se mejora hacia arriba -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">…</div>
<h1 class="text-h2 sm:text-h1">Título</h1>

<!-- Incorrecto — desktop-first: 3 columnas se aplastan en móvil -->
<div class="grid grid-cols-3">…</div>
```

## Breakpoints

Son los **defaults de Tailwind v4** (no se redefinen en el tema). Móvil = **base, sin prefijo**.

| Prefijo | Ancho mínimo | Uso típico |
|---|---|---|
| *(base)* | 0 | **Móvil** — el caso por defecto |
| `sm:` | 640px | Móvil grande / tablet vertical |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Escritorio |
| `xl:` | 1280px | Escritorio ancho |

## Layout fluido (las grillas no se aplastan)

- **Nada de anchos fijos que desborden** el móvil: prohibido `w-80`/`width: '640px'` como ancho
  único. Usa `w-full` + un `max-w-*` del tema (`max-w-reading` 680px, `max-w-page` 1120px) o
  `w-full sm:w-80` (full en móvil, fijo en `sm+`).
- **Grillas responsive apilan por defecto**: empieza en `grid-cols-1` y sube
  (`sm:grid-cols-2 lg:grid-cols-3`). Nunca columnas fijas en base.
- **Flex que envuelve**: filas de chips/acciones con `flex-wrap` para que caigan a la siguiente
  línea en pantallas estrechas.
- **`dvh`/`dvw` son utilidades estándar** de Tailwind v4 (`h-dvh`, `min-h-dvh`, `w-dvw`) y **sí** se
  permiten — no son valores arbitrarios. Úsalas para alturas a pantalla completa (la barra de URL
  móvil cambia `vh`; `dvh` es el correcto).
- Sigue **vigente la prohibición de valores arbitrarios** (`p-[40px]`, `w-[640px]`, `bg-[#fff]`) y
  de CSS crudo — ver [components-conventions.md](components-conventions.md). Si falta una medida, se
  añade como token al tema.

## Touch targets

Todo elemento interactivo (botón, enlace, control, fila tocable) mide **≥ 44px** en su lado táctil
(`min-h-11`, que ES el token `--touch-min` del tema). El botón por defecto es `md` (44px); **no uses
`sm` (36px) como única acción táctil** de una pantalla. Ídem para áreas de toque pequeñas (iconos
clicables): envuélvelas en un `<button migo-button>` con altura mínima, no un `<svg>` de 24px suelto.

## Tipografía mobile-first

Los titulares grandes del tema (`text-display` 52px, `text-h1` 40px, `text-h2` 30px) **desbordan**
pantallas estrechas. Escala desde un tamaño móvil hacia arriba **en la plantilla**, sin tocar tokens
ni usar valores arbitrarios:

```html
<h1 class="text-h2 sm:text-h1">…</h1>
<p class="text-h4 sm:text-h2">…</p>
```

## Formularios y diálogos: full-bleed en móvil

En móvil un formulario/diálogo **ocupa toda la pantalla** y se siente **fijo y sólido** — no flota,
no tiene margen, no tiene radio, no se desplaza al tocar.

- El diálogo (`MigoDialog`) ya lo resuelve el chrome global: en `<640px` el panel se fija a
  `inset: 0` con `width: 100vw; height: 100dvh`; en `sm+` vuelve a tarjeta **centrada** con el
  `max-width` que pase quien abre (`MigoDialogConfig.width`) y `max-height: 90dvh` para scroll
  interno. Ver `src/styles.css` (`.migo-dialog__panel`).
- El **contenido** del diálogo es un `migo-card` con el input **`fill`**: el card llena el alto
  (`h-full flex flex-col`), pierde el radio en móvil (`rounded-none sm:rounded-xl`) y **solo el
  `migo-card-body` scrollea** (`flex-1 overflow-y-auto`); header y footer quedan **fijos** arriba y
  abajo.
- **Se ajusta al teclado**: en móvil el diálogo abraza el **visual viewport** (no el alto total del
  dispositivo), así que al aparecer el teclado **se encoge** al espacio visible sobre él —
  header/footer siguen a la vista y el body scrollea hasta el campo enfocado, sin desplazarse hacia
  arriba ni parecer un error. Lo sincroniza `platform/viewport/` (variables `--vvh`/`--vvt` en
  `:root`), que consume `.migo-dialog__panel` en `src/styles.css`.

```html
<!-- Componente abierto como diálogo -->
<migo-card fill>
  <migo-card-header>…</migo-card-header>
  <migo-card-body><form>…</form></migo-card-body>   <!-- esto scrollea -->
  <migo-card-footer>…</migo-card-footer>            <!-- fijo abajo -->
</migo-card>
```

- **Popovers/overlays conectados** (`cdkConnectedOverlay`, p.ej. captura de precio) no deben
  desbordar: usa `w-full sm:w-<n>` en su superficie, nunca un ancho fijo mayor que el viewport.

## "Sólido": sin zoom del usuario

El viewport **desactiva el zoom** (`maximum-scale=1, user-scalable=no`, `src/index.html`) y el `body`
lleva `touch-action: manipulation` (`src/styles.css`) para que la UI se sienta una **app nativa**: el
usuario no puede hacer pinch-zoom ni doble-tap-zoom y el formulario no se mueve.

> ### Excepción de accesibilidad (ÚNICA)
> Bloquear el zoom **incumple WCAG 1.4.4** y dispara la regla **`meta-viewport` de AXE**. Es una
> **decisión de producto deliberada y aceptada**: es la **única** excepción a la regla dura
> "MUST pass all AXE checks / WCAG AA". **No se "arregla"** — si hay una corrida de AXE en `/ui` o en
> e2e, se **deshabilita esa regla puntual** (`meta-viewport`), no el bloqueo de zoom. **El resto de
> WCAG AA sigue siendo obligatorio**: contraste, foco visible, ARIA y navegación por teclado.

## Tablas / hoja de cálculo (`migo-grid`)

Una hoja de cálculo de columnas fijas no cabe en móvil. Se resuelve con **scroll horizontal**, no
apilando: el contenedor es `overflow-x-auto`, la cabecera y las filas comparten una pista
`min-w-max` y cada columna conserva un `min-w-*` del tema para no aplastarse. El usuario desliza
lateralmente; la navegación por teclado y los roles ARIA no cambian.

## Verificación (obligatoria por componente/feature)

- [ ] Se ve y se opera bien a **375px** de ancho (DevTools responsive o `/ui`).
- [ ] Ninguna grilla/tabla se aplasta (apila o scrollea en horizontal).
- [ ] Los formularios abiertos ocupan toda la pantalla en móvil, fijos, con el cuerpo scrollable y
      header/footer fijos.
- [ ] Todo target táctil ≥ 44px.
- [ ] No hay anchos fijos que desborden ni valores arbitrarios.
- [ ] No se puede hacer pinch-zoom (viewport bloqueado).
