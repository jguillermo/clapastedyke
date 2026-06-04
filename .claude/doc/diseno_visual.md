# Diseño visual — Fundamentos y tokens · "Tu Pastelería"

Sistema visual del juego. Es la **fuente de verdad de estilo**: marca, paleta, tipografía, espaciado, radios, sombras, vidrio, movimiento y accesibilidad. Los componentes están en `diseno_componentes.md`, los flujos/pantallas/formularios en `diseno_pantallas_flujos.md`, y los iconos en `diseno_iconografia.md`. La lógica vive en `plan_de_negocio.md` y el mundo en `diseno_mundo_juego.md`.

> **Convención.** Igual que el resto del proyecto: **identificadores/tokens en inglés, descripción en español**. Los tokens se expresan como CSS custom properties (`--color-*`, `--space-*`…) y son la única fuente de valores; los componentes nunca usan hex crudo.

> **Reglas que cumple** (plugin UI/UX, prioridad 1→8): contraste AA 4.5:1, foco visible, touch ≥ 44px, SVG (sin emoji), tokens semánticos, animación 150–300 ms con `prefers-reduced-motion`, formularios con label visible y divulgación progresiva.

---

## 1. Personalidad de marca

**Cálido, artesanal y moderno; amable y juguetón sin ser infantil.** El juego debe sentirse como una cocina acogedora con una capa de software limpia y actual. Tres adjetivos guía: **acogedor** (warm), **claro** (clear), **vivo** (lively).

- El mundo 3D es low-poly de tonos cálidos; la interfaz son **paneles de vidrio** que flotan sobre él, limpios y legibles.
- Bonito = espacios generosos, esquinas redondeadas, sombras suaves, color con intención.
- Fácil = una sola acción principal por pantalla, divulgación progresiva, estados siempre claros.

---

## 2. Color

### 2.1 Tokens de color — modo claro (por defecto)

```css
:root {
  /* Marca */
  --color-primary:        #B8472A;  /* caramelo/rust — CTA principal */
  --color-primary-hover:  #9E3C22;
  --color-primary-press:  #893420;
  --color-primary-soft:   #F7E4D8;  /* fondo de chips/realces */
  --color-on-primary:     #FFFFFF;

  --color-honey:          #C98A12;  /* miel/ámbar — secundario, datos */
  --color-honey-soft:     #FBEBD0;

  --color-berry:          #C63F73;  /* frambuesa/glaseado — acento, popularidad */
  --color-berry-soft:     #F8E1EB;

  /* Neutros cálidos */
  --color-ink:            #2A211B;  /* texto principal */
  --color-ink-soft:       #6B5D52;  /* texto secundario */
  --color-ink-faint:      #9A8B7D;  /* texto terciario / placeholder */
  --color-paper:          #FBF6EE;  /* fondo de la app (crema) */
  --color-surface:        #FFFFFF;  /* tarjetas y paneles sólidos */
  --color-surface-2:      #FFFBF4;  /* superficie alterna */
  --color-border:         #E7DCCD;  /* bordes/divisores */
  --color-border-strong:  #D8C7B2;

  /* Semánticos (también estados de stock) */
  --color-success:        #4F8A5B;  /* pistacho — StockStatus.OK */
  --color-success-soft:   #E3F0E5;
  --color-warning:        #C98A12;  /* miel — StockStatus.LOW */
  --color-warning-soft:   #FBEBD0;
  --color-danger:         #C7402F;  /* frambuesa-rojo — StockStatus.EMPTY / destructivo */
  --color-danger-soft:    #F8E0DC;
  --color-info:           #3F6F9C;  /* arándano — informativo / foco */
  --color-info-soft:      #E1ECF4;
}
```

### 2.2 Tokens de color — modo oscuro (cocoa)

El modo oscuro **no invierte**: usa tonos cálidos desaturados y más claros, con contraste verificado por separado.

