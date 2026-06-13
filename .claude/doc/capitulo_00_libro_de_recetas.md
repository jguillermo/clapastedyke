# Capítulo 0 — El libro de recetas en blanco

> **Documento de capítulo.** Es la fuente de verdad de *este* capítulo y nada más. Autocontenido y aislado: describe solo lo que hace el Cap 0; no toca ni asume otros capítulos (ver la Regla de oro en `historia_y_fases.md`, Parte 3).
>
> **Convención.** Identificadores que existirán en código, en **inglés** (bounded context, entidades, casos de uso, eventos, `Feature`s, escenas); narrativa, diálogos y textos de interfaz, en **español**.
>
> **Alcance.** Fase 0 (preludio). Ariana arma su **recetario modular**, anota el **costo de compra** de cada insumo, **compone una torta** escalada por el peso del queque y obtiene su **lista de compra con el costo de materiales**. El precio que aparece aquí es **solo el costo de comprar la materia prima** — todavía **sin precio de venta, sin margen, sin inventario** (eso llega con el relato: el precio de venta es del Cap. 7).

---

## 1. Narrativa

Antes de hornear nada, Ariana tiene un sueño concreto: hacer una **torta de verdad** —no un bizcocho pelado, sino la de capas, con relleno, cobertura, un topper y su caja bonita—. Abre su libro de recetas y está **en blanco**. Y cae en cuenta de algo: una torta no es *una* receta. Es una **base (el queque)**, un **relleno**, una **cobertura** y los **complementos** (caja, base, topper).

Así que empieza a escribir. Primero su **queque**: los ingredientes y **cuánto rinde** (1 kg, alcanza para X porciones) —esa es su medida de referencia—. Y por cada insumo apunta **cómo lo compra**: la harina la compra **de a 1 kg, y le cuesta 5 soles**. No tiene que hacer ninguna cuenta rara —pone la compra tal cual—; el libro entiende que su queque solo usa 300 g de esa harina y le muestra, calladito al lado, que **esos 300 g le cuestan 1.50**. Luego un **relleno**, suficiente para ese kilo. Luego una **cobertura**. Su libro deja de estar vacío: tiene un pequeño **recetario modular** que además sabe **cuánto cuesta cada cosa**.

Ahora **compone su primera torta** sobre el papel: *este* queque + *este* relleno + *esta* cobertura, para 1 kg. El libro hace las cuentas —escala relleno y cobertura al peso del queque—, le **sugiere la caja y la base** del tamaño correcto, y ella **elige un topper** para decorar. Al final sale una **lista**: qué necesita, cuánto, y **cuánto le cuesta comprarlo todo**. Si mañana quiere la misma torta de 2 kg, todo se **recalcula** solo —cantidades y costos—.

Todavía **no fija el precio de venta ni piensa en margen** —eso llega cuando alguien le pregunte "¿a cuánto?"—. Lo que sí sabe, por primera vez, es **exactamente qué es su torta, qué lleva y cuánto le cuesta de materiales**. Con esa lista en la mano, está lista para empezar.

**Costura con el Capítulo 1.** El Cap 0 es el preludio tranquilo. El Cap. 1 ("La cocina vacía") queda intacto en su emoción y se lee como la continuación natural: *ya sé mi receta y qué necesito; ahora horneo de verdad y siento que lo hice yo*.

---

## 2. Diálogos de ayuda (coach mínimo)

Coaching mínimo: 1–2 frases del **Chef Coach** (globo + `GuideCursor`) por paso clave, más **hints** persistentes bajo los campos. Textos en español, listos para i18n. Claves bajo `recipe_book.*`.

### 2.1 Diálogos del coach (`recipe_book.coach.*`)

| Clave | Momento | Texto |
|---|---|---|
| `coach.intro` | Al terminar `flyIn`, en la cocina | "Bienvenida a tu cocina. Antes de hornear, armemos tu libro de recetas." |
| `coach.create_sponge` | Abre el libro vacío | "Empieza por tu **queque**: anota sus ingredientes y cuánto rinde (en kilos). Ese peso manda todo lo demás." |
| `coach.ingredient_cost` | Primera vez que agrega un insumo nuevo | "Cuando agregues un insumo, dime cómo lo compras: cuánto y a qué precio (ej. 1 kg a S/ 5). Yo calculo lo que cuesta la cantidad de tu receta." |
| `coach.create_filling` | Tras guardar el queque | "Ahora un **relleno**. Dime para cuánto rinde y lo escalo solo con el queque." |
| `coach.create_covering` | Tras guardar el relleno | "Una **cobertura** para terminar la torta." |
| `coach.create_topper` | Tras guardar la cobertura | "Un **topper** para decorar — es un insumo más: dime cómo lo compras y su precio." |
| `coach.create_packaging_rule` | Tras guardar el topper | "Anota tu **caja y base** como cualquier insumo (con su precio) y dime para qué peso van. Yo los sugiero solos." |
| `coach.compose` | Catálogo con lo mínimo listo | "Arma tu torta: elige queque, relleno y cobertura, y dime el peso. Yo hago las cuentas." |
| `coach.shopping_list` | Tras componer | "Lista lista. Esto es lo que necesitas comprar. ¡Ya puedes empezar!" |

### 2.2 Hints de campo (`recipe_book.<form>.<field>_hint`)

