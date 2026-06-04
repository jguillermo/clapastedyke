# Diseño visual — Iconografía · "Tu Pastelería"

Sistema de iconos. **Set único: [Lucide](https://lucide.dev)** (SVG, stroke). **Sin emoji como iconos estructurales** (los emoji de los wireframes son solo bocetos). Usa tokens de `diseno_visual.md`.

Convención: identificadores en inglés (nombre del icono Lucide), descripción en español.

---

## 1. Reglas del sistema de iconos

- **Un solo set:** Lucide en toda la app (coherencia de trazo y radios).
- **Grosor de trazo:** `2px` por defecto; `1.75px` para tamaño `sm` (≤ 16px). Nunca mezclar grosores en la misma capa.
- **Tamaños (tokens):** `--icon-sm: 16px` · `--icon-md: 20px` · `--icon-lg: 24px` · `--icon-xl: 32px`. Default UI = 20–24px.
- **Outline vs filled:** Lucide es outline; mantener outline en toda la jerarquía. Para "activo/seleccionado" no se cambia a filled: se usa color + fondo (`--color-primary-soft`).
- **Color:** hereda `currentColor`; el contenedor define el color semántico. Contraste de glifo ≥ 3:1.
- **Área táctil:** un icono clickable vive en un control ≥ 44×44px (padding/`hitSlop` si el glifo es menor).
- **Alineación:** a la línea base del texto, con `gap: var(--space-1/2)`.
- **Accesibilidad:** decorativo → `aria-hidden="true"`; icon-only accionable → `aria-label` en español.

```css
.icon { width: var(--icon-lg); height: var(--icon-lg); stroke-width: 2;
        stroke: currentColor; fill: none; flex: none; }
.icon--sm { width: var(--icon-sm); height: var(--icon-sm); stroke-width: 1.75; }
```

---

## 2. Estados de stock (`StockStatus`)

| `StockStatus` | Icono Lucide | Color token | Etiqueta |
|---|---|---|---|
| `EMPTY` | `circle-alert` | `--color-danger` | Agotado |
| `LOW` | `triangle-alert` | `--color-warning` | Poco |
| `OK` | `circle-check` | `--color-success` | Suficiente |

Siempre **icono + color + etiqueta** (regla `color-not-only`).

---

## 3. Estaciones de cocina (`KitchenStation`)

| `KitchenStation` | Icono Lucide | Descripción |
|---|---|---|
| `RECIPE_BOARD` | `notebook-pen` | tablero de recetas (elegir/crear) |
| `PANTRY` | `package` | despensa / almacenes |
| `OVEN` | `cooking-pot` | horno / cocinar |
| `PUBLISH_SPOT` | `camera` | publicar en redes (Fase 2) |

---

## 4. Edificios (`BuildingId`)

| `BuildingId` | Icono Lucide | Nombre en juego |
|---|---|---|
| `OFFICE` | `building-2` | La Oficina |
| `WAREHOUSE` | `warehouse` | La Bodega |
| `STORE` | `store` | La Tienda |
| `WORKSHOP` | `chef-hat` | El Obrador |
| `MARKET` | `shopping-cart` | El Mercado |

Edificio bloqueado (`UNDER_CONSTRUCTION`) o panel avanzado bloqueado: superponer `lock` pequeño.

---

## 5. Acciones y conceptos del negocio

| Concepto | Icono Lucide |
|---|---|
| Elegir receta | `notebook-pen` |
| Receta / catálogo de recetas | `book-open` |
| Ingrediente / insumo | `wheat` |
| Comprar / registrar compra | `shopping-bag` |
| Cocinar / producción | `cooking-pot` |
| Vender / venta | `receipt` |
| Cobro / ingresos | `coins` |
| Cliente | `user` / lista `users` |
| Proveedor | `truck` |
| Pedido | `clipboard-list` |
| Presupuesto / cotización | `file-text` |
| Inventario / ajuste | `boxes` |
| Merma / desperdicio | `trash-2` |
| Reglas de empaque | `gift` |
| Configuración | `settings-2` |
| IGV / impuestos | `percent` |
| Delivery | `bike` |
| Empleados | `users-round` |
| Equipamiento | `wrench` |
| Marketing | `megaphone` |
| Finanzas | `chart-line` |
| Sucursales | `map-pin` |

---

## 6. Metas (`GoalType`) — icono por tipo

| `GoalType` | Icono Lucide |
|---|---|
| `PURCHASES_REGISTERED` | `shopping-bag` |
| `WAREHOUSES_STOCKED` | `package-check` |
| `PRODUCTIONS_COOKED` | `cooking-pot` |
| `POSTS_PUBLISHED` | `camera` |
| `POPULARITY` | `heart` |
| `INFORMAL_ORDERS` | `message-circle` |
| `CUSTOMERS_REGISTERED` | `user-plus` |
| `ORDERS_CREATED` | `clipboard-list` |
| `SALES_COMPLETED` | `receipt` |
| `SUPPLIES_IN_STOCK` | `boxes` |
| `SIZES_SOLD` | `ruler` |
| `ORDERS_PER_WEEK` | `calendar-days` |
| `CONCURRENT_ORDERS` | `layers` |
| `ACCUMULATED_REVENUE` | `coins` |
| `MONTHS_OPERATING` | `calendar-clock` |

---

## 7. Navegación y sistema

| Acción | Icono Lucide |
|---|---|
| Cerrar overlay | `x` |
| Volver | `arrow-left` |
| Ayuda | `circle-help` |
| Menú | `menu` |
| Ajustes | `settings-2` |
| Saltar de nivel (`ForceLevelUp`) | `fast-forward` |
| Celebración / level-up | `party-popper` |
| Éxito | `circle-check` |
| Error | `circle-alert` |
| Información | `info` |
| Bloqueado | `lock` |
| Más opciones (overflow) | `ellipsis` |
| Mostrar/ocultar avanzado | `chevron-down` / `chevron-up` |
| WhatsApp proveedor (acción) | `message-circle` |
| Mostrar/ocultar contraseña | `eye` / `eye-off` |

---

## 8. KPIs del HUD (`StatChip`)

| KPI | Icono Lucide | Color del chip |
|---|---|---|
| Presupuestos pendientes | `file-text` | neutro |
| Por vencer | `clock` | `--color-warning` |
| Pedidos por entregar | `package` | `--color-info` |
| Stock en rojo | `circle-alert` | `--color-danger` |
| Ventas / ingresos | `coins` | `--color-success` |

---

## 9. Anti-patrones (evitar)

- ❌ Emoji como iconos de UI (navegación, estados, acciones).
- ❌ Mezclar Lucide con otro set, o filled con outline en la misma capa.
- ❌ Grosores de trazo distintos en iconos contiguos.
- ❌ Icono accionable sin `aria-label` o con área < 44px.
- ❌ Comunicar un estado solo con el color del icono (siempre + etiqueta).
- ❌ PNG rasterizado que pixela al escalar (solo SVG vectorial).
