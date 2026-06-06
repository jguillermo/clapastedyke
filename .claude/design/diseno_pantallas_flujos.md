# Diseño visual — Pantallas, flujos y formularios · "Tu Pastelería"

Cómo se ven y encadenan las pantallas, y cómo son los formularios. Usa tokens (`diseno_visual.md`), componentes (`diseno_componentes.md`) e iconos (`diseno_iconografia.md`). La lógica de cada flujo está en `plan_de_negocio.md`; el mundo/cámara en `diseno_mundo_juego.md`.

Convención: identificadores en inglés, descripción en español.

---

## 1. Principios de pantalla

- **Una acción principal por pantalla.** Lo demás, subordinado o diferido.
- **Divulgación progresiva.** Solo se muestran los campos del nivel actual (oculto/opcional/obligatorio, ver `plan_de_negocio.md` §5). Lo avanzado aparece cuando su `Feature` se desbloquea.
- **El mundo siempre detrás.** Las pantallas son overlays de vidrio; cerrar devuelve al mundo (`resetView`).
- **Salida siempre clara.** `x`, `Esc`, click en scrim; back coherente.

---

## 2. Arranque — `flyIn` (Fase 1)

Secuencia cinemática (cámara, no UI). Mientras corre, no hay overlays.

```
[ ciudad desde arriba ]  →  [ dolly a la casa ]  →  [ entra a la cocina ]  →  [ chef saluda + 1er paso ]
        ~2.5 s                    ~2 s                    corte suave              GoalTracker entra
```

Con `prefers-reduced-motion`/sin-WebGL: se omite `flyIn` y se entra directo a la vista de cocina con una transición de fade.

---

## 3. Cocina — vista general (`WorldScene.KITCHEN`)

Mundo 3D a pantalla completa + chef + estaciones tappables. HUD mínimo en Fases 1–3 (sin KPIs todavía); GoalTracker accesible desde un chip.

```
┌───────────────────────────────────────────────────────────────┐
│  Nivel 1 · Cocina en casa                         (?)  ☰       │  ← barra ligera
│                                                                 │
│        [ RECIPE_BOARD ]            [ OVEN ]                      │
│             📋                       🍳                          │  ← estaciones (focusStation)
│                                                                 │
│                 🧑‍🍳  (chef: "Elige qué preparar")               │
│                                                                 │
│     [ PANTRY ]   🥚 ●   🌾 ●   🍬 ●                              │  ← almacenes con estado
│                                                                 │
├───────────────────────────────────────────────────────────────┤
│  [ 📋 Recetas ]  [ 📦 Despensa ]  [ 🍳 Cocinar ]      (dock)    │  ← ruta accesible
└───────────────────────────────────────────────────────────────┘
   ● = StatusBadge de cada almacén (Agotado / Poco / Suficiente)
```

Tocar una estación → `focusStation` (dolly) + sube el overlay correspondiente.

---

## 4. Flujo Fase 1 — cocinar (el flujo fundacional)

```
ChooseRecipe → CheckIngredients → (falta?) RegisterPurchase → CookRecipe → ✔ meta
   RECIPE_BOARD     overlay revisión        overlay compra        OVEN
```

### 4.1 Elegir receta (`ChooseRecipe`)
Overlay con lista de `Card` de receta (nombre + mini-lista de ingredientes). CTA por card "Preparar". Botón "+ Nueva receta" abre el formulario de receta (§8.1). Si no hay recetas → `EmptyState`.

### 4.2 Revisar ingredientes (`CheckIngredients`)
Tabla *necesito vs tengo* con `StatusBadge` por ingrediente. Si todo `OK` → CTA "Cocinar"; si falta → CTA "Comprar lo que falta".

```
        ┌─────────────────────────────────────────┐
        │ Para "Galletas"                       ✕  │
        ├─────────────────────────────────────────┤
        │ Ingrediente   Necesito  Tengo   Estado   │
        │ 🥚 Huevos        3        5      ● OK      │
        │ 🌾 Harina      200 g    150 g   ● Poco    │
        │ 🍬 Azúcar      100 g      0     ● Agotado │
        ├─────────────────────────────────────────┤
        │            [ Comprar lo que falta  → ]   │  ← acción primaria
        └─────────────────────────────────────────┘
```