| Clave | Texto |
|---|---|
| `sponge.yield_weight_hint` | "Cuánto rinde tu queque, en kilos (ej. 1 kg). Es la medida base para escalar todo." |
| `sponge.line_quantity_hint` | "Cantidad para el rinde de arriba (ej. 250 g de harina por 1 kg de queque)." |
| `ingredient.purchase_qty_hint` | "¿En qué presentación lo compras? (ej. 1 kg, 30 u)." |
| `ingredient.purchase_price_hint` | "Precio de esa compra (ej. S/ 5 por 1 kg). Es el costo de comprarlo, no el precio al que vendes." |
| `line.cost_hint` | "Te muestro el costo solo de la cantidad que pide tu receta; al lado, en gris, cómo lo compras." |
| `filling.reference_weight_hint` | "Para cuánto queque rinde este relleno (ej. suficiente para 1 kg)." |
| `covering.reference_weight_hint` | "Para cuánto queque rinde esta cobertura (ej. suficiente para 1 kg)." |
| `packaging_rule.range_hint` | "Rango de peso de la torta. Para ese rango, qué caja y qué base usar." |
| `compose.target_weight_hint` | "Peso de la torta que quieres armar, en kilos. Todo se recalcula a este peso." |

---

## 3. Objetivo del capítulo

**Señal de avance (medible):** `CAKES_COMPOSED ≥ 1` — componer **una** torta completa y generar su lista de compra.

Como el catálogo arranca **vacío**, componer una torta exige haber creado antes **todo** lo que la compone: queque, relleno, cobertura, un ingrediente de uso `topper` y al menos una regla de empaque que cubra el peso (con sus ingredientes de uso `box`/`base`). Por eso una sola meta cubre toda la construcción del recetario.

**Al cumplirse:** se cierra el **Nivel 0** y se desbloquea `Feature.KITCHEN` (el flujo de cocinar del Capítulo 1).

Criterios de "hecho":
- Existe ≥1 `SpongeRecipe`, ≥1 `FillingRecipe`, ≥1 `CoveringRecipe`, ≥1 `Ingredient` con `usage = topper` y ≥1 `PackagingRule` (con sus ingredientes `box`/`base`).
- **Todo `Ingredient`** (de receta, topper, caja o base) tiene su **precio de compra** (`PurchasePrice`).
- Existe ≥1 `CakeComposition` completa con su empaque sugerido resuelto.
- Se generó su `ShoppingList`, que muestra **costo proporcional por ítem + total de materiales**.

---

## 4. Modelo de dominio

Bounded context **`recipe-book`**, autocontenido. Reutiliza value objects compartidos de `_common`: `EntityId`, `Quantity` (`baseUnit`: `g` | `u`). No hereda el `Recipe` monolítico legado.

### 4.1 Value objects

- **`IngredientLine`** — línea de receta: `{ ingredientId: EntityId, quantity: Quantity }`, expresada al **peso de referencia** de su receta. **No lleva precio**: el costo de la línea es **derivado** (cálculo vivo, §4.3), nunca almacenado aquí.
- **`RecipeYield`** — rinde de referencia del queque: `{ weight: Quantity /* en g */, servings?: number }`. Identidad por valor.
- **`WeightRange`** — banda de peso para empaque: `{ min: Quantity, max: Quantity }`; invariante `max > min`.
- **`PurchasePrice`** — **costo de compra** de un insumo, como *conceptual whole* (identidad por valor, inmutable): `{ amount: number /* soles */, per: Quantity /* la cantidad comprada, ej. 1000 g */ }`. Modela cómo compra Ariana (presentación + precio), no un precio de venta. Comportamiento **sin efectos**, devuelve valor:
  - `perBaseUnit(): number` — costo por unidad base, `amount / per.amount` (ej. S/ 0.005 por gramo). Es el "precio por gramo": un **cálculo de referencia vivo**.
  - `costFor(qty: Quantity): number` — **regla de tres**, `qty.amount * perBaseUnit()` (300 g → S/ 1.50; 4 u de un pack de 30 a S/ 12 → S/ 1.60).
  - `equals()` (por valor) y `toString()` → la referencia "ghost" (`"1 kg · S/ 5"`).
  - Invariantes: `amount > 0`, `per.amount > 0`.

### 4.2 Entidades y agregados

El contexto tiene **6 agregados pequeños** (Regla 2 de Vernon). Cada raíz se persiste por separado, referencia a las demás **solo por identidad** (Regla 3) y protege sus propias invariantes dentro de su límite (Regla 1). **Regla 4 (consistencia eventual):** cada caso de uso modifica **un solo agregado por transacción**; en el Cap 0 se cumple trivialmente —ningún caso de uso muta dos agregados y `CakeComposition` referencia las recetas en **solo-lectura**—, y la propagación a otros contextos (`progression`, mundo) es por Domain Events, no transaccional.

> **Todo lo que se compra para preparar la torta es un `Ingredient`** — no hay distinción: la harina, los huevos, el manjar, el topper, la caja y la base son todos `Ingredient`. Lo que cambia es **para qué se usa** (`usage`), no qué son ni cómo se compran. Por eso no existen agregados `Topper` ni `PackagingItem` separados: serían el mismo concepto con otro nombre.

