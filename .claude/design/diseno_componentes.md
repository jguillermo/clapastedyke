# Diseño visual — Sistema de componentes · "Tu Pastelería"

Catálogo de componentes de UI. Usa los tokens de `diseno_visual.md` (prohibido el hex crudo). Iconos en `diseno_iconografia.md`. Formularios y pantallas completas en `diseno_pantallas_flujos.md`.

Convención: **nombres en inglés, descripción en español**. Todo componente define: anatomía, tamaños, estados (default/hover/press/focus/disabled) y tokens.

---

## 1. Button

Acción. **Una sola acción primaria por pantalla** (`primary-action`); el resto, subordinadas.

Variantes (`variant`): `primary` (caramelo sólido) · `secondary` (contorno) · `ghost` (texto) · `danger` (frambuesa, destructivo) · `pill` (acción del HUD/dock).
Tamaños (`size`): `sm` 36px · `md` 44px (default, mínimo táctil) · `lg` 52px (CTA de fase).

```css
.btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  min-height: 44px; padding: 0 var(--space-5);
  border-radius: var(--radius-pill);
  font: 500 16px/1 var(--font-ui);
  transition: transform var(--dur-fast) var(--ease-spring),
              background var(--dur-fast) var(--ease-out);
  cursor: pointer;
}
.btn--primary { background: var(--color-primary); color: var(--color-on-primary); }
.btn--primary:hover  { background: var(--color-primary-hover); }
.btn--primary:active { background: var(--color-primary-press); transform: scale(.97); }
.btn--secondary { background: transparent; color: var(--color-primary);
                  border: 1.5px solid var(--color-border-strong); }
.btn--ghost { background: transparent; color: var(--color-ink); }
.btn--danger { background: var(--color-danger); color: #fff; }
.btn:focus-visible { outline: 2px solid var(--color-info); outline-offset: 2px; }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn[aria-busy="true"] { pointer-events: none; }  /* muestra spinner, mantiene ancho */
```

- Icono + texto cuando aporta; icon-only solo con `aria-label` y ≥ 44px.
- **Async:** al enviar, `aria-busy` → spinner dentro, ancho fijo (sin CLS); luego éxito/error.

---

## 2. Glass panel / Overlay

Contenedor flotante sobre el mundo (room-menu, formularios, tutorial). Clase `.glass` (ver `diseno_visual.md` §6) + scrim.

Anatomía: **header** (título `text-h1` + botón cerrar `x`) · **body** (scroll si excede) · **footer** (acciones, primaria a la derecha).

```css
.overlay { position: fixed; inset: 0; z-index: var(--z-panel);
           display: grid; place-items: center; padding: var(--space-4); }
.overlay__scrim { position: fixed; inset: 0; z-index: var(--z-scrim);
                  background: rgba(26,18,12,.45); }
.overlay__panel { width: min(560px, 100%); max-height: min(86dvh, 720px);
                  display: flex; flex-direction: column; }
.overlay__header { display: flex; align-items: center; justify-content: space-between;
                   padding: var(--space-5) var(--space-6); }
.overlay__body { overflow-y: auto; padding: 0 var(--space-6) var(--space-6); }
.overlay__footer { display: flex; gap: var(--space-3); justify-content: flex-end;
                   padding: var(--space-4) var(--space-6);
                   border-top: 1px solid var(--color-border); }
```

- **Entrada:** escala 0.96→1 + fade desde el origen, `--dur-base var(--ease-out)`. **Salida** ~65 %.
- **Cierre:** botón `x`, tecla `Esc`, click en scrim. Con cambios sin guardar → confirmar (`sheet-dismiss-confirm`).
- En móvil (≤ md) el panel sube como **bottom-sheet** (ancho completo, radio superior `--radius-xl`, swipe-down para cerrar).

---

## 3. Card

Bloque de contenido (receta, insumo/almacén, pedido, cliente, regla).

