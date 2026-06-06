# Plan de negocio — Lógica de un simulador de pastelería que crece contigo

Este documento define **solo la lógica de negocio**: qué se modela, qué datos se piden en cada etapa, qué reglas se aplican y cómo se avanza de nivel. Lo visual —cómo se mueve el personaje, las casas, los edificios, qué se ve y cómo se ve— vive en `diseno_mundo_juego.md` y en la **suite de diseño visual**: `diseno_visual.md` (tokens), `diseno_componentes.md` (componentes), `diseno_pantallas_flujos.md` (pantallas y formularios) y `diseno_iconografia.md` (iconos).

La idea central: el jugador empieza en su casa con **pocos campos y pocas tablas**, y el sistema **crece con él**. Cada necesidad nueva desbloquea exactamente la función y los datos que hacen falta, ni antes ni de más.

> **Convención de implementación.** Al desarrollar, **el código se escribe en inglés** (bounded contexts, entidades, campos, casos de uso, eventos, enums) y **los comentarios y textos de interfaz, en español**. Por eso, en este documento **todo identificador que existirá en el código va en inglés** y su **descripción va en español**. Los nombres de fase, las explicaciones y la narrativa quedan en español.

---

## 1. Concepto

El negocio crece en dos grandes modos, y se pasa de uno a otro sin darse cuenta:

- **Modo básico (Fases 1–4).** Solo compras ingredientes y vendes productos. La ganancia es **simple y directa**: precio de venta menos lo que gastaste. **No hay** IGV, ni costos operativos, ni mermas, ni vencimientos. El inventario es una simple validación de "¿me alcanza para cocinar?".
- **Modo avanzado (Fase 5+).** Se suman, **una a una**, las funciones reales de una pastelería: IGV, costos, mermas, proveedores, empleados, equipamiento, producción masiva, delivery, marketing, finanzas, impuestos y sucursales.

---

## 2. Principio rector de diseño

**Prioridad: el juego te ayuda a crecer, no te complica el trabajo.** De ahí, cuatro reglas que mandan sobre todo:

1. **Empieza mínimo.** En la primera etapa hay pocos campos y pocas tablas. Lo que el sistema puede asumir, lo asume.
2. **Divulgación progresiva.** Las entidades son las mismas durante todo el juego; lo que cambia es **cuántos de sus campos se piden**. Un campo puede estar **oculto** en la Fase 1 (con un valor por defecto), volverse **opcional** después y ser **obligatorio** solo cuando su ausencia ya tendría consecuencias.
3. **Configuración just-in-time.** No hay una pantalla de "Configuración" que te reciba con cincuenta parámetros. **Cada parámetro aparece junto a la función que lo necesita**, en la fase en que esa función se desbloquea.
4. **El sistema crece contigo.** Cada meta cumplida suma una tabla, un campo o una función. Nunca se pide entender algo que el negocio todavía no vive.

---

## 3. Arquitectura del dominio

El dominio se divide en **bounded contexts**. No todos están activos desde el inicio: cada fase **enciende** los que necesita.

| Bounded context | Para qué sirve | Entidades | Se enciende en |
|---|---|---|---|
| **`progression`** | Define las **metas** de cada nivel y decide cuándo se avanza | `PlayerProgress`, `Level`, `Goal` | Siempre (es el motor de la progresión) |
| **`kitchen`** | Elegir receta, revisar disponibilidad, cocinar | `Production` | Fase 1 |
| **`catalog`** | Recetas e insumos | `Recipe` (+ `RecipeIngredient`), `Supply` | Fase 1 (mínimo) → crece |
| **`inventory`** | Stock y todos sus movimientos | `StockMovement`, `Purchase` | Fase 1 (compra simple) → crece |
| **`reputation`** | Popularidad y visibilidad | `SocialPost`, `Popularity` | Fase 2 |
| **`sales`** | Clientes, pedidos y ventas | `Customer`, `Order`, `Sale` | Fase 3 |
| **`quoting`** | Presupuestos con costo y margen | `Quote` (+ `QuoteDetail`) | Fase 5 |
| **`supply-chain`** | Proveedores y compras formales | `Supplier`, `PackagingRule` | Fase 5 |
| **`settings`** | Parámetros del negocio, **por bloques** | `Settings` | Repartido: cada bloque aparece con su función |
| **`dashboard`** | KPIs y alertas (solo lectura) | — | Fase 4 |
| **`_common`** | Identificadores, dinero, cantidades, errores, event bus | VOs compartidos | Siempre |