| Agregado raíz | Miembros internos | Referencias (solo por id) | Comportamiento clave |
|---|---|---|---|
| `Ingredient` | `PurchasePrice` (VO) | — | `repricedTo` |
| `SpongeRecipe` (queque) | `IngredientLine[]`, `RecipeYield` | `Ingredient` (`ingredientId` en cada línea) | `addLine`, `changeYield` |
| `FillingRecipe` (relleno) | `IngredientLine[]` | `Ingredient` | `addLine` |
| `CoveringRecipe` (cobertura) | `IngredientLine[]` | `Ingredient` | `addLine` |
| `PackagingRule` | `WeightRange` (VO) | `Ingredient` (`boxIngredientId`, `baseIngredientId`) | `matches(weight): boolean` |
| `CakeComposition` (la torta) | — | `Sponge/Filling/CoveringRecipe`, `Ingredient` (topper/caja/base, todo por id) | `recompose(targetWeight)` |

Campos por agregado:

- **`Ingredient`** — `{ id: EntityId, name, baseUnit: 'g' | 'u', purchasePrice: PurchasePrice, usage: 'recipe' | 'topper' | 'box' | 'base' }`. **Cualquier insumo que se compra para preparar la torta** (de receta, topper, caja o base). **Necesita identidad** porque la `ShoppingList` agrega por `ingredientId`. El **precio de compra vive aquí** (no en la línea): por eso, al elegir un insumo existente, "se jala su información" (precio incluido). `usage` es **solo una etiqueta de uso** (en qué slot entra al componer y cómo se agrupa en la lista), **no** afecta cómo se compra ni se valora — todos llevan `PurchasePrice` y se llenan igual. La **factory `create(...)`** registra `IngredientRepriced { previousPrice: null }` (precio inicial) y el método de intención `repricedTo(newPrice): Ingredient` —que devuelve una **nueva instancia** con el precio cambiado (inmutable)— registra `IngredientRepriced { previousPrice, newPrice }` (cambio). Ambos eventos (§6.2) alimentan el histórico.
- **`SpongeRecipe`** — `{ id, name, flavor?, referenceYield: RecipeYield, lines: IngredientLine[] }`. **Define el peso de referencia** que gobierna el escalado de toda la torta. Sus líneas referencian ingredientes con `usage = recipe`.
- **`FillingRecipe`** — `{ id, name, referenceWeight: Quantity /* g */, lines: IngredientLine[] }`. Cantidades por ese peso de referencia.
- **`CoveringRecipe`** — misma forma que `FillingRecipe` (mismo rol: capa escalada por peso).
- **`PackagingRule`** — `{ id, range: WeightRange, boxIngredientId, baseIngredientId }`. `matches(weight)` → `range.min ≤ weight ≤ range.max`. Los ids apuntan a `Ingredient` con `usage` `box`/`base`.
- **`CakeComposition`** — `{ id, name?, targetWeight: Quantity /* g */, spongeRecipeId, fillingRecipeId, coveringRecipeId, topperIngredientId?, suggestedBoxIngredientId, suggestedBaseIngredientId }`. El topper, la caja y la base son ingredientes referenciados por id.

**Creación y comportamiento (evitar Anemic Domain Model).** Cada raíz se crea con una **factory** que impone sus invariantes (`SpongeRecipe.create(...)`, etc.) y se modifica con **métodos de intención de negocio** (`addLine`, `changeYield`, `recompose`), nunca con setters públicos. Las invariantes de una sola instancia viven en el agregado (§11.1); las que cruzan varias instancias, fuera (§11.2).

- **`ShoppingList`** — **no es agregado**: es una **proyección / read model** (estilo CQRS) derivada de una `CakeComposition` + sus recetas. No se persiste como transacción ni tiene repositorio. `items: ShoppingListItem[]`, `totalCost: string /* 'S/ 14.50', ya formateado */`. El total es la suma de los costos de los ítems — **cálculo vivo de referencia**, no un total congelado, y se proyecta **listo para pintar**.
  - **`ShoppingListItem`** — `{ name, totalQuantity: Quantity, cost: string /* 'S/ 1.50' */, purchaseReference: string, category: 'ingredient' | 'packaging' | 'topper' }`. `cost` es el **costo proporcional** de la cantidad de la lista (regla de tres, ya formateado para la vista); `purchaseReference` es la referencia "ghost" (`"1 kg · S/ 5"`). Sigue **sin stock**. **Todos** los ítems llevan precio (receta, topper, caja y base son `Ingredient` con `PurchasePrice`), así que todos muestran su `cost`. `category` se **deriva del `usage`** del ingrediente (`recipe`→ingrediente, `box`/`base`→empaque, `topper`→topper). El cálculo crudo en soles vive en el dominio (`PurchasePrice.costFor`); la **proyección** lo formatea (la vista no calcula ni formatea).

- **`PriceHistoryEntry`** — `{ ingredientId, price: PurchasePrice, recordedAt }`. **Log de auditoría append-only, invisible al usuario** — **no** es parte de la composición de la torta ni del flujo visible. Lo escribe **solo** el suscriptor `IngredientPriceRecorder` (§5) al reaccionar a `IngredientRepriced` (§6.2); jamás se lee desde la UI del Cap 0. Existe para tener trazabilidad del historial de precios "por debajo".

### 4.3 Escalado (cálculo vivo)

El peso objetivo de la composición (`targetWeight`) gobierna todo:

```
factorSponge   = targetWeight / sponge.referenceYield.weight
factorFilling  = targetWeight / filling.referenceWeight
factorCovering = targetWeight / covering.referenceWeight
```

