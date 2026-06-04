# Diseño del mundo — "Tu Pastelería": qué existe, cómo te mueves y cómo crece

Este documento define **el mundo del videojuego**: qué lugares existen, cómo se mueve el personaje, qué aparece en cada fase y cómo el mundo crece con el negocio. **No define el lenguaje visual** (colores, tipografías, estilo): eso se diseñará después. La **lógica de negocio** (datos, reglas, metas, casos de uso) vive en `plan_de_negocio.md`; aquí solo está su representación en el mundo.

> **Convención de implementación.** Al desarrollar, **el código se escribe en inglés** (escenas, estaciones, edificios, estados, métodos de cámara, eventos) y **los comentarios y textos de interfaz, en español**. Por eso, en este documento **todo identificador que existirá en el código va en inglés** y su **descripción va en español**; la narrativa queda en español.

> Fuentes hermanas: `plan_de_negocio.md` (qué hace el juego) y la **suite de diseño visual** — `diseno_visual.md` (tokens), `diseno_componentes.md` (componentes), `diseno_pantallas_flujos.md` (pantallas/formularios) y `diseno_iconografia.md` (iconos).

---

## 1. Idea del mundo

La aplicación **es** la pastelería hecha lugar, y ese lugar **crece con el negocio**. El mundo no empieza siendo un pueblo: empieza siendo la **cocina de una casa**. Es una sola escena 3D dentro de la cual se trabaja.

No hay un "modo mapa" y un "modo sistema" separados, ni maquetas de menús de hoja de cálculo. Hay **un mundo**. Conforme el negocio progresa (según las metas de `plan_de_negocio.md`), el mundo se abre: primero la cocina, luego la ciudad y el pueblo de edificios.

El mundo tiene dos escenas macro (`WorldScene`):

```
enum WorldScene {
  KITCHEN   // interior de la cocina de casa (Fases 1–3)
  TOWN      // pueblo de edificios (Fase 4+)
}
```

El estado del negocio se **ve** sin abrir nada: en la cocina, cada almacén muestra su `StockStatus` (`EMPTY` / `LOW` / `OK`, definido en `plan_de_negocio.md`); en el pueblo, las alertas aparecen sobre el edificio que les corresponde.

---

## 2. El lugar cambia según la fase

| Fase | `WorldScene` | Qué existe en escena |
|---|---|---|
| **1 — Cocina en casa** | `KITCHEN` | Mesada, horno, tablero de recetas y los almacenes de ingredientes. |
| **2 — Redes sociales** | `KITCHEN` | Lo mismo, más un punto para publicar lo que cocinas. |
| **3 — Primer cliente** | `KITCHEN` | Lo mismo, más la llegada de un cliente/pedido. |
| **4 — Primeras ventas** | `KITCHEN` → `TOWN` | Transición de salida; aparece la pastelería en la ciudad. |
| **5+ — Avanzado** | `TOWN` | La ciudad con los edificios donde se opera. |

---

## 3. Cómo se mueve el personaje y la cámara

El jugador **no camina libremente** por un mapa con flechas: el movimiento es **dirigido por puntos de interés y por la cámara**. Tocar un punto (una estación de la cocina, un edificio del pueblo) lleva al personaje y a la cámara hasta él.

### 3.1 En la cocina (`KITCHEN`, Fases 1–3)

- El **chef** es el personaje y la guía: indica la siguiente acción y acompaña al jugador.
- Las estaciones son los puntos de interés (`KitchenStation`):

```
enum KitchenStation {
  RECIPE_BOARD  // tablero de recetas: elegir qué preparar
  PANTRY        // despensa: los almacenes de ingredientes
  OVEN          // horno: cocinar
  PUBLISH_SPOT  // punto para publicar en redes (desde Fase 2)
}
```

- Al elegir una estación (`focusStation(station)`), la cámara se acerca a ella y el chef se posiciona ahí.
- Las acciones (elegir receta, revisar ingredientes, comprar/registrar, cocinar) se abren encima de la escena; al cerrarlas, `resetView()` devuelve la cámara a la vista general de la cocina.

### 3.2 En el pueblo (`TOWN`, Fase 4+)

- La cámara se mueve sobre el pueblo y permite mirar los edificios. Al señalar un edificio, este responde e invita a entrar.
- Al elegir un edificio operativo (`focusBuilding(id)`), la cámara se acerca a su puerta y se abre el menú del edificio. Al salir, `resetView()` vuelve a la vista general.

### 3.3 Métodos de cámara (comportamiento, no estilo)