**Casos de uso (una intención del usuario, un caso de uso):**

- `progression`: `RecordProgress`, `EvaluateLevelUp`, `UnlockFeature`, `ListGoals`, `ForceLevelUp`, `LoadProgress`, `ResetProgress`.
- `kitchen`: `ChooseRecipe`, `CheckIngredients`, `CookRecipe`.
- `catalog`: `ListRecipes`, `SaveRecipe`, `ListSupplies`, `SaveSupply`.
- `inventory`: `RegisterPurchase`, `UpdateStock`, `AdjustInventory` (F5), `ListStockMovements`.
- `reputation`: `PublishProduction`, `UpdatePopularity`, `ReceiveInformalOrder`.
- `sales`: `SaveCustomer`, `CreateOrder`, `StartOrderProduction`, `DeliverOrder`, `CollectSale`, `CancelOrder`.
- `quoting`: `CalculateQuote`, `SaveQuote`, `ApproveQuote`, `RejectQuote`.
- `supply-chain`: `SaveSupplier`, `SavePackagingRule`.
- `settings`: `ReadSettings`, `SaveSettings`.
- `dashboard`: `GetDashboard`.

Las entidades existen desde que su contexto se enciende, pero **la tabla solo se crea cuando hace falta** y **solo se piden los campos del nivel actual**. La Fase 1 vive con dos tablas (`Recipe`, `Supply`) más el registro de `Production`; en la Fase 5 pueden estar activas todas. Nunca al revés.

---

## 4. Progresión y metas (bounded context `progression`)

El avance de nivel **no** es algo suelto: lo gobierna un contexto dedicado. Aquí se definen las **metas claras** que hay que superar para pasar de un nivel al siguiente. Para subir de nivel siempre queda explícito *qué falta hacer*.

### 4.1 Enums del contexto

`GoalType` — la lista canónica y cerrada de "qué cuenta el juego":

```
enum GoalType {
  PURCHASES_REGISTERED   // compras de ingredientes anotadas
  WAREHOUSES_STOCKED     // almacenes con stock suficiente a la vez
  PRODUCTIONS_COOKED     // recetas preparadas con éxito
  POSTS_PUBLISHED        // producciones publicadas en redes
  POPULARITY             // puntos de popularidad acumulados
  INFORMAL_ORDERS        // pedidos informales atendidos
  CUSTOMERS_REGISTERED   // clientes dados de alta
  ORDERS_CREATED         // pedidos formales creados
  SALES_COMPLETED        // pedidos entregados y cobrados
  SUPPLIES_IN_STOCK      // insumos distintos en inventario
  SIZES_SOLD             // tamaños distintos vendidos de un producto
  ORDERS_PER_WEEK        // pedidos atendidos en una semana
  CONCURRENT_ORDERS      // pedidos en producción al mismo tiempo
  ACCUMULATED_REVENUE    // ingreso total acumulado
  MONTHS_OPERATING       // meses con la tienda en operación
}
```

`GoalMode` — cómo se actualiza el progreso de una meta:

```
enum GoalMode {
  INCREMENT   // acumulativa: suma cada vez que ocurre el hecho
  SNAPSHOT    // instantánea: mide el valor actual y conserva el máximo alcanzado
}
```

`Feature` — qué puede encender la progresión (lo que se desbloquea):

```
enum Feature {
  KITCHEN  SOCIAL  CUSTOMERS  ORDERS  PHYSICAL_STORE
  QUOTING  TAX  SUPPLIERS  OPERATING_COSTS  SPOILAGE
  PACKAGING_RULES  ADVANCED_ORDERS  EQUIPMENT  EMPLOYEES
  DELIVERY  MARKETING  FINANCE  BRANCHES
}
```

### 4.2 Entidades