- Cada `IngredientLine` se multiplica por el factor de su receta (`quantity.scaleBy(factor)`).
- Los ingredientes se **agregan por `ingredientId`** sumando cantidades (mismo insumo en queque + relleno + cobertura suma en una sola línea).
- **Costo (cálculo vivo):** por cada ítem, `cost = ingredient.purchasePrice.costFor(quantity)` (= `quantity.amount × purchasePrice.perBaseUnit()`, regla de tres). Aplica **igual a todo**: a las líneas de receta (con la cantidad escalada) y al topper / caja / base (con su cantidad de 1 u). El **costo total de materiales** = suma de **todos** los costos. Es **derivado**, nunca almacenado: vive en `PurchasePrice.costFor()` y lo proyecta el `ShoppingListBuilder`.
- **Empaque:** `PackagingRule.matches(targetWeight)` → caja + base (1 c/u); cada una es un `Ingredient` con su precio.
- **Topper:** 1 por torta (ítem de conteo, no escala por peso); es un `Ingredient` con su precio.

> **A confirmar en revisión:** el topper se modela como ítem `count = 1` (no escala por peso). Si debe escalar con el tamaño, se ajusta a un modelo por banda como el empaque.

El escalado es **cálculo vivo**: cantidades **y costos** se recalculan al cambiar `targetWeight`, cualquier receta o el `PurchasePrice` de un insumo. La `ShoppingList` se materializa al generarla (lectura de la composición actual); el Cap 0 no congela transacciones —ni cantidades ni costos— porque aquí solo se planifica la compra, no se compra ni se vende todavía.

---

## 5. Bounded context

Contexto único **`recipe-book`** (Core Domain del capítulo) con estructura DDD.

**Lenguaje ubicuo** (español del negocio ↔ identificador en código):

| Negocio (español) | Código (inglés) |
|---|---|
| queque (bizcocho base) | `SpongeRecipe` |
| relleno | `FillingRecipe` |
| cobertura | `CoveringRecipe` |
| ingrediente / insumo (todo lo que se compra para preparar) | `Ingredient` |
| para qué se usa el insumo | `usage` (`recipe` / `topper` / `box` / `base`) |
| rinde (cuánto pesa/alcanza el queque) | `referenceYield` / `referenceWeight` |
| topper (decoración) | `Ingredient` con `usage = topper` |
| empaque (caja / base) | `Ingredient` con `usage = box` / `base` |
| regla de empaque (peso → caja/base) | `PackagingRule` |
| torta (lo que se arma) | `CakeComposition` |
| componer una torta | `ComposeCake` |
| escalar por peso | `CakeScalingService` |
| precio de compra (presentación + precio) | `PurchasePrice` |
| costo por gramo / unidad base | `pricePerBaseUnit` (`PurchasePrice.perBaseUnit()`) |
| costo de la cantidad de la receta (regla de tres) | `PurchasePrice.costFor(qty)` |
| costo de materiales | `ShoppingList.totalCost` |
| histórico de precios (auditoría) | `PriceHistoryEntry` / `IngredientPriceRecorder` |
| lista de compra | `ShoppingList` |

Estructura del contexto:

```
core/recipe-book/
├── domain/
│   ├── entities/         ← Ingredient, SpongeRecipe, FillingRecipe, CoveringRecipe,
│   │                        PackagingRule, CakeComposition
│   ├── value-objects/    ← IngredientLine, RecipeYield, WeightRange, PurchasePrice
│   ├── repositories/     ← un contrato por agregado raíz + IngredientPriceHistoryRepository
│   └── services/         ← CakeScalingService, PackagingRuleOverlapPolicy, ShoppingListBuilder
├── application/
│   └── use-cases/        ← ver §10
└── infrastructure/       ← repos concretos (almacén local), mappers,
                             IngredientPriceRecorder (suscriptor de auditoría)
```

**Un repositorio por agregado raíz** (Vernon). `ShoppingList` **no** tiene repositorio (es proyección):

`IngredientRepository` (cubre receta, topper, caja y base — todos son `Ingredient`), `SpongeRecipeRepository`, `FillingRecipeRepository`, `CoveringRecipeRepository`, `PackagingRuleRepository`, `CakeCompositionRepository`.

Más un **store de auditoría append-only** (no es un agregado de negocio): `IngredientPriceHistoryRepository` (`append(entry: PriceHistoryEntry)`). Lo escribe **solo** el suscriptor `IngredientPriceRecorder`; ningún caso de uso del flujo lo toca ni lo lee.

**Domain services** (operaciones que no pertenecen a un solo agregado, sin estado):
- `CakeScalingService` — escala las recetas al `targetWeight`. Es servicio (no método de `CakeComposition`) porque necesita queque + relleno + cobertura **cargados**, y un agregado no debe cargar otros agregados.
- `PackagingRuleOverlapPolicy` — valida la invariante *set-based* de no-solape entre bandas (§11.2).
- `ShoppingListBuilder` — proyecta la `ShoppingList` (proyector de read model), incluyendo el **costo proporcional por ítem** (`PurchasePrice.costFor`) y el `totalCost`.

**Suscriptor de auditoría (Domain Events).** `IngredientPriceRecorder` (en `infrastructure/`, estilo del `cake-composed-progress.subscriber.ts` de `progression`) se suscribe en el `EventBus` a **`IngredientRepriced`** y hace `append` de un `PriceHistoryEntry` en `IngredientPriceHistoryRepository`. **Está desacoplado** de `SaveIngredient`: reacciona al evento, no es llamado por el caso de uso. Es **invisible** para el usuario (sin UI, sin coach). Se registra como suscriptor activo en `recipe-book.providers.ts`.