```css
.card { background: var(--color-surface); border: 1px solid var(--color-border);
        border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
        padding: var(--space-4); }
.card--interactive { cursor: pointer;
        transition: transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-fast); }
.card--interactive:hover  { box-shadow: var(--shadow-md); }
.card--interactive:active { transform: scale(.98); }
```

Variante **`card--storage`** (almacén de ingrediente): franja de estado a la izquierda de 4px con el color del `StockStatus`, icono de tarro + nombre + cantidad (tabular) + `StatusBadge`.

---

## 4. StatusBadge — estado de stock (`StockStatus`)

Traduce `EMPTY` / `LOW` / `OK`. **Color + icono + etiqueta** (nunca solo color).

| `StockStatus` | Token color | Icono (Lucide) | Etiqueta |
|---|---|---|---|
| `EMPTY` | `--color-danger` | `circle-alert` | Agotado |
| `LOW` | `--color-warning` | `triangle-alert` | Poco |
| `OK` | `--color-success` | `circle-check` | Suficiente |

```css
.badge { display: inline-flex; align-items: center; gap: var(--space-1);
         padding: 2px var(--space-2); border-radius: var(--radius-pill);
         font: 500 12px/1.4 var(--font-ui); }
.badge--empty { color: var(--color-danger);  background: var(--color-danger-soft); }
.badge--low   { color: var(--color-warning); background: var(--color-warning-soft); }
.badge--ok    { color: var(--color-success); background: var(--color-success-soft); }
.badge svg { width: 14px; height: 14px; }
```

El mismo patrón sirve para estados de pedido/presupuesto (Pendiente/Producción/Entregado/Cancelado y por-vencer/vencido), con su color semántico + icono + etiqueta.

---

## 5. HUD — barra superior

Aparece en `WorldScene.TOWN` (Fase 4+). Translúcida (`.glass` ligera), `--z-hud`, respeta safe-area.

Anatomía: **marca** (logo + nombre del negocio, izquierda) · **KPIs** (`StatChip` a la derecha) · **menú** (`circle-help`, `settings-2`).

`StatChip`: icono + número (tabular) + etiqueta corta. Color del chip según KPI (neutro/ámbar/rojo/verde) pero con icono (no solo color).

```
┌───────────────────────────────────────────────────────────────┐
│ 🧁 Dulces Misa        [📋 3 pend] [⏳ 1 x vencer] [📦 2 rojo]  ⚙ │
└───────────────────────────────────────────────────────────────┘
```

---

## 6. Dock — barra inferior + ruta accesible

Tira de chips de estación (en `KITCHEN`) o de edificio (en `TOWN`). Es **siempre la ruta accesible** (opera todo sin 3D). `--z-hud`, safe-area inferior.

`DockChip`: icono + etiqueta; estado `active` resaltado (color + peso + indicador), `locked` con candado y atenuado.

```css
.dock { display: flex; gap: var(--space-2); justify-content: center;
        padding: var(--space-2) var(--space-3); }
.dock__chip { min-height: 44px; display: inline-flex; flex-direction: column;
              align-items: center; gap: 2px; padding: var(--space-2) var(--space-3);
              border-radius: var(--radius-md); color: var(--color-ink-soft); }
.dock__chip[aria-current="true"] { color: var(--color-primary);
              background: var(--color-primary-soft); font-weight: 600; }
.dock__chip[data-locked] { opacity: .5; }
```

Máximo de chips visibles en móvil: 5; el resto en menú "más" (`overflow-menu`).

---

## 7. GoalTracker — progreso de metas

Muestra las metas del nivel actual (`ListGoals`). Visualiza el avance sin abrumar (`progressive-disclosure`).

`GoalRow`: icono del `GoalType` + etiqueta en español + progreso `progress/target` (tabular) + barra. Cumplida → `circle-check` verde + tachado suave.