- **`Goal`** (value object) — una condición medible:
  - `type: GoalType`
  - `target: number` — número a alcanzar
  - `progress: number` — cuánto se lleva
  - `mode: GoalMode`
  - derivado `met: boolean` → `progress >= target`
- **`Level`** (value object) — un nivel/fase del juego:
  - `order: number`
  - `goals: Goal[]` — las metas que cierran el nivel
  - `unlocks: Feature[]` — qué se enciende al completarlo
  - derivado `completed: boolean` → todas sus `goals` cumplidas
- **`PlayerProgress`** (aggregate root) — el estado de la partida y dueño de las reglas:
  - `currentLevel: number`
  - `progressByType: Map<GoalType, number>`
  - `completedLevels: number[]`
  - `unlockedFeatures: Feature[]`
  - **Invariantes:** una meta `INCREMENT` nunca decrece; una `SNAPSHOT` guarda el valor máximo observado; un nivel solo se cierra cuando **todas** sus metas están `met`; las funciones desbloqueadas no se apagan.

### 4.3 Casos de uso

- **`ListGoals()`** — metas del nivel actual con su progreso, para que **siempre sea claro qué falta**.
- **`RecordProgress(type, value)`** — aplica el avance según el `mode` de la meta (suma si es `INCREMENT`, guarda el máximo si es `SNAPSHOT`).
- **`EvaluateLevelUp()`** — si **todas** las metas del nivel están `met`, sube de nivel y dispara los desbloqueos.
- **`UnlockFeature(feature)`** — enciende un contexto/campo/pantalla.
- **`ForceLevelUp(targetLevel)`** — el **atajo** (ver §4.5).
- **`LoadProgress()` / `ResetProgress()`** — cargar al iniciar / reiniciar la partida.

### 4.4 Metas por nivel (el contrato de la progresión)

| Nivel | Mecánica nueva | Metas para pasar al siguiente (`GoalType` × `target`) | Desbloquea (`Feature`) |
|---|---|---|---|
| **1 — Cocina en casa** | Elegir receta · revisar · comprar y registrar · cocinar | `PURCHASES_REGISTERED` ≥ 1 · `WAREHOUSES_STOCKED` ≥ 3 · `PRODUCTIONS_COOKED` ≥ 1 | `SOCIAL` |
| **2 — Redes sociales** | Producir para mostrar · popularidad · pedidos informales | `PRODUCTIONS_COOKED` ≥ 4 · `POSTS_PUBLISHED` ≥ 3 · `POPULARITY` ≥ 100 · `INFORMAL_ORDERS` ≥ 1 | `CUSTOMERS`, `ORDERS` |
| **3 — Primer cliente** | Cliente → pedido → producción → entrega → cobro | `CUSTOMERS_REGISTERED` ≥ 1 · `ORDERS_CREATED` ≥ 1 · `SALES_COMPLETED` ≥ 1 | — (no enciende una Feature nueva; habilita el objetivo de 5 ventas de la Fase 4) |
| **4 — Primeras ventas** | Objetivos de venta · tienda física | `SALES_COMPLETED` ≥ 5 | `PHYSICAL_STORE` |
| **5+ — Avanzado** | Las funciones reales, una a una | Una meta propia por función (ver §8) | `QUOTING`, `TAX`, `SUPPLIERS`, … |

Los `target` son la meta de diseño por defecto y son **parámetros ajustables** del balance del juego.

### 4.5 Dos caminos para avanzar

1. **Natural (recomendado).** Cumplir todas las metas del nivel. `ListGoals` siempre muestra qué falta, así que el camino nunca es ambiguo.
2. **Atajo (`ForceLevelUp`).** El jugador puede **saltarse pasos y forzar el avance** hasta un nivel destino. Al hacerlo, las metas de los niveles intermedios se marcan como satisfechas y se desbloquean sus funciones de golpe. Está pensado para **usuarios que ya conocen el uso** y quieren llegar directo al nivel real de su negocio, sin repetir el tutorial. El camino natural y el atajo conviven: nada obliga a recorrer la progresión paso a paso.

### 4.6 Cómo se persiste el progreso