> **Patrón de eventos (regla del contexto).** Todo caso de uso, tras **persistir** su agregado, **publica** su Domain Event (`pullEvents()` del agregado → `EventBus`). Los suscriptores reaccionan en su propio dominio sin acoplarse al emisor. El histórico de precios es una aplicación concreta de este patrón; cualquier otra reacción futura (mundo, contadores) se engancha igual.

**Relaciones estratégicas (Context Mapping):**
- `recipe-book` → `progression`: **Customer/Supplier con Published Language**. `recipe-book` es *upstream* y publica Domain Events (§6); `progression` es *downstream* y se suscribe solo a `CakeComposed`. Sin acoplamiento directo.
- `recipe-book` ↔ `_common`: **Shared Kernel** mínimo (`EntityId`, `Quantity`). No debe crecer más allá de VOs transversales.

- Persistencia local, en el mismo almacén del juego que el resto de los datos.
- **No enciende** otros contextos. Solo publica eventos (ver §6) para que `progression` y el mundo reaccionen.
- `ShoppingList` es una proyección de lectura, no se persiste como transacción.

---

## 6. Motor de progresión

Usa el contexto `progression` existente (`PlayerProgress`, `Goal`, `Level`, `GoalType`, `GoalMode`, `Feature`). El Cap 0 añade:

- **`Feature.RECIPE_BOOK`** — encendida al iniciar la partida. `PlayerProgress.currentLevel` arranca en **0**.
- **`GoalType.CAKES_COMPOSED`** — modo `INCREMENT`.
- **`Level 0`** (key `recipe-book`):
  - `goals`: `[{ type: CAKES_COMPOSED, target: 1, mode: INCREMENT }]`
  - `unlocks`: `[Feature.KITCHEN]`

**Persistencia.** El progreso se guarda con el mecanismo existente de `progression`: un `ProgressRecord` (`currentLevel: 0`, `progressByType`, `unlockedFeatures: [RECIPE_BOOK]`) en el almacén local del juego, reescrito en cada `RecordProgress` y avance de nivel. El recetario en sí (recetas, toppers, empaques, composición) persiste en los repositorios del contexto `recipe-book` (§5).

### 6.1 Qué dispara el progreso

| Evento de dominio (`recipe-book`) | `RecordProgress` | `mode` | `value` |
|---|---|---|---|
| `CakeComposed { compositionId }` | `CAKES_COMPOSED` | INCREMENT | +1 |

Tras `RecordProgress`, `EvaluateLevelUp` cierra el Nivel 0 → `LevelAdvanced { 0 → 1, forced: false }` + `FeatureUnlocked { KITCHEN }`.

### 6.2 Eventos de dominio del contexto

Convención: nombre en pasado, inglés, payload mínimo.

- `IngredientSaved { ingredientId, isNew }`
- `IngredientRepriced { ingredientId, previousPrice: PurchasePrice | null, newPrice: PurchasePrice, occurredAt }` — al **fijar** el precio por primera vez (`previousPrice: null`) o **cambiarlo**. Dispara el registro en el histórico vía `IngredientPriceRecorder`. **No mueve la meta.**
- `SpongeRecipeSaved { recipeId, isNew }`
- `FillingRecipeSaved { recipeId, isNew }`
- `CoveringRecipeSaved { recipeId, isNew }`
- `PackagingRuleSaved { ruleId }`
- `CakeComposed { compositionId }` ← **único que mueve la meta**
- `ShoppingListGenerated { compositionId, itemCount }`

`progression` solo se suscribe a `CakeComposed`. `IngredientPriceRecorder` (auditoría, §5) solo se suscribe a `IngredientRepriced` y escribe el histórico **por debajo** —no afecta la señal de avance ni el cierre del Nivel 0—. Los demás existen para el mundo (reacciones del chef, contadores visuales) y auditoría.

---

## 7. Representación del mundo 3D

Escena **`WorldScene.KITCHEN`** (la cocina de casa). El Cap 0 vive entero aquí.

- **Arranque `flyIn()`** — secuencia cinemática ciudad → casa → cocina; al terminar, el chef toma la guía (`coach.intro`).
- **Estación `KitchenStation.RECIPE_BOARD`** — el libro de recetas. Es la entrada del Cap 0 ("elegir **y crear** recetas", según el diseño del mundo). `focusStation(RECIPE_BOARD)` acerca la cámara y posiciona al chef; `resetView()` al cerrar el overlay.
- Las estaciones `PANTRY` y `OVEN` existen en la escena pero **inertes** en el Cap 0 (su acción se desbloquea con `KITCHEN`, Cap. 1).

### 7.1 Motor y assets

- **Three.js** + `GLTFLoader` con `DRACOLoader`, cargando el GLB fijo de la cocina + sus movibles según `scene_layout.json` (Draco + texturas WebP).
- Esos GLB **no existen aún**: se **exportan** desde `3dmodel/Isometric Rooms Collection/isometric cozy kitchen.blend` (la cocina oficial del juego) siguiendo el procedimiento canónico de `mundo_3d_assets.md` (y `.claude/3dmodel/export.md`). El Cap 0 los **consume**, no los produce.
- La escena respeta las reglas de `mundo_3d_assets.md`: **lo más ligero posible** (es web), **FIJO** todo lo que no se mueve (paredes, azulejos, horno, repisas) en un solo GLB cargado una vez, y **MOVIBLES** solo utensilios/vasos/etc.; los movibles **proyectan sombra** sobre el fijo para verse reales.
- Rig de cámara que implementa `flyIn()`, `focusStation(station)` y `resetView()` (acercamientos guiados, no saltos bruscos).