```
flyIn()                 // secuencia de arranque: ciudad → casa → cocina
flyOut()                // transición de salida: casa → ciudad → aparece la pastelería (Fase 4)
focusStation(station)   // acercar a una estación de la cocina
focusBuilding(id)       // acercar a un edificio del pueblo
resetView()             // volver a la vista general
```

- Los acercamientos son guiados (no saltos bruscos), salvo cuando el sistema pide menos movimiento.
- Respeta `prefers-reduced-motion`: si está activo, los cambios de vista son **directos**, sin recorrido.
- Funciona **sin 3D**: existe una **ruta accesible** (lista de estaciones/edificios y sus acciones) que opera el juego completo aunque no haya WebGL.

---

## 4. La casa y la cocina (`KITCHEN`, Fases 1–3)

- **La cocina** es una sala pequeña: mesada, `OVEN` (acción de cocinar), `RECIPE_BOARD` (elegir **y crear** recetas) y la `PANTRY` con los **almacenes de ingredientes**.
- Cada **almacén** representa un `Supply` y muestra su `StockStatus`: `EMPTY`, `LOW` u `OK` (la lógica del estado está en `plan_de_negocio.md`). El jugador entiende de un vistazo qué le falta.
- **Lo que se hace en la cocina antes del pueblo** (Fases 1–3), sin necesidad de edificios:
  - Fase 1: elegir/crear recetas (`RECIPE_BOARD`), revisar y abastecer almacenes (`PANTRY`), cocinar (`OVEN`).
  - Fase 2 (`SOCIAL`): publicar producciones en `PUBLISH_SPOT`.
  - Fase 3 (`CUSTOMERS`, `ORDERS`): un cliente llega a la cocina y se atiende su pedido en un panel (alta de cliente, pedido, entrega y cobro), todo dentro de `KITCHEN`.
- Al abrir la tienda física (Fase 4), estas acciones encuentran su **edificio** en el pueblo (recetas/pedidos en `WORKSHOP`, clientes en `OFFICE`, ventas en `STORE`), y la cocina **mejora y se agranda** para soportar más pedidos.

---

## 5. La secuencia de arranque (`flyIn`, Fase 1)

1. **Vista de la ciudad desde arriba.**
2. **Acercamiento progresivo a la casa** del jugador.
3. **Entrada a la cocina**, hasta la vista general de la cocina.
4. **Inicia el tutorial**: el chef toma la guía.

Con `prefers-reduced-motion` o sin WebGL, `flyIn` se omite y se llega directo a la vista de la cocina.

---

## 6. La transición a la tienda física (Fase 4)

Cuando se cumplen las metas del nivel 4 (`SALES_COMPLETED` ≥ 5; ver `plan_de_negocio.md`), la progresión emite `FeatureUnlocked { PHYSICAL_STORE }` y el mundo reacciona con la secuencia `flyOut()`:

1. El jugador **sale de su casa**.
2. Se muestra **la ciudad** otra vez.
3. Aparece su **pequeña pastelería**.
4. El mundo cambia de `WorldScene.KITCHEN` a `WorldScene.TOWN`.

Es el momento bisagra entre el mundo de la casa y el mundo del pueblo.

---

## 7. El pueblo de edificios (`TOWN`, Fase 4+)

El pueblo es una **ciudad en cuadrícula**: cada edificio ocupa su cuadra, separadas por calles, con tráfico y gente. La **pastelería (`STORE`) va al frente-centro**; el resto, en la fila de atrás. Junto a la pastelería hay un parque a un lado y un estacionamiento al otro.

Cinco edificios (`BuildingId`) alojan las funciones del modo avanzado:

```
enum BuildingId { OFFICE  WAREHOUSE  STORE  WORKSHOP  MARKET }
```

**Los cinco edificios se vuelven operativos al abrir el pueblo** (`PHYSICAL_STORE`): el bucle básico que el jugador ya conocía (vender, producir, comprar, clientes) tiene desde el primer momento dónde ocurrir. Lo que llega después son las **acciones avanzadas dentro** de cada edificio, gateadas por su propia `Feature`.

| `BuildingId` | Nombre en juego | Acciones básicas (con `PHYSICAL_STORE`) | Acciones avanzadas (gateadas por `Feature`) | Alertas que muestra |
|---|---|---|---|---|
| `OFFICE` | La Oficina | clientes · nombre del negocio | reglas de empaque (`PACKAGING_RULES`) · configuración avanzada | — |
| `WAREHOUSE` | La Bodega | insumos · corrección de stock | ajustar inventario / mermas (`SPOILAGE`) | stock `EMPTY` o `LOW` |
| `STORE` | La Tienda (el corazón) | ventas simples | presupuestos con costo y margen (`QUOTING`) · IGV (`TAX`) | presupuestos por vencer / vencidos |
| `WORKSHOP` | El Obrador | recetas · producción | pedidos con presupuesto y requerimientos (`ADVANCED_ORDERS`) | pedidos por entregar |
| `MARKET` | El Mercado | comprar materiales | proveedores y compra formal (`SUPPLIERS`) | — |