El contexto guarda **un único registro** (el avance de la partida) mediante `ProgressRepository` (`load()` / `save(progress)`), en el mismo almacén local del juego que el resto de los datos. El registro es pequeño y se reescribe completo en cada cambio (última escritura gana):

```
ProgressRecord {                            // snapshot de PlayerProgress
  version: number                           // versión del contenido de progresión
  currentLevel: number                      // orden del nivel en curso
  progressByType: Record<GoalType, number>  // progreso por cada tipo de meta
  completedLevels: number[]                 // órdenes de niveles ya cerrados
  unlockedFeatures: Feature[]               // qué está encendido hoy
}
```

Reglas de persistencia:
- **Al iniciar**, `LoadProgress` reconstruye el estado. Si `version` no coincide con la versión actual del contenido (cambiaron las metas o su significado), el progreso se **descarta** y se empieza limpio: es estructura del juego, no un dato del negocio que debamos conservar.
- **Cada `RecordProgress`** y **cada avance de nivel** (natural o por atajo) escriben el registro. Si el almacén no está disponible, el juego sigue en memoria, solo sin persistir.
- El registro guarda el **progreso por tipo**, no cada evento. El historial detallado de hechos del negocio (ventas, compras, movimientos) vive en sus propios contextos; `progression` solo lleva los contadores que deciden el avance.

### 4.7 Qué dispara cada `RecordProgress`

`progression` **no se acopla** a los otros contextos: cada acción del negocio **emite un evento de dominio** y `progression` tiene suscriptores que lo traducen en `RecordProgress(type, value)`. El `mode` lo define la meta (§4.1).

| `GoalType` | Acción que lo dispara | `mode` | `value` |
|---|---|---|---|
| `PURCHASES_REGISTERED` | `RegisterPurchase` completada | INCREMENT | +1 |
| `WAREHOUSES_STOCKED` | tras cualquier `StockMovement`: almacenes en estado `OK` | SNAPSHOT | n.º actual |
| `PRODUCTIONS_COOKED` | `CookRecipe` completada | INCREMENT | +1 |
| `POSTS_PUBLISHED` | `PublishProduction` | INCREMENT | +1 |
| `POPULARITY` | `UpdatePopularity` (al publicar o vender) | SNAPSHOT | puntos actuales |
| `INFORMAL_ORDERS` | `ReceiveInformalOrder` atendido | INCREMENT | +1 |
| `CUSTOMERS_REGISTERED` | `SaveCustomer` (alta nueva) | INCREMENT | +1 |
| `ORDERS_CREATED` | `CreateOrder` | INCREMENT | +1 |
| `SALES_COMPLETED` | `CollectSale` (pedido entregado y cobrado) | INCREMENT | +1 |
| `ACCUMULATED_REVENUE` | `CollectSale` | INCREMENT | + monto de la venta |
| `SUPPLIES_IN_STOCK` | `SaveSupply` (alta): insumos distintos con stock | SNAPSHOT | n.º actual |
| `SIZES_SOLD` | venta de un tamaño no vendido antes | SNAPSHOT | n.º de tamaños distintos |
| `ORDERS_PER_WEEK` | ventana semanal de pedidos atendidos | SNAPSHOT | máx. en la ventana |
| `CONCURRENT_ORDERS` | al pasar pedidos a producción: en producción a la vez | SNAPSHOT | máx. concurrente |
| `MONTHS_OPERATING` | paso del tiempo de juego con la tienda activa | INCREMENT | + meses |

Tras cada `RecordProgress`, el contexto llama internamente a `EvaluateLevelUp`: si todas las metas del nivel quedaron cumplidas, avanza y `UnlockFeature` enciende lo nuevo. Así el progreso es **reactivo**: el jugador hace su trabajo normal y el sistema detecta solo cuándo toca crecer.

### 4.8 Eventos de dominio por contexto

Cada contexto **publica eventos** cuando ocurre un hecho del negocio; los demás reaccionan sin acoplarse. Los eventos viajan por el **event bus** de `_common`. Convención: nombre en **pasado**, en inglés, con su carga (payload) mínima.

**`kitchen`**
- `RecipeCooked { recipeId, date }`