### 7.2 Accesibilidad (obligatoria)

- `prefers-reduced-motion` → sin recorridos de cámara: cambios de vista **directos** (se omite `flyIn`, fade a la cocina).
- **Sin WebGL** → la **ruta accesible** (dock + lista de estaciones y acciones) opera el flujo completo del Cap 0 sin 3D.

---

## 8. Componentes visuales

De la suite de diseño (`.claude/design/diseno_componentes.md`, tokens en `diseno_visual.md`, iconos en `diseno_iconografia.md`). El Cap 0 usa:

| Componente | Uso en el Cap 0 |
|---|---|
| **Overlay** (panel de vidrio) | Contenedor de "Mi libro de recetas" y de cada formulario/flujo. Cierra con `x`/`Esc`/scrim → `resetView`. |
| **Form Field** | Formularios de queque, relleno, cobertura, topper, regla de empaque y composición. Label visible, input ≥44px, validación on-blur. En las líneas de ingrediente, muestra a la derecha el **costo proporcional** y, en gris pequeño, el **ghost** con la referencia de compra (texto, no componente nuevo). |
| **Card** + **List/Table** | Listado del catálogo por tipo y la tabla de la lista de compra (móvil: cards; desktop: tabla). |
| **Button** | Acciones primarias/secundarias ("Guardar", "+ Nuevo", "Componer torta", "Generar lista"). |
| **Chef Coach / Speech Bubble** + **GuideCursor** | Coaching mínimo (§2). Respeta `prefers-reduced-motion`. |
| **EmptyState** | Libro de recetas vacío al iniciar, con CTA "Crea tu primer queque". |
| **Toast** | Confirmación de guardado y de lista generada. |
| **LevelUp Modal** | Cierre del Cap 0: "Tu recetario está listo" → desbloquea `KITCHEN`. |
| **HUD mínimo** + **Dock** + **GoalTracker** | Barra ligera (Nivel 0), dock como ruta accesible, 1 meta visible (`CAKES_COMPOSED`). Sin KPIs (no hay tienda aún). |

---

## 9. Flujo de trabajo detallado

```
flyIn → Cocina → coach.intro → tap RECIPE_BOARD → "Mi libro de recetas" (EmptyState)
  → SaveSpongeRecipe → SaveFillingRecipe → SaveCoveringRecipe → SaveIngredient(topper) → SaveIngredient(caja/base) + SavePackagingRule
  → ComposeCake (elige queque+relleno+cobertura, peso kg, topper; sugiere caja/base)
  → GenerateShoppingList → CakeComposed → ✔ Nivel 0 → LevelUp → desbloquea KITCHEN
```

**Detalle por paso:**

1. **Arranque.** `flyIn` → vista de cocina → `coach.intro`.
2. **Abrir el libro.** Tap `RECIPE_BOARD` → `focusStation` + overlay "Mi libro de recetas". Secciones: *Queques · Rellenos · Coberturas · Toppers · Empaques · Componer*. Todo vacío → `EmptyState` con CTA "Crea tu primer queque".
3. **Crear queque (`SaveSpongeRecipe`).** Nombre, sabor (opcional), **rinde** (peso en kg + porciones opcionales) y líneas de ingrediente. Cada línea se llena en orden: **nombre → cantidad → precio**.
   - **Insumo nuevo** (el nombre no existe en el catálogo): se abre el sub-flujo "Nuevo ingrediente" que pide **cómo lo compra** (presentación + precio) y crea el `Ingredient` con su `PurchasePrice` (`SaveIngredient`). Aquí **aparece el precio por primera vez en el juego**.
   - **Insumo existente:** al elegirlo se **jala su precio** automáticamente (no se vuelve a pedir).
   - En **toda** línea, a la derecha, el libro muestra el **costo proporcional** de *esa* cantidad (regla de tres) en grande, y debajo, en gris pequeño, el **ghost** con la referencia de compra. **Recalcula en vivo** cada vez que cambias la cantidad o el precio. Esa cifra y el ghost los entrega el negocio listos para pintar (`PreviewIngredientCost`, §10); la vista no calcula.

   ```
   ┌────────────────────────────────────────────────────┐
   │ Nuevo queque                                    ✕   │
   ├────────────────────────────────────────────────────┤
   │ Nombre *        [ Queque de vainilla            ]   │
   │ Rinde *         [ 1     ] kg        [ 8 ] porciones  │
   │ Ingredientes *                                      │
   │   [ Harina ▾ ]  [ 300 ] g          S/ 1.50   [+]    │
   │                                    ⌁ 1 kg · S/ 5    │  ← ghost (gris, pequeño)
   │   [ Huevos ▾ ]  [ 4   ] u          S/ 1.60   [−]    │
   │                                    ⌁ 30 u · S/ 12   │  ← ghost
   ├────────────────────────────────────────────────────┤
   │                                 [ Guardar queque ]  │
   └────────────────────────────────────────────────────┘
   ```

   Sub-flujo al teclear un insumo que **no existe** (define su costo de compra una sola vez):

   ```
   ┌────────────────────────────────────────────────────┐
   │ Nuevo ingrediente: "Harina"                     ✕   │
   ├────────────────────────────────────────────────────┤
   │ ¿Cómo lo compras? (con esto calculo el costo por g) │
   │   Compra *  [ 1 ] [ kg ▾ ]   Precio *  [ S/ 5.00 ]  │
   │   ⌁ costo por gramo: S/ 0.005                        │
   ├────────────────────────────────────────────────────┤
   │                            [ Guardar ingrediente ]  │
   └────────────────────────────────────────────────────┘
   ```

   Guardar el queque → `Toast`. (El `PurchasePrice` se guarda en el `Ingredient`; si el insumo ya existía y cambiaste su precio, se emite `IngredientRepriced` y el histórico lo registra por debajo — §6.2.)