Cada edificio tiene un `BuildingStatus`:

```
enum BuildingStatus {
  UNDER_CONSTRUCTION  // "en obra": PHYSICAL_STORE aún no se desbloquea (sigues en KITCHEN)
  OPERATIONAL         // operativo: se puede entrar (desde Fase 4)
}
```

- Antes de Fase 4 los cinco están `UNDER_CONSTRUCTION` (el mundo aún es `KITCHEN`). Al abrir la tienda física pasan todos a `OPERATIONAL`.
- Dentro de un edificio operativo, las **acciones avanzadas aparecen una a una** conforme se desbloquea su `Feature` (Fase 5+); hasta entonces solo se ven sus acciones básicas. Un panel avanzado bloqueado indica **qué meta falta** para abrirlo (la meta la define `plan_de_negocio.md`).
- La cocina de la casa es el origen del `WORKSHOP`: al abrir la tienda física, la producción se muda al pueblo.

---

## 8. Qué se muestra en pantalla (estructura, no estilo)

- **Mundo 3D de fondo**: ocupa el viewport.
- **Barra superior** (Fase 4+): identidad del negocio e **indicadores del estado del negocio** (traducción del resumen del `dashboard`).
- **Barra inferior (dock)**: acceso rápido a estaciones/edificios; es además la **ruta accesible**, siempre presente y operable sin 3D.
- **Paneles**: el menú de un edificio o estación y las pantallas reales se abren encima del mundo.

---

## 9. Cómo se ve el progreso y las metas

Las metas se **definen** en `plan_de_negocio.md` (contexto `progression`); el mundo solo las **muestra**, reaccionando a sus eventos (`ProgressRecorded`, `LevelAdvanced`, `FeatureUnlocked`):

- **En la cocina:** el chef anuncia el siguiente paso; un almacén `OK` y una producción terminada son señales de avance.
- **En la barra superior:** un indicador de progreso del nivel actual (cuántas metas cumplidas de las que faltan; alimentado por `ListGoals`).
- **Al completar un nivel** (`LevelAdvanced`): una pequeña celebración y la transición que abre lo nuevo.
- **En el pueblo:** los cinco edificios pasan a `OPERATIONAL` al abrir la tienda física. Dentro de cada uno, los **paneles de acciones avanzadas** bloqueados indican qué meta los abre; al desbloquear su `Feature` (`FeatureUnlocked`), quedan disponibles.

---

## 10. Saltar de nivel (atajo para usuarios que ya conocen el juego)

El avance normal es cumplir las metas, pero el jugador puede **forzar el avance** hasta el nivel donde realmente está su negocio (caso de uso `ForceLevelUp`, definido en `plan_de_negocio.md`). En el mundo, esto se ve así:

- Hay un acceso para **elegir el nivel destino** y saltar directo, sin recorrer el tutorial paso a paso.
- Al confirmar, el mundo **se reconfigura de inmediato**: la `WorldScene` y los edificios se ajustan al nivel alcanzado, con los que correspondan ya en `OPERATIONAL` y las estaciones disponibles.
- El camino natural y el atajo conviven: quien quiera aprender sigue las metas; quien ya sabe, salta.

---

## 11. Accesibilidad (comportamiento)

- Respeta `prefers-reduced-motion`: sin recorridos de cámara, cambios de vista directos.
- Degrada **sin WebGL**: la ruta accesible (lista de estaciones/edificios y acciones) permite jugar completo.

---

## 12. Qué cambió respecto al diseño anterior

- El inicio ya no es el pueblo ni un tutorial de hoja de cálculo: el juego empieza en la cocina de casa (`WorldScene.KITCHEN`), con la secuencia `flyIn` ciudad → casa → cocina.
- El **pueblo de 5 edificios es el mundo de la Fase 4+** (`WorldScene.TOWN`), no el punto de partida.
- El **movimiento es dirigido por puntos de interés y cámara**, no por caminar libre.
- Se añade el **atajo de nivel** (`ForceLevelUp`) para usuarios que ya conocen el juego.
- El **lenguaje visual se diseñará aparte**: este documento describe estructura y comportamiento, no estilo.