**`catalog`**
- `SupplySaved { supplyId, isNew }`
- `RecipeSaved { recipeId, isNew }`

**`inventory`**
- `PurchaseRegistered { purchaseId, lines }`
- `StockMoved { supplyId, type, quantity, resultingStock, status }` — lo emite **todo** cambio de stock (compra, consumo al cocinar, corrección, ajuste); `type` indica el origen.
- `InventoryAdjusted { supplyId, adjustmentType, quantity }` — solo en el flujo formal de mermas (además del `StockMoved`).

**`reputation`**
- `ProductionPublished { postId, recipeId }`
- `PopularityUpdated { points }`
- `InformalOrderReceived { informalOrderId }`

**`sales`**
- `CustomerSaved { customerId, isNew }`
- `OrderCreated { orderId, customerId }`
- `OrderInProduction { orderId }`
- `OrderDelivered { orderId }`
- `SaleCollected { saleId, orderId, amount, size }`
- `OrderCancelled { orderId, reason }`

**`quoting`**
- `QuoteSaved { quoteId }`
- `QuoteApproved { quoteId, orderId }`
- `QuoteRejected { quoteId, reason }`

**`supply-chain`**
- `SupplierSaved { supplierId, isNew }`
- `PackagingRuleSaved { ruleId }`

**Reloj del juego** (no es un contexto de negocio; marca el paso del tiempo)
- `MonthClosed { month }` — con la tienda activa.

**`progression`** (también publica, para que el mundo reaccione)
- `ProgressRecorded { type, value }`
- `LevelAdvanced { previousLevel, newLevel, forced }`
- `FeatureUnlocked { feature }`

### 4.9 Mapa de suscripción de `progression`

`progression` se suscribe a los eventos anteriores y los traduce en `RecordProgress`:

| Evento escuchado | `RecordProgress(type, …)` |
|---|---|
| `PurchaseRegistered` | `PURCHASES_REGISTERED`, +1 |
| `StockMoved` | `WAREHOUSES_STOCKED` = almacenes en estado `OK`; `SUPPLIES_IN_STOCK` = insumos con stock |
| `RecipeCooked` | `PRODUCTIONS_COOKED`, +1 |
| `ProductionPublished` | `POSTS_PUBLISHED`, +1 |
| `PopularityUpdated` | `POPULARITY` = puntos actuales |
| `InformalOrderReceived` | `INFORMAL_ORDERS`, +1 |
| `CustomerSaved` (isNew) | `CUSTOMERS_REGISTERED`, +1 |
| `OrderCreated` | `ORDERS_CREATED`, +1 |
| `OrderInProduction` / `OrderDelivered` | `CONCURRENT_ORDERS` = pedidos en producción a la vez (máximo) |
| `SaleCollected` | `SALES_COMPLETED` +1 · `ACCUMULATED_REVENUE` +amount · `SIZES_SOLD` = tamaños distintos · `ORDERS_PER_WEEK` = atendidos en la ventana |
| `SupplySaved` (isNew) | reevalúa `SUPPLIES_IN_STOCK` |
| `MonthClosed` | `MONTHS_OPERATING`, +1 |

Los eventos que no mueven ninguna meta (p. ej. `QuoteRejected`, `OrderCancelled`, `PackagingRuleSaved`) igual existen para otros usos (auditoría, dashboard, mundo), pero `progression` no se suscribe a ellos.

---

## 5. Divulgación progresiva de campos

Mismo modelo, distinta exigencia según la fase. Los **campos van con su nombre de código (inglés)** y su descripción en español. Estado de cada campo: `oculto` (no se muestra; el sistema usa un valor por defecto), `opcional` u `obligatorio`.

### `Recipe`

| Campo | Descripción | Fase 1 | Fases 2–4 | Fase 5+ | Por defecto si oculto |
|---|---|---|---|---|---|
| `name` | nombre de la receta | obligatorio | obligatorio | obligatorio | — |
| `ingredients` (≥ 1) | líneas insumo + cantidad | obligatorio | obligatorio | obligatorio | — |
| `category` | categoría | oculto | opcional | opcional | "General" |
| `baseType` | tipo de base (personas/tamaño) | oculto | oculto | obligatorio | `people` |
| `baseServings` | cuánto rinde la base | oculto | opcional | obligatorio | 1 |
| `laborHours` | tiempo de mano de obra | oculto | oculto | obligatorio | 0 |