4. **Crear relleno (`SaveFillingRecipe`).** Nombre, **peso de referencia** (para cuánto queque rinde) y líneas de ingrediente — **mismo patrón de línea** que el queque (nombre → cantidad → precio, con costo proporcional + ghost). Guardar.
5. **Crear cobertura (`SaveCoveringRecipe`).** Igual que el relleno.
6. **Crear topper (`SaveIngredient`, `usage = topper`).** Es **un ingrediente más**: nombre + **cómo lo compra** (presentación + precio), con el **mismo sub-flujo** del paso 3 (ej. topper `1 u · S/ 3`). Guardar.
7. **Crear caja y base + regla de empaque.** La caja y la base son **ingredientes** (`SaveIngredient`, `usage = box` / `base`), creados con el mismo sub-flujo de precio (ej. caja `pack 10 · S/ 20`, base `pack 10 · S/ 10`). Luego la regla (`SavePackagingRule`) solo **mapea** rango de peso → qué caja y qué base usar (elige ingredientes ya creados; no define precio).

   ```
   ┌──────────────────────────────────────────┐
   │ Regla de empaque                       ✕  │
   ├──────────────────────────────────────────┤
   │ Desde *  [ 0.5 ] kg   Hasta * [ 1.5 ] kg  │
   │ Caja *   [ Caja Nº 20 ▾ ]                 │
   │ Base *   [ Base cartón 22 cm ▾ ]          │
   ├──────────────────────────────────────────┤
   │                         [ Guardar regla ] │
   └──────────────────────────────────────────┘
   ```

8. **Componer torta (`ComposeCake`).** Elige queque + relleno + cobertura, escribe el **peso** (kg) y elige topper. El sistema **escala** ingredientes y **sugiere** caja + base por la regla que cubre el peso. Muestra el resumen.

   ```
   ┌──────────────────────────────────────────┐
   │ Componer torta                         ✕  │
   ├──────────────────────────────────────────┤
   │ Peso *     [ 1 ] kg                        │
   │ Queque *   [ Queque de vainilla   ▾ ]      │
   │ Relleno *  [ Manjar blanco        ▾ ]      │
   │ Cobertura *[ Chantilly            ▾ ]      │
   │ Topper     [ Feliz cumpleaños     ▾ ]      │
   │ Empaque    Caja Nº 20 + Base 22 cm (auto)  │
   ├──────────────────────────────────────────┤
   │                    [ Generar lista  → ]    │
   └──────────────────────────────────────────┘
   ```

9. **Generar lista de compra (`GenerateShoppingList`).** Tabla agregada (ingredientes sumados + caja + base + topper) con **cantidad y costo proporcional por ítem**, y un **total de materiales** al pie. Emite `CakeComposed` + `ShoppingListGenerated`.

   ```
   ┌──────────────────────────────────────────────────────┐
   │ Lista de compra — Torta 1 kg                      ✕   │
   ├──────────────────────────────────────────────────────┤
   │ Material            Cantidad   Costo    Tipo          │
   │ 🌾 Harina            300 g     S/ 1.50  ingrediente   │
   │ 🥚 Huevos              4 u     S/ 1.60  ingrediente   │
   │ 🍫 Manjar blanco      300 g    S/ 3.00  ingrediente   │
   │ 🍦 Chantilly          200 g    S/ 2.40  ingrediente   │
   │ 📦 Caja Nº 20           1 u     S/ 2.00  empaque       │
   │ 🟫 Base 22 cm           1 u     S/ 1.00  empaque       │
   │ 🎀 Feliz cumpleaños     1 u     S/ 3.00  topper        │
   ├──────────────────────────────────────────────────────┤
   │ Total de materiales                      S/ 14.50     │
   └──────────────────────────────────────────────────────┘
   ```

10. **Cierre.** `CakeComposed` → `RecordProgress(CAKES_COMPOSED, +1)` → Nivel 0 completo → `LevelUp` "Tu recetario está listo" → `FeatureUnlocked(KITCHEN)`. Empieza el Cap. 1.

---

## 10. Casos de uso (Application Services) (`recipe-book/application/use-cases/`)

Una intención = un caso de uso. Son **Application Services delgados**: orquestan el dominio (cargan agregados por repositorio, invocan factories/métodos y domain services, publican el evento) y **no llevan lógica de negocio** —esa vive en los agregados (§4.2) y en los domain services (§5)—. Inyectan repositorios con `inject()`.