### 4.3 Comprar y registrar (`RegisterPurchase`, básico)
Por cada faltante: nombre + campo "Cantidad que traje". Al guardar, el almacén pasa a `OK` y vuelve la revisión. Sin proveedor ni precio en básico.

### 4.4 Cocinar (`CookRecipe`)
Confirmación → consume stock → el chef celebra (`scale-feedback`) → `Toast` de éxito → `RecordProgress(PRODUCTIONS_COOKED)`. Si cierra una meta del nivel, dispara `LevelUp`.

---

## 5. Fase 2–3 dentro de la cocina

- **Fase 2 (`PUBLISH_SPOT`):** overlay "Publicar" — elegir una producción terminada, texto opcional, botón "Publicar". Muestra popularidad ganada (animación de `+pts`).
- **Fase 3 (panel cliente/pedido):** un cliente "llega" a la cocina; overlay con el mini-flujo Cliente → Pedido → Producción → Entrega → Cobro, un paso por pantalla con barra de progreso (`multi-step-progress`).

---

## 6. Transición a la tienda física (Fase 4)

Al cumplir `SALES_COMPLETED ≥ 5`: `LevelUp` ("Desbloqueaste tu pastelería") → `flyOut` (sale de casa → ciudad → aparece la pastelería) → `WorldScene.TOWN`. Tras la transición, el HUD con KPIs aparece con un fade.

---

## 7. Pueblo (`WorldScene.TOWN`, Fase 4+)

```
┌───────────────────────────────────────────────────────────────┐
│ 🧁 Dulces Misa     [📋 3][⏳ 1][📦 2 rojo][💰 12]          ⚙ (?)│  ← HUD
│                                                                 │
│     🏢OFFICE     🏭WAREHOUSE        🍴WORKSHOP    🛒MARKET🔒     │
│                      🧁 STORE (centro, el corazón)              │
│                  · plaza · árboles · autos ·                    │
│                                                                 │
├───────────────────────────────────────────────────────────────┤
│ [Oficina][Bodega][ Tienda ][Obrador][Mercado🔒]      (dock)     │
└───────────────────────────────────────────────────────────────┘
   🔒 = panel avanzado bloqueado (indica la meta que falta)
```

### 7.1 Entrar a un edificio (`focusBuilding`) → room-menu
Overlay con el nombre del edificio + sus acciones. Acciones **básicas** disponibles; las **avanzadas** muestran candado + meta que las abre (`Feature`).

```
        ┌───────────────────────────────────┐
        │ La Tienda                       ✕  │
        │ El corazón: vende y cotiza         │
        │                                    │
        │  [ Vender                    → ]   │  ← básica
        │  [ Presupuestos        🔒 QUOTING ]│  ← avanzada (bloqueada)
        └───────────────────────────────────┘
```

### 7.2 Acción → pantalla real
La acción monta la pantalla operativa real (formulario/lista) en el overlay. `← Volver` regresa al room-menu (cámara sigue enfocada); `✕` sale del edificio (`resetView` + recarga KPIs).

---

## 8. Formularios

### 8.1 Anatomía de campo

```
Label *                         ← text-label, visible siempre (no placeholder-only)
┌─────────────────────────────┐
│ valor                        │ ← input, min-height 44px
└─────────────────────────────┘
Texto de ayuda persistente.     ← text-caption, color ink-faint
```

```css
.field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-5); }
.field__label { font: 500 14px/1.4 var(--font-ui); color: var(--color-ink); }
.field__label .req { color: var(--color-danger); }   /* asterisco de obligatorio */
.input { min-height: 44px; padding: 0 var(--space-3); border-radius: var(--radius-md);
         border: 1.5px solid var(--color-border-strong); background: var(--color-surface);
         font: 400 16px/1.5 var(--font-ui); color: var(--color-ink); }
.input::placeholder { color: var(--color-ink-faint); }
.input:focus-visible { outline: 2px solid var(--color-info); outline-offset: 2px;
                       border-color: var(--color-info); }
.input[aria-invalid="true"] { border-color: var(--color-danger); }
.field__error { display: flex; align-items: center; gap: var(--space-1);
                color: var(--color-danger); font: 500 12px/1.4 var(--font-ui); }
.field__hint  { color: var(--color-ink-faint); font: 500 12px/1.4 var(--font-ui); }
```

### 8.2 Reglas de formulario (plugin §8)