### `Supply` (el "almacén" de cada ingrediente)

| Campo | Descripción | Fase 1 | Fases 2–4 | Fase 5+ | Por defecto si oculto |
|---|---|---|---|---|---|
| `name` | nombre del insumo | obligatorio | obligatorio | obligatorio | — |
| `stock` | stock actual | obligatorio | obligatorio | obligatorio | — |
| `type` | tipo (ingrediente/empaque) | oculto | oculto | obligatorio | `ingredient` |
| `baseUnit` | unidad base (g / unidad) | oculto | opcional | obligatorio | `unit` |
| `minStock` | umbral del estado de stock | oculto (automático) | opcional | obligatorio | automático |
| `presentationSize` | tamaño de presentación | oculto | oculto | obligatorio | 1 |
| `presentationPrice` | precio de presentación | oculto | opcional | obligatorio | 0 |
| `recommendedSupplierId` | proveedor recomendado | oculto | oculto | opcional | — |

### `Customer`

| Campo | Descripción | Fase 3 | Fase 5+ (con delivery) | Por defecto |
|---|---|---|---|---|
| `name` | nombre del cliente | obligatorio | obligatorio | — |
| `phone` | teléfono / contacto | opcional | obligatorio | — |
| `notes` | notas | opcional | opcional | — |

### `Order`

| Campo | Descripción | Fase 3 (simple) | Fase 5+ | Por defecto |
|---|---|---|---|---|
| `customerId` | cliente | obligatorio | obligatorio | — |
| `recipeId` | producto / receta | obligatorio | obligatorio | — |
| `salePrice` | precio de venta | obligatorio (a mano) | derivado del presupuesto | — |
| `quoteId` | presupuesto de origen | oculto | obligatorio | — |
| `materialRequirements` | requerimientos de materiales | oculto | calculado | — |

Idea clave: los campos que en la Fase 1 son ruido (`presentationPrice`, `baseType`, `laborHours`) viven **ocultos con un valor por defecto**; reaparecen como **opcionales** cuando empiezan a importar y se vuelven **obligatorios** solo cuando el cálculo o la operación dependen de ellos.

---

## 6. Cómo se actualiza el inventario (contexto `inventory`)

Todo cambio de stock queda como un **`StockMovement`**: así siempre se puede ver de dónde salió y entró cada cosa. El flujo de actualizar inventario existe desde la Fase 1, pero crece con el negocio.

El estado de un almacén es un `StockStatus`:

```
enum StockStatus {
  EMPTY   // "Agotado": stock en cero o por debajo
  LOW     // "Poco": por encima de cero pero bajo el umbral mínimo
  OK      // "Suficiente": por encima del umbral
}
```

### En el modo básico (Fases 1–4)

- **Entrada por compra** — `RegisterPurchase`: cuando el jugador vuelve de comprar y anota lo que trajo, se crea un `StockMovement` de **entrada (+)** y el almacén sube. Es lo único que necesita para pasar de `EMPTY` a `OK`.
- **Salida por cocinar** — `CookRecipe`: al preparar una receta, se descuenta del almacén lo que consume; se crea un `StockMovement` de **salida (−)**.
- **Corrección simple** — `UpdateStock`: si el jugador se equivocó al registrar, corrige la cantidad del almacén y queda el movimiento de ajuste. Sin tipos ni motivos: solo "dejarlo en la cantidad correcta".

El `StockStatus` se recalcula solo tras cada movimiento. Las etiquetas para el jugador son **Agotado / Poco / Suficiente**. Su representación visual (color, icono, `StatusBadge`) se define en `diseno_componentes.md` y `diseno_iconografia.md`; su lugar en el mundo, en `diseno_mundo_juego.md`.

### En el modo avanzado (Fase 5+)

Cuando aparecen las mermas y el deterioro, la corrección simple se reemplaza por un flujo formal:

- **Ajustar inventario** — `AdjustInventory`: el jugador elige un **tipo de ajuste** (`adjustmentType`: merma, daño, vencimiento, conteo, devolución). Cada tipo trae un **signo** (merma/daño/vencimiento restan; conteo puede sumar o restar; devolución suma). Se registra cantidad, motivo opcional y fecha; el stock se mueve y su `StockStatus` se recalcula.
- **Historial de movimientos** — `ListStockMovements`: el kardex completo de un insumo (entradas por compra, salidas por consumo, ajustes), para auditar qué pasó con el stock.

**Configuración que aparece con esta función:** la lista editable de tipos de ajuste y su signo (contexto `settings`).

---

## 7. Flujos de negocio del modo básico (Fases 1–4)

### Fase 1 — Cocina en casa

**Contextos activos:** `progression`, `kitchen`, `catalog` (mínimo), `inventory` (compra y consumo). **Tablas:** `Recipe`, `Supply` y el registro de `Production`.

**Campos que se usan, y solo estos:** `Recipe`(`name` + `ingredients`), `Supply`(`name` + `stock`). El umbral (`minStock`) es automático.

**Flujo:**
1. `ChooseRecipe` — el jugador decide qué preparar.
2. `CheckIngredients` — compara la receta contra los almacenes y marca el `StockStatus` de cada uno. Si falta algo, dice "te falta esto, cómpralo".
3. `RegisterPurchase` — el jugador anota lo que trajo; el almacén pasa a `OK` (ver §6).
4. `CookRecipe` — consume del almacén y registra la `Production`.

**Configuración a la vista:** ninguna. El sistema fija solo los valores por defecto.

### Fase 2 — Producción para redes sociales

**Contexto nuevo:** `reputation`. **Entidades:** `SocialPost`, `Popularity`.
**Casos de uso:** `PublishProduction` (necesita una producción terminada), `UpdatePopularity`, `ReceiveInformalOrder`.
**Campos nuevos:** la publicación (`recipeId`, `date`) y los puntos de `Popularity`. En `Recipe`, `category` pasa a opcional.
**Configuración a la vista:** opcional, un nombre de marca para las publicaciones.

### Fase 3 — Primer cliente

**Contexto nuevo:** `sales`. **Entidades:** `Customer`, `Order`, `Sale`.
**Flujo mínimo:** Cliente → Pedido → Producción → Entrega → Cobro.
**Campos que se usan:** `Customer`(`name`; `phone`/`notes` opcionales); `Order`(`customerId`, `recipeId`, `salePrice` a mano). La ganancia sigue directa: precio − gasto.
**Configuración a la vista:** ninguna obligatoria.

### Fase 4 — Primeras ventas y la tienda física

**Contexto nuevo:** `dashboard` (KPIs y alertas aparecen con la tienda).
Al completar **5 ventas** se desbloquea `PHYSICAL_STORE` y se entra al modo avanzado.
**Primera y única configuración real hasta aquí:** el nombre del negocio. Todavía sin IGV ni costos.

---

## 8. Funciones avanzadas (Fase 5+): cada una con su meta y su configuración

Cada función llega **cuando el negocio la necesita**, con sus campos (que recién ahí se vuelven obligatorios) y su bloque de configuración al lado.

### 8.1 `QUOTING` — presupuestos con costo y margen — meta: 10 ventas

**Contexto:** `quoting` (`Quote` + `QuoteDetail`). Se vuelven obligatorios en `Recipe` los campos `baseType`, `baseServings` y `laborHours`; en `Supply`, `presentationSize`, `presentationPrice` y `minStock`.
**Casos de uso:** `CalculateQuote`, `SaveQuote`, `ApproveQuote`, `RejectQuote`. Al guardar, **congela** los precios (cambiar un insumo luego no afecta presupuestos ya guardados).
**Configuración que aparece:** tarifa de mano de obra por hora, margen por defecto, lista de tamaños y factores de escalado.

### 8.2 `TAX` — IGV / formalización — meta: 20 ventas o ingresos ≥ S/ 2 000

Se activa el impuesto. **Configuración que aparece:** aplicar IGV, tasa de IGV (18 % por defecto) y modo de redondeo.