```css
.goal__bar { height: 6px; border-radius: var(--radius-pill); background: var(--color-border); }
.goal__fill { height: 100%; border-radius: inherit; background: var(--color-primary);
              transition: width var(--dur-slow) var(--ease-out); }
.goal--done .goal__fill { background: var(--color-success); }
```

```
Nivel 1 — Cocina en casa                     2 / 3 metas
  🛍  Comprar ingredientes        ✔  1 / 1
  📦  Almacenes abastecidos       ▓▓▓░  2 / 3
  🍳  Cocinar una receta          ░░░░  0 / 1
```

---

## 8. Toast

Aviso breve no bloqueante. `--z-toast`, `aria-live="polite"`, no roba foco. Auto-cierre 3–5 s; acciones (p. ej. "Deshacer") extienden el tiempo.

Variantes por color semántico + icono: `success` (`circle-check`), `error` (`circle-alert`), `info` (`info`). Entra desde abajo (móvil) / esquina (desktop), `--dur-base var(--ease-out)`.

---

## 9. Chef coach — globo + cursor guía

Tutorial dentro del mundo. `--z-tutorial`.

- **Speech bubble:** globo cálido con cola hacia el chef; `text-body`; un solo paso a la vez. Botones "Entendido" / "Saltar".
- **GuideCursor:** mano/cursor que viaja desde el chef hasta el objetivo y repite el gesto de tap.
- **Highlight ring:** anillo `--color-primary` (2px, animación de pulso 1.2 s) alrededor del elemento objetivo; el resto se atenúa con scrim ligero.

Respeta reduced-motion: sin viaje del cursor ni pulso; el anillo aparece estático.

---

## 10. LevelUp — celebración

Modal central al completar un nivel (`LevelAdvanced`). Confeti (respeta reduced-motion → sin confeti), `party-popper`, `text-display` con el nombre del nivel desbloqueado y un CTA `lg` "Continuar".

```
        ┌───────────────────────────────┐
        │            🎉                  │
        │     ¡Nivel completado!         │
        │   Desbloqueaste: Redes         │
        │                                │
        │        [ Continuar  → ]        │
        └───────────────────────────────┘
```

---

## 11. EmptyState

Cuando no hay datos (sin recetas, sin pedidos). Ilustración/!icono grande atenuado + mensaje + **CTA** que resuelve (`empty-states`). Nunca una pantalla en blanco.

```
        🧁  Aún no tienes recetas
        Crea tu primera para empezar a cocinar.
              [ + Nueva receta ]
```

---

## 12. List / Table

Listas (presupuestos, pedidos, movimientos). En móvil → **cards apiladas**; en desktop → tabla con cabecera fija.

- Filas con `--shadow-sm`, separación `--space-2`, estado por `StatusBadge`.
- Números en columnas con `tabular-nums`, alineados a la derecha.
- Tabla: orden con `aria-sort`; listas de 50+ ítems virtualizadas.
- Acción por fila a la derecha (icono + `aria-label`).

---

## 13. Estados compartidos

| Estado | Tratamiento |
|---|---|
| `loading` (>300 ms) | **skeleton/shimmer** con la forma del contenido (no spinner suelto) |
| `disabled` | `opacity: .45` + cursor + atributo semántico |
| `read-only` | fondo `--color-surface-2`, sin borde de foco de edición (distinto de disabled) |
| `error` | borde `--color-danger` + icono + texto bajo el campo |
| `success` | flash breve + `circle-check` |

---

## 14. Checklist de componente (pre-entrega)

- [ ] Usa tokens (sin hex crudo) y un único set de iconos.
- [ ] Touch ≥ 44px, foco visible, `aria-label` en icon-only.
- [ ] Press sin salto de layout (`transform: scale`), 150–300 ms.
- [ ] Estados default/hover/press/focus/disabled definidos y distintos en claro y oscuro.
- [ ] Color nunca es el único indicador.