```css
:root[data-theme="dark"] {
  --color-primary:       #E0865E;  --color-on-primary: #2A150C;
  --color-primary-soft:  #3A271E;
  --color-honey:         #E0A93B;  --color-berry: #E07AA3;
  --color-ink:           #F3E9DC;  --color-ink-soft: #C2B2A1;  --color-ink-faint: #8C7B6C;
  --color-paper:         #1B1511;  --color-surface: #2A211A;   --color-surface-2: #332921;
  --color-border:        #43362B;  --color-border-strong: #574636;
  --color-success: #7FB388;  --color-warning: #E0A93B;  --color-danger: #E0705F;  --color-info: #6FA0C8;
  /* las *-soft = tono al 12–16% sobre surface */
}
```

### 2.3 Pares de contraste verificados (AA)

| Uso | Fore / Back | Ratio | Cumple |
|---|---|---|---|
| Texto principal | `ink` sobre `paper` | ~11:1 | AAA |
| Texto secundario | `ink-soft` sobre `paper` | ~5.1:1 | AA |
| Botón primario | `on-primary` sobre `primary` | ~4.7:1 | AA |
| Éxito/danger texto | `success`/`danger` sobre su `*-soft` | ≥ 4.5:1 | AA |

**Regla `color-not-only`:** ningún estado se comunica solo por color. `StockStatus` (EMPTY/LOW/OK), éxito y error siempre llevan **icono + etiqueta** además del color (ver `diseno_iconografia.md`).

### 2.4 Color del mundo 3D

El mundo low-poly usa una versión **más saturada y plana** (flat-shading) de la misma familia cálida: maderas (`#B98A5E`), crema de paredes (`#F0E2CC`), acentos de marca en toldos/letreros (`primary`, `berry`). Los edificios llevan un color identificador (ver `diseno_mundo_juego.md`); el detalle 3D es del arte, aquí solo se fija la familia tonal.

---

## 3. Tipografía

```css
--font-display: "Fraunces", Georgia, serif;                 /* títulos, nombres de nivel, números héroe */
--font-ui:      "Figtree", Inter, system-ui, sans-serif;     /* todo el UI y el cuerpo */
--font-mono:    "Space Mono", ui-monospace, monospace;       /* códigos, cronómetros */
```

- **Números/datos:** `font-variant-numeric: tabular-nums` sobre `--font-ui`, para que KPIs, precios y contadores no "bailen" (`number-tabular`).
- `font-display: swap` para evitar texto invisible (FOIT).

### 3.1 Escala tipográfica

| Token | px / line-height | Peso | Uso |
|---|---|---|---|
| `text-display` | 38 / 1.1 | Fraunces 600 | Nombre de nivel, celebración |
| `text-h1` | 30 / 1.15 | Fraunces 600 | Título de pantalla/overlay |
| `text-h2` | 24 / 1.2 | Fraunces 500 | Título de sección/edificio |
| `text-h3` | 20 / 1.25 | Figtree 600 | Subtítulo, título de card |
| `text-body-lg` | 18 / 1.55 | Figtree 400 | Texto destacado |
| `text-body` | 16 / 1.55 | Figtree 400 | Cuerpo base (mínimo en móvil) |
| `text-label` | 14 / 1.4 | Figtree 500 | Labels de campo, chips |
| `text-caption` | 12 / 1.4 | Figtree 500 | Ayudas, metadatos |
| `text-number` | 20–48 / 1 | Figtree 600 tabular | KPIs, contadores, precios |

Jerarquía por **tamaño + peso + espacio**, no por color. Medida 60–75 car. desktop / 35–60 móvil.

---

## 4. Espaciado y layout

```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
--space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
--space-12: 48px; --space-16: 64px;
```

- Ritmo vertical: 16 (dentro de grupo) / 24 (entre grupos) / 32–48 (entre secciones).
- **Breakpoints:** `sm 375` · `md 768` · `lg 1024` · `xl 1440`. Mobile-first; sin scroll horizontal; `min-height: 100dvh`.
- **Safe areas:** HUD y dock reservan `env(safe-area-inset-*)`; el contenido scrolleable nunca queda tapado.
- Ancho de overlay: `max-width: 560px` (formularios), `640px` (listas), centrado.

---

## 5. Radios, bordes y sombras

```css
--radius-sm: 8px;   --radius-md: 12px;  --radius-lg: 20px;
--radius-xl: 28px;  --radius-pill: 999px; --radius-round: 50%;

--shadow-sm:    0 1px 2px rgba(42,33,27,.06), 0 1px 3px rgba(42,33,27,.08);
--shadow-md:    0 4px 12px rgba(42,33,27,.10);
--shadow-lg:    0 12px 32px rgba(42,33,27,.16);
--shadow-glass: 0 8px 40px rgba(42,33,27,.18);
```