### 8.3 `SUPPLIERS` — proveedores y compra formal — meta: 3 compras registradas

**Contexto:** `supply-chain` (`Supplier`). `RegisterPurchase` se enriquece (proveedor, fecha, precio de presentación). Aparece la lista de compras agrupada por proveedor con enlace de WhatsApp.
**Configuración que aparece:** datos del proveedor (nombre, WhatsApp).

### 8.4 `OPERATING_COSTS` — costos operativos — meta: 15 pedidos

Entran al costo el costo indirecto por pedido y la depreciación por pedido (montos fijos).
**Configuración que aparece:** esos dos parámetros.

### 8.5 `SPOILAGE` — mermas y deterioro — meta: ≥ 8 insumos en bodega

Se desbloquea el flujo formal de `AdjustInventory` (ver §6). **Configuración que aparece:** la lista de tipos de ajuste y su signo.

### 8.6 `PACKAGING_RULES` — reglas de empaque — meta: vender 3 tamaños distintos

**Entidad:** `PackagingRule` (receta + tamaño → empaque + cantidad), para prellenar los empaques sugeridos del presupuesto.

### 8.7 `ADVANCED_ORDERS` — pedidos avanzados — con la tienda en marcha

`Order` gana `quoteId` y `materialRequirements`. Estados: **Pendiente → Producción → Entregado**, con **cancelar** (devuelve stock) antes de entregar.
**Configuración que aparece:** días de vencimiento del presupuesto y momento de descuento de stock (al aprobar o al iniciar producción).

### 8.8 Resto de metas

`EQUIPMENT`/producción masiva (10 pedidos/semana), `EMPLOYEES` (≥ 5 pedidos simultáneos), `DELIVERY` (30 ventas), `MARKETING` (popularidad ≥ 1 000), `FINANCE`/impuestos (3 meses de operación) y `BRANCHES` (ingresos ≥ S/ 20 000). Cada una trae su entidad, su caso de uso y su configuración **en el momento del desbloqueo**.

---

## 9. Reglas de cálculo del precio (modo avanzado)

- **Costo total** = `ingredients + materials + labor + fixedOverhead + fixedDepreciation`.
- **Margen sobre la venta** (no sobre el costo): `priceWithMargin = totalCost / (1 - margin/100)`.
- **IGV** (cuando está activo): se suma **encima** del precio con margen → `taxAmount = priceWithMargin × (taxRate/100)`. Tasa por defecto 18 %.
- **Redondeo** (cuando es múltiplo de 5): `finalPrice = ceil((priceWithMargin + taxAmount)/5) × 5`. Si es "ninguno", `finalPrice = priceWithMargin + taxAmount`.
- **Escalado:** los ingredientes escalan por el factor; el empaque **no** escala (se fija a mano).

---

## 10. Validaciones y comportamientos transversales (avanzado)

- Antes de aprobar un presupuesto, avisa cuánto stock quedará en negativo.
- No se aprueba dos veces el mismo presupuesto ni se entrega un pedido que no está en producción; los botones que no aplican no aparecen. No se cancela un pedido ya entregado.
- Cada guardado escribe **auditoría** (fecha, usuario, qué cambió, antes/después).
- Mover stock o crear pedidos usa **bloqueo** para que un doble clic no descuente dos veces.
- Los obligatorios se marcan; los números no aceptan letras; precios, cantidades y stock no son negativos; los desplegables se alimentan de los catálogos.

---

## 11. Nota técnica: cálculos vivos vs. transacciones congeladas

- **Cálculo vivo:** mira datos actuales y los muestra (precio por unidad, `StockStatus`, contadores del resumen). Se recalcula solo.
- **Transacción congelada:** escribe un hecho que debe quedar fijo en el tiempo (guardar un presupuesto con su precio, descontar stock al aprobar, registrar la venta al entregar, devolver stock al cancelar, subir stock al comprar, auditoría). Lo escribe el código y no se recalcula.

Frontera: si el valor debe quedar igual al día en que se guardó, es transacción; si debe reflejar siempre el estado actual, es cálculo vivo. Así se preserva la trazabilidad de presupuestos y pedidos mientras catálogos y resumen se leen solos.