- **Label visible** por campo; asterisco en obligatorios (`required-indicators`).
- **Validación on blur**, no por tecla (`inline-validation`); el error aparece **bajo el campo**, con icono `circle-alert` + texto que dice **causa + cómo arreglar** (`error-clarity`).
- Tras enviar con error: foco al **primer campo inválido**; si hay varios, resumen arriba con anclas.
- `input` con `type`/`inputmode` semántico (number, tel) para el teclado correcto en móvil.
- `aria-live`/`role="alert"` para que el lector anuncie errores.
- **Autosave** de borrador en formularios largos; confirmar al descartar con cambios.
- Botón enviar: `aria-busy` con spinner; luego éxito (`Toast`/flash) o error.

### 8.3 Divulgación progresiva (clave del juego)

Los campos siguen el estado por fase de `plan_de_negocio.md` §5:

- **Oculto:** no se renderiza; el sistema usa el valor por defecto.
- **Opcional:** visible, sin asterisco; puede ir bajo "Mostrar más" (`progressive-disclosure`).
- **Obligatorio:** visible con asterisco; bloquea el envío si falta.

Patrón visual para campos que se vuelven avanzados:

```
[ Campos básicos … ]
────────────────────────────────────────
▸ Opciones avanzadas            (colapsado por defecto)
   (al expandir: presentationSize, presentationPrice, minStock…)
```

Cuando una `Feature` se desbloquea, los campos que pasan a obligatorios se **revelan con un realce breve** (flash de `--color-primary-soft`) y un tooltip "Nuevo: ahora puedes…".

### 8.4 Ejemplo — `Supply` (insumo) según fase

```
FASE 1 (mínimo)                         FASE 5+ (avanzado)
┌──────────────────────────┐           ┌──────────────────────────┐
│ Nombre *      [ Harina  ] │           │ Nombre *      [ Harina  ] │
│ Stock *       [ 200    g] │           │ Tipo *        [Ingred. ▾] │
└──────────────────────────┘           │ Unidad *      [gramos  ▾] │
   (umbral automático,                  │ Stock *       [ 200    g] │
    sin más campos)                     │ Stock mínimo* [ 100    g] │
                                        │ ▸ Presentación y precio    │
                                        │   Tamaño*     [ 1000   g] │
                                        │   Precio*     [ 5.00  S/] │
                                        │ Proveedor     [ —      ▾] │
                                        └──────────────────────────┘
```

---

## 9. Atajo de nivel (`ForceLevelUp`)

Acceso desde el menú (`☰`/ajustes): "Saltar a mi nivel". Overlay con la lista de niveles; el jugador elige destino y confirma (acción potencialmente destructiva de progreso → `confirmation-dialogs`). Al confirmar, el mundo se reconfigura (escena + edificios operativos) y se muestra un `Toast` "Te adelantamos al Nivel X".

```
        ┌───────────────────────────────────┐
        │ Saltar a tu nivel                ✕ │
        │ Si ya conoces el juego, ve directo.│
        │  ○ Nivel 1 — Cocina en casa        │
        │  ○ Nivel 3 — Primer cliente        │
        │  ● Nivel 5 — Avanzado              │
        │           [ Saltar aquí  → ]       │
        └───────────────────────────────────┘
```

---

## 10. Estados de pantalla

- **Loading** (>300 ms): skeleton con la forma real (cards/tabla), nunca spinner suelto a pantalla completa.
- **Empty:** `EmptyState` con CTA que resuelve.
- **Error de carga:** mensaje + "Reintentar".
- **Offline / sin almacén:** banner informativo; el juego sigue en memoria (el progreso no se persiste hasta recuperar almacén).

---

## 11. Responsive

- **≤ md (móvil):** overlays como bottom-sheet ancho completo; dock fijo abajo; una columna; tablas → cards.
- **≥ lg (desktop):** overlays centrados `max-width` 560–640px; HUD horizontal; tablas con cabecera fija.
- Sin scroll horizontal; safe-areas siempre respetadas; `min-height: 100dvh`.

---

## 12. Recorrido feliz (resumen visual)

```
flyIn → Cocina → ChooseRecipe → CheckIngredients → RegisterPurchase → CookRecipe → LevelUp
  → (Fase 2) Publicar → (Fase 3) Cliente/Pedido/Entrega/Cobro → (Fase 4) 5 ventas
  → flyOut → Pueblo → entrar a edificios → acciones básicas → (Fase 5) desbloqueos avanzados
```