| Caso de uso | Entrada → salida | Evento |
|---|---|---|
| `SaveIngredient` | `{ name, baseUnit, usage, purchasePrice: { amount, per } }` → `{ id }` — **da de alta cualquier insumo** (receta, topper, caja o base, según `usage`) | `IngredientSaved` (+ `IngredientRepriced` si fija/cambia precio) |
| `PreviewIngredientCost` | `{ ingredientId, quantity }` → `{ cost: 'S/ 1.50', purchaseReference: '1 kg · S/ 5' }` | — |
| `SaveSpongeRecipe` | `{ name, flavor?, referenceYield, lines }` → `{ id }` | `SpongeRecipeSaved` |
| `SaveFillingRecipe` | `{ name, referenceWeight, lines }` → `{ id }` | `FillingRecipeSaved` |
| `SaveCoveringRecipe` | `{ name, referenceWeight, lines }` → `{ id }` | `CoveringRecipeSaved` |
| `SavePackagingRule` | `{ range, boxIngredientId, baseIngredientId }` → `{ id }` | `PackagingRuleSaved` |
| `ListRecipeBook` | `{ }` → catálogo agrupado por tipo | — |
| `ComposeCake` | `{ name?, targetWeight, spongeId, fillingId, coveringId, topperIngredientId? }` → `CakeComposition` (con empaque resuelto y vista escalada) | `CakeComposed` |
| `GenerateShoppingList` | `{ compositionId }` → `ShoppingList` (cantidades + costo por ítem + `totalCost`) | `ShoppingListGenerated` |

> Nota de orquestación: `SaveIngredient` es **upsert por nombre** —si el insumo existe, actualiza su precio con `Ingredient.repricedTo()`, que registra `IngredientRepriced`—; el caso de uso solo persiste y publica el evento, **no** escribe el histórico (eso lo hace el suscriptor `IngredientPriceRecorder`, §5). `PreviewIngredientCost` es **cálculo vivo**: devuelve el costo y el ghost ya formateados para que la vista los pinte sin replicar la fórmula (memoria `calculos-solo-en-negocio`). `SavePackagingRule` consulta `PackagingRuleOverlapPolicy` (no-solape, §11.2) y valida que `boxIngredientId`/`baseIngredientId` referencien `Ingredient` con `usage` `box`/`base`; los `Save*` validan unicidad de `name` y existencia de referencias vía sus repositorios. `ComposeCake` resuelve el empaque vía `PackagingRule.matches(targetWeight)` y calcula la vista escalada con `CakeScalingService`. `GenerateShoppingList` agrega con `ShoppingListBuilder` (cantidades + costo proporcional + total).

---

## 11. Validaciones

> Dónde vive cada regla importa (Vernon): si solo mira **una instancia**, es invariante de agregado; si cruza **varias instancias** del mismo tipo u otros agregados, es *Policy* o chequeo de Application Service.

Los **criterios de aceptación** del capítulo (cuándo se da por "hecho") están en §3 ("Criterios de hecho") y deben cumplirse junto con las validaciones de abajo.

### 11.1 Invariantes de agregado (dentro del límite, impuestas por factory/métodos)

- **`Ingredient`** (cubre receta, topper, caja y base) — `name` requerido; `baseUnit` ∈ {`g`, `u`}; `usage` ∈ {`recipe`, `topper`, `box`, `base`}; `purchasePrice.amount` > 0; `purchasePrice.per.amount` > 0 (impuesto por el VO `PurchasePrice`).
- **`SpongeRecipe`** — `referenceYield.weight` > 0; `servings` (si se da) > 0; **≥1 línea**; cada `quantity` > 0.
- **`FillingRecipe` / `CoveringRecipe`** — `referenceWeight` > 0; **≥1 línea**; cada `quantity` > 0.
- **`PackagingRule`** — `range.min` ≥ 0; `range.max` > `range.min`.

### 11.2 Invariantes set-based y referenciales (fuera del agregado)

No pueden ser invariantes de una entidad porque abarcan la colección u otros agregados. Se aplican en **Application Service** (chequeo vía repositorio) o **Domain Policy**:

- **Unicidad de `name`** (recetas e ingredientes —incluidos topper, caja y base—; case-insensitive) — chequeo en el caso de uso `Save*` vía `*Repository` (patrón `byName`).
- **No-solape de bandas de empaque** — `PackagingRuleOverlapPolicy` consultada por `SavePackagingRule`.
- **Existencia de referencias** — los `ingredientId` de una receta deben existir; `boxIngredientId`/`baseIngredientId` deben referenciar un `Ingredient` con el `usage` correcto (`box`/`base`); el topper de una composición debe ser un `Ingredient` con `usage = topper`. Se valida en el `Save*`/`ComposeCake` correspondiente.
- **`ComposeCake`** — `targetWeight` > 0; queque, relleno y cobertura seleccionados; si **ninguna** `PackagingRule` cubre `targetWeight` → avisar: *"No hay caja para este peso. Define una regla de empaque que lo cubra."* (bloquea la composición hasta resolver).
- **`GenerateShoppingList`** — requiere una `CakeComposition` completa (empaque resuelto).

### 11.3 Transversales (de `diseno_pantallas_flujos.md` §8.2)

- Validación **on-blur**, no por tecla; el error aparece **bajo el campo** con icono + texto que dice **causa + cómo arreglar**.
- Tras enviar con error: foco al **primer campo inválido**; resumen arriba si hay varios.
- Números no aceptan letras; cantidades y pesos **no negativos**; desplegables alimentados por el catálogo.
- **Precio de compra:** validación on-blur; `precio` > 0 con formato moneda `S/`; `presentación` (cantidad comprada) > 0 en la unidad base del insumo. El error dice causa + cómo arreglar (ej. "El precio debe ser mayor que 0").
- `aria-live`/`role="alert"` para anunciar errores; autosave de borrador en formularios largos; confirmar al descartar con cambios.

---

> **Recordatorio de la Regla de oro.** Mientras el Cap 0 no esté **desarrollado en código fuente y validado**, **no se escribe** la documentación del Capítulo 1.