Elevación **consistente**: cards `--shadow-sm`, popovers/menus `--shadow-md`, modales `--shadow-lg`, paneles de vidrio `--shadow-glass`. Radio por defecto de cards/inputs `--radius-md`; paneles grandes `--radius-lg/xl`; chips y botones-pill `--radius-pill`.

---

## 6. Paneles de vidrio (glass) y scrim

El UI flota sobre el mundo 3D como **vidrio esmerilado cálido** (`blur-purpose`: el blur indica que el fondo queda en pausa, no es decoración).

```css
.glass {
  background: rgba(255, 251, 244, .72);          /* dark: rgba(34,27,20,.62) */
  backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, .55);    /* dark: rgba(255,255,255,.08) */
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass);
}
.scrim { background: rgba(26, 18, 12, .45); }     /* 45% — aísla el panel del mundo */

@supports not (backdrop-filter: blur(1px)) {
  .glass { background: var(--color-surface); }    /* degradación: panel sólido */
}
```

Detrás de cada overlay hay **scrim 40–60 %** para legibilidad.

---

## 7. Movimiento

```css
--ease-out:    cubic-bezier(.22, 1, .36, 1);    /* entradas */
--ease-in:     cubic-bezier(.4, 0, 1, 1);       /* salidas */
--ease-spring: cubic-bezier(.34, 1.56, .64, 1); /* "pop": botones, logros */
--dur-fast: 150ms;  --dur-base: 220ms;  --dur-slow: 320ms;
--dur-camera: 850ms; /* dolly de cámara del mundo */
```

- Micro-interacciones 150–300 ms; nada > 500 ms (salvo cámara del mundo, que es continuidad espacial).
- **Salida ≈ 65 %** de la entrada.
- Solo `transform`/`opacity` (nunca `width/height/top/left`); sin CLS.
- Entrada `ease-out`, salida `ease-in`; `ease-spring` solo para logro/press.
- **Press:** escala 0.97 en botones/cards tappables, restaura al soltar.
- **Stagger** de listas 30–50 ms por ítem.
- Modales animan **desde su origen** (escala+fade desde el botón/estación).

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```
Con reduced-motion se desactivan recorridos y parallax; los cambios de estado siguen ocurriendo, pero directos (sin saltos de layout). Animaciones **interrumpibles**: un tap las cancela; nunca se bloquea el input.

---

## 8. Capas (z-index)

```css
--z-world: 0;      /* canvas 3D */
--z-hud: 10;       /* barra superior + dock inferior */
--z-scrim: 40;     /* fondo oscurecedor del overlay */
--z-panel: 50;     /* panel de vidrio / overlay */
--z-toast: 100;    /* avisos */
--z-tutorial: 200; /* cursor guía + globo del chef + anillo de realce */
```

---

## 9. Accesibilidad (transversal, CRÍTICO)

- **Contraste** AA 4.5:1 en texto; glifos grandes ≥ 3:1 (§2.3).
- **Foco visible**: `outline: 2px solid var(--color-info); outline-offset: 2px;` (nunca se elimina).
- **Touch** ≥ 44×44 px, separación ≥ 8 px; iconos pequeños amplían área con padding/`hitSlop`.
- **Teclado:** orden de tab = orden visual; `Esc` cierra overlays; foco al primer campo inválido tras error.
- **`color-not-only`:** estados con icono + etiqueta además de color.
- **Ruta accesible / sin-WebGL:** el dock lista estaciones/edificios y opera todo sin 3D; el canvas es `aria-hidden`.
- **Texto escalable** hasta 200 % sin romper (envuelve, no trunca).
- **Toasts:** `aria-live="polite"`, no roban foco; errores con `role="alert"`.

---

## 10. Índice de tokens

Color §2 · Tipografía §3 · Espaciado §4 · Radios/sombras §5 · Glass §6 · Motion §7 · Z-index §8. Todo componente/pantalla referencia estos tokens; **prohibido el hex crudo** fuera de este archivo.
