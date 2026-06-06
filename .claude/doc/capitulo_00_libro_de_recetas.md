# Capítulo 0 — El libro de recetas en blanco

> **Documento de capítulo.** Es la fuente de verdad de *este* capítulo y nada más. Autocontenido y aislado: describe solo lo que hace el Cap 0; no toca ni asume otros capítulos (ver la Regla de oro en `historia_y_fases.md`, Parte 3).
>
> **Convención.** Identificadores que existirán en código, en **inglés** (bounded context, entidades, casos de uso, eventos, `Feature`s, escenas); narrativa, diálogos y textos de interfaz, en **español**.
>
> **Alcance.** Fase 0 (preludio). Ariana arma su **recetario modular**, **compone una torta** escalada por el peso del queque y obtiene su **lista de compra**. Sin dinero, sin inventario, sin precios — eso llega con el relato (Cap. 1+).

---

## 1. Narrativa

Antes de hornear nada, Ariana tiene un sueño concreto: hacer una **torta de verdad** —no un bizcocho pelado, sino la de capas, con relleno, cobertura, un topper y su caja bonita—. Abre su libro de recetas y está **en blanco**. Y cae en cuenta de algo: una torta no es *una* receta. Es una **base (el queque)**, un **relleno**, una **cobertura** y los **complementos** (caja, base, topper).

Así que empieza a escribir. Primero su **queque**: los ingredientes y **cuánto rinde** (1 kg, alcanza para X porciones) —esa es su medida de referencia—. Luego un **relleno**, suficiente para ese kilo. Luego una **cobertura**. Su libro deja de estar vacío: tiene un pequeño **recetario modular**.

Ahora **compone su primera torta** sobre el papel: *este* queque + *este* relleno + *esta* cobertura, para 1 kg. El libro hace las cuentas —escala relleno y cobertura al peso del queque—, le **sugiere la caja y la base** del tamaño correcto, y ella **elige un topper** para decorar. Al final sale una **lista**: qué necesita y cuánto. Si mañana quiere la misma torta de 2 kg, todo se **recalcula** solo.

No compra nada todavía, no piensa en plata. Solo sabe, por primera vez, **exactamente qué es su torta y qué lleva**. Con esa lista en la mano, está lista para empezar.

**Costura con el Capítulo 1.** El Cap 0 es el preludio tranquilo. El Cap. 1 ("La cocina vacía") queda intacto en su emoción y se lee como la continuación natural: *ya sé mi receta y qué necesito; ahora horneo de verdad y siento que lo hice yo*.

---

## 2. Diálogos de ayuda (coach mínimo)

Coaching mínimo: 1–2 frases del **Chef Coach** (globo + `GuideCursor`) por paso clave, más **hints** persistentes bajo los campos. Textos en español, listos para i18n. Claves bajo `recipe_book.*`.

### 2.1 Diálogos del coach (`recipe_book.coach.*`)

| Clave | Momento | Texto |
|---|---|---|
| `coach.intro` | Al terminar `flyIn`, en la cocina | "Bienvenida a tu cocina. Antes de hornear, armemos tu libro de recetas." |
| `coach.create_sponge` | Abre el libro vacío | "Empieza por tu **queque**: anota sus ingredientes y cuánto rinde (en kilos). Ese peso manda todo lo demás." |
| `coach.create_filling` | Tras guardar el queque | "Ahora un **relleno**. Dime para cuánto rinde y lo escalo solo con el queque." |
| `coach.create_covering` | Tras guardar el relleno | "Una **cobertura** para terminar la torta." |
| `coach.create_topper` | Tras guardar la cobertura | "Un **topper** para decorar — es como un ingrediente más." |
| `coach.create_packaging_rule` | Tras guardar el topper | "¿Qué **caja y base** usas según el peso? Anótalo una vez y yo lo sugiero solo." |
| `coach.compose` | Catálogo con lo mínimo listo | "Arma tu torta: elige queque, relleno y cobertura, y dime el peso. Yo hago las cuentas." |
| `coach.shopping_list` | Tras componer | "Lista lista. Esto es lo que necesitas comprar. ¡Ya puedes empezar!" |

### 2.2 Hints de campo (`recipe_book.<form>.<field>_hint`)

| Clave | Texto |
|---|---|
| `sponge.yield_weight_hint` | "Cuánto rinde tu queque, en kilos (ej. 1 kg). Es la medida base para escalar todo." |
| `sponge.line_quantity_hint` | "Cantidad para el rinde de arriba (ej. 250 g de harina por 1 kg de queque)." |
| `filling.reference_weight_hint` | "Para cuánto queque rinde este relleno (ej. suficiente para 1 kg)." |
| `covering.reference_weight_hint` | "Para cuánto queque rinde esta cobertura (ej. suficiente para 1 kg)." |
| `packaging_rule.range_hint` | "Rango de peso de la torta. Para ese rango, qué caja y qué base usar." |
| `compose.target_weight_hint` | "Peso de la torta que quieres armar, en kilos. Todo se recalcula a este peso." |

---

## 3. Objetivo del capítulo

**Señal de avance (medible):** `CAKES_COMPOSED ≥ 1` — componer **una** torta completa y generar su lista de compra.

Como el catálogo arranca **vacío**, componer una torta exige haber creado antes **todos** los tipos (queque, relleno, cobertura, topper y al menos una regla de empaque que cubra el peso). Por eso una sola meta cubre toda la construcción del recetario.

**Al cumplirse:** se cierra el **Nivel 0** y se desbloquea `Feature.KITCHEN` (el flujo de cocinar del Capítulo 1).

Criterios de "hecho":
- Existe ≥1 `SpongeRecipe`, ≥1 `FillingRecipe`, ≥1 `CoveringRecipe`, ≥1 `Topper` y ≥1 `PackagingRule`.
- Existe ≥1 `CakeComposition` completa con su empaque sugerido resuelto.
- Se generó su `ShoppingList`.

---

## 4. Modelo de dominio

Bounded context **`recipe-book`**, autocontenido. Reutiliza value objects compartidos de `_common`: `EntityId`, `Quantity` (`baseUnit`: `g` | `u`). No hereda el `Recipe` monolítico legado.

### 4.1 Value objects

- **`IngredientLine`** — línea de receta: `{ ingredientId: EntityId, quantity: Quantity }`, expresada al **peso de referencia** de su receta.
- **`RecipeYield`** — rinde de referencia del queque: `{ weight: Quantity /* en g */, servings?: number }`. Identidad por valor.
- **`WeightRange`** — banda de peso para empaque: `{ min: Quantity, max: Quantity }`; invariante `max > min`.

### 4.2 Entidades y agregados

El contexto tiene **8 agregados pequeños** (Regla 2 de Vernon). Cada raíz se persiste por separado, referencia a las demás **solo por identidad** (Regla 3) y protege sus propias invariantes dentro de su límite (Regla 1).

| Agregado raíz | Miembros internos | Referencias (solo por id) | Comportamiento clave |
|---|---|---|---|
| `Ingredient` | — | — | — |
| `SpongeRecipe` (queque) | `IngredientLine[]`, `RecipeYield` | `Ingredient` (`ingredientId` en cada línea) | `addLine`, `changeYield` |
| `FillingRecipe` (relleno) | `IngredientLine[]` | `Ingredient` | `addLine` |
| `CoveringRecipe` (cobertura) | `IngredientLine[]` | `Ingredient` | `addLine` |
| `Topper` | — | — | — |
| `PackagingItem` | — | — | — |
| `PackagingRule` | `WeightRange` (VO) | `PackagingItem` (`boxId`, `baseId`) | `matches(weight): boolean` |
| `CakeComposition` (la torta) | — | `Sponge/Filling/CoveringRecipe`, `Topper`, `PackagingItem` (todo por id) | `recompose(targetWeight)` |

Campos por agregado:

- **`Ingredient`** — `{ id: EntityId, name, baseUnit: 'g' | 'u' }`. Materia prima referenciada por las recetas. **Necesita identidad** porque la `ShoppingList` agrega por `ingredientId`.
- **`SpongeRecipe`** — `{ id, name, flavor?, referenceYield: RecipeYield, lines: IngredientLine[] }`. **Define el peso de referencia** que gobierna el escalado de toda la torta.
- **`FillingRecipe`** — `{ id, name, referenceWeight: Quantity /* g */, lines: IngredientLine[] }`. Cantidades por ese peso de referencia.
- **`CoveringRecipe`** — misma forma que `FillingRecipe` (mismo rol: capa escalada por peso).
- **`Topper`** — `{ id, name }`. Ítem de decoración elegido a mano.
- **`PackagingItem`** — `{ id, name, type: 'box' | 'base' }`.
- **`PackagingRule`** — `{ id, range: WeightRange, boxId, baseId }`. `matches(weight)` → `range.min ≤ weight ≤ range.max`.
- **`CakeComposition`** — `{ id, name?, targetWeight: Quantity /* g */, spongeRecipeId, fillingRecipeId, coveringRecipeId, topperId?, suggestedBoxId, suggestedBaseId }`.

**Creación y comportamiento (evitar Anemic Domain Model).** Cada raíz se crea con una **factory** que impone sus invariantes (`SpongeRecipe.create(...)`, etc.) y se modifica con **métodos de intención de negocio** (`addLine`, `changeYield`, `recompose`), nunca con setters públicos. Las invariantes de una sola instancia viven en el agregado (§11.1); las que cruzan varias instancias, fuera (§11.2).

- **`ShoppingList`** — **no es agregado**: es una **proyección / read model** (estilo CQRS) derivada de una `CakeComposition` + sus recetas. No se persiste como transacción ni tiene repositorio. `items: ShoppingListItem[]`.
  - **`ShoppingListItem`** — `{ name, totalQuantity: Quantity, category: 'ingredient' | 'packaging' | 'topper' }`. **Solo cantidades** — sin precios ni stock.

### 4.3 Escalado (cálculo vivo)

El peso objetivo de la composición (`targetWeight`) gobierna todo:

```
factorSponge   = targetWeight / sponge.referenceYield.weight
factorFilling  = targetWeight / filling.referenceWeight
factorCovering = targetWeight / covering.referenceWeight
```

- Cada `IngredientLine` se multiplica por el factor de su receta (`quantity.scaleBy(factor)`).
- Los ingredientes se **agregan por `ingredientId`** sumando cantidades (mismo insumo en queque + relleno + cobertura suma en una sola línea).
- **Empaque:** `PackagingRule.matches(targetWeight)` → caja + base (1 c/u).
- **Topper:** 1 por torta (ítem de conteo, no escala por peso).

> **A confirmar en revisión:** el topper se modela como ítem `count = 1` (no escala por peso). Si debe escalar con el tamaño, se ajusta a un modelo por banda como el empaque.

El escalado es **cálculo vivo**: se recalcula al cambiar `targetWeight` o cualquier receta. La `ShoppingList` se materializa al generarla (lectura de la composición actual); el Cap 0 no congela transacciones porque aún no hay compra ni dinero.

---

## 5. Bounded context

Contexto único **`recipe-book`** (Core Domain del capítulo) con estructura DDD:

```
core/recipe-book/
├── domain/
│   ├── entities/         ← Ingredient, SpongeRecipe, FillingRecipe, CoveringRecipe,
│   │                        Topper, PackagingItem, PackagingRule, CakeComposition
│   ├── value-objects/    ← IngredientLine, RecipeYield, WeightRange
│   ├── repositories/     ← un contrato por agregado raíz (ver abajo)
│   └── services/         ← CakeScalingService, PackagingRuleOverlapPolicy, ShoppingListBuilder
├── application/
│   └── use-cases/        ← ver §10
└── infrastructure/       ← repos concretos (almacén local), mappers
```

**Un repositorio por agregado raíz** (Vernon). `ShoppingList` **no** tiene repositorio (es proyección):

`IngredientRepository`, `SpongeRecipeRepository`, `FillingRecipeRepository`, `CoveringRecipeRepository`, `TopperRepository`, `PackagingItemRepository`, `PackagingRuleRepository`, `CakeCompositionRepository`.

**Domain services** (operaciones que no pertenecen a un solo agregado, sin estado):
- `CakeScalingService` — escala las recetas al `targetWeight`. Es servicio (no método de `CakeComposition`) porque necesita queque + relleno + cobertura **cargados**, y un agregado no debe cargar otros agregados.
- `PackagingRuleOverlapPolicy` — valida la invariante *set-based* de no-solape entre bandas (§11.2).
- `ShoppingListBuilder` — proyecta la `ShoppingList` (proyector de read model).

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

### 6.1 Qué dispara el progreso

| Evento de dominio (`recipe-book`) | `RecordProgress` | `mode` | `value` |
|---|---|---|---|
| `CakeComposed { compositionId }` | `CAKES_COMPOSED` | INCREMENT | +1 |

Tras `RecordProgress`, `EvaluateLevelUp` cierra el Nivel 0 → `LevelAdvanced { 0 → 1, forced: false }` + `FeatureUnlocked { KITCHEN }`.

### 6.2 Eventos de dominio del contexto

Convención: nombre en pasado, inglés, payload mínimo.

- `IngredientSaved { ingredientId, isNew }`
- `SpongeRecipeSaved { recipeId, isNew }`
- `FillingRecipeSaved { recipeId, isNew }`
- `CoveringRecipeSaved { recipeId, isNew }`
- `TopperSaved { topperId, isNew }`
- `PackagingItemSaved { itemId, isNew }`
- `PackagingRuleSaved { ruleId }`
- `CakeComposed { compositionId }` ← **único que mueve la meta**
- `ShoppingListGenerated { compositionId, itemCount }`

`progression` solo se suscribe a `CakeComposed`. Los demás existen para el mundo (reacciones del chef, contadores visuales) y auditoría.

---

## 7. Representación del mundo 3D

Escena **`WorldScene.KITCHEN`** (la cocina de casa). El Cap 0 vive entero aquí.

- **Arranque `flyIn()`** — secuencia cinemática ciudad → casa → cocina; al terminar, el chef toma la guía (`coach.intro`).
- **Estación `KitchenStation.RECIPE_BOARD`** — el libro de recetas. Es la entrada del Cap 0 ("elegir **y crear** recetas", según el diseño del mundo). `focusStation(RECIPE_BOARD)` acerca la cámara y posiciona al chef; `resetView()` al cerrar el overlay.
- Las estaciones `PANTRY` y `OVEN` existen en la escena pero **inertes** en el Cap 0 (su acción se desbloquea con `KITCHEN`, Cap. 1).

### 7.1 Motor y assets

- **Three.js** + `GLTFLoader` con `DRACOLoader`, cargando `3dmodel/kitchen/kitchen.glb` (Draco + texturas WebP). Layout y materiales en `3dmodel/kitchen/scene_layout.json` y `scene_objects.json`.
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
| **Form Field** | Formularios de queque, relleno, cobertura, topper, regla de empaque y composición. Label visible, input ≥44px, validación on-blur. |
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
  → SaveSpongeRecipe → SaveFillingRecipe → SaveCoveringRecipe → SaveTopper → SavePackagingRule
  → ComposeCake (elige queque+relleno+cobertura, peso kg, topper; sugiere caja/base)
  → GenerateShoppingList → CakeComposed → ✔ Nivel 0 → LevelUp → desbloquea KITCHEN
```

**Detalle por paso:**

1. **Arranque.** `flyIn` → vista de cocina → `coach.intro`.
2. **Abrir el libro.** Tap `RECIPE_BOARD` → `focusStation` + overlay "Mi libro de recetas". Secciones: *Queques · Rellenos · Coberturas · Toppers · Empaques · Componer*. Todo vacío → `EmptyState` con CTA "Crea tu primer queque".
3. **Crear queque (`SaveSpongeRecipe`).** Nombre, sabor (opcional), **rinde** (peso en kg + porciones opcionales) y líneas de ingrediente (insumo + cantidad para ese rinde). Al añadir un insumo nuevo se crea un `Ingredient` (`SaveIngredient`). Guardar → `Toast`.

   ```
   ┌──────────────────────────────────────────┐
   │ Nuevo queque                           ✕  │
   ├──────────────────────────────────────────┤
   │ Nombre *        [ Queque de vainilla   ]  │
   │ Rinde *         [ 1     ] kg   [ 8 ] porc.│
   │ Ingredientes *                            │
   │   [ Harina  ▾ ]  [ 250 ] g           [+]  │
   │   [ Huevos  ▾ ]  [ 4   ] u           [−]  │
   ├──────────────────────────────────────────┤
   │                        [ Guardar queque ] │
   └──────────────────────────────────────────┘
   ```

4. **Crear relleno (`SaveFillingRecipe`).** Nombre, **peso de referencia** (para cuánto queque rinde) y líneas de ingrediente. Guardar.
5. **Crear cobertura (`SaveCoveringRecipe`).** Igual que el relleno.
6. **Crear topper (`SaveTopper`).** Nombre. Guardar.
7. **Crear regla de empaque (`SavePackagingItem` + `SavePackagingRule`).** Define caja y base (ítems) y la regla: rango de peso → caja + base.

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

9. **Generar lista de compra (`GenerateShoppingList`).** Tabla agregada (ingredientes sumados + caja + base + topper), **solo cantidades**. Emite `CakeComposed` + `ShoppingListGenerated`.

   ```
   ┌──────────────────────────────────────────┐
   │ Lista de compra — Torta 1 kg           ✕  │
   ├──────────────────────────────────────────┤
   │ Material            Cantidad   Tipo       │
   │ 🌾 Harina            250 g     ingrediente│
   │ 🥚 Huevos              4 u     ingrediente│
   │ 🍫 Manjar blanco      300 g    ingrediente│
   │ 🍦 Chantilly          200 g    ingrediente│
   │ 📦 Caja Nº 20           1 u     empaque    │
   │ 🟫 Base 22 cm           1 u     empaque    │
   │ 🎀 Feliz cumpleaños     1 u     topper     │
   └──────────────────────────────────────────┘
   ```

10. **Cierre.** `CakeComposed` → `RecordProgress(CAKES_COMPOSED, +1)` → Nivel 0 completo → `LevelUp` "Tu recetario está listo" → `FeatureUnlocked(KITCHEN)`. Empieza el Cap. 1.

---

## 10. Casos de uso (`recipe-book/application/use-cases/`)

Una intención = un caso de uso. Inyectan repositorios con `inject()` y publican su evento de dominio al terminar.

| Caso de uso | Entrada → salida | Evento |
|---|---|---|
| `SaveIngredient` | `{ name, baseUnit }` → `{ id }` | `IngredientSaved` |
| `SaveSpongeRecipe` | `{ name, flavor?, referenceYield, lines }` → `{ id }` | `SpongeRecipeSaved` |
| `SaveFillingRecipe` | `{ name, referenceWeight, lines }` → `{ id }` | `FillingRecipeSaved` |
| `SaveCoveringRecipe` | `{ name, referenceWeight, lines }` → `{ id }` | `CoveringRecipeSaved` |
| `SaveTopper` | `{ name }` → `{ id }` | `TopperSaved` |
| `SavePackagingItem` | `{ name, type }` → `{ id }` | `PackagingItemSaved` |
| `SavePackagingRule` | `{ range, boxId, baseId }` → `{ id }` | `PackagingRuleSaved` |
| `ListRecipeBook` | `{ }` → catálogo agrupado por tipo | — |
| `ComposeCake` | `{ name?, targetWeight, spongeId, fillingId, coveringId, topperId? }` → `CakeComposition` (con empaque resuelto y vista escalada) | `CakeComposed` |
| `GenerateShoppingList` | `{ compositionId }` → `ShoppingList` | `ShoppingListGenerated` |

> Nota de orquestación: `SavePackagingRule` consulta `PackagingRuleOverlapPolicy` (no-solape, §11.2); los `Save*` validan unicidad de `name` y existencia de referencias vía sus repositorios. `ComposeCake` resuelve el empaque vía `PackagingRule.matches(targetWeight)` y calcula la vista escalada con `CakeScalingService`. `GenerateShoppingList` agrega con `ShoppingListBuilder`.

---

## 11. Validaciones

> Dónde vive cada regla importa (Vernon): si solo mira **una instancia**, es invariante de agregado; si cruza **varias instancias** del mismo tipo u otros agregados, es *Policy* o chequeo de Application Service.

### 11.1 Invariantes de agregado (dentro del límite, impuestas por factory/métodos)

- **`Ingredient`** — `name` requerido; `baseUnit` ∈ {`g`, `u`}.
- **`SpongeRecipe`** — `referenceYield.weight` > 0; `servings` (si se da) > 0; **≥1 línea**; cada `quantity` > 0.
- **`FillingRecipe` / `CoveringRecipe`** — `referenceWeight` > 0; **≥1 línea**; cada `quantity` > 0.
- **`Topper`** — `name` requerido.
- **`PackagingItem`** — `name` requerido; `type` ∈ {`box`, `base`}.
- **`PackagingRule`** — `range.min` ≥ 0; `range.max` > `range.min`.

### 11.2 Invariantes set-based y referenciales (fuera del agregado)

No pueden ser invariantes de una entidad porque abarcan la colección u otros agregados. Se aplican en **Application Service** (chequeo vía repositorio) o **Domain Policy**:

- **Unicidad de `name`** (recetas, topper, ingrediente; case-insensitive) — chequeo en el caso de uso `Save*` vía `*Repository` (patrón `byName`).
- **No-solape de bandas de empaque** — `PackagingRuleOverlapPolicy` consultada por `SavePackagingRule`.
- **Existencia de referencias** — los `ingredientId` de una receta deben existir; `boxId`/`baseId` deben referenciar un `PackagingItem` del `type` correcto (`box`/`base`). Se valida en el `Save*` correspondiente.
- **`ComposeCake`** — `targetWeight` > 0; queque, relleno y cobertura seleccionados; si **ninguna** `PackagingRule` cubre `targetWeight` → avisar: *"No hay caja para este peso. Define una regla de empaque que lo cubra."* (bloquea la composición hasta resolver).
- **`GenerateShoppingList`** — requiere una `CakeComposition` completa (empaque resuelto).

### 11.3 Transversales (de `diseno_pantallas_flujos.md` §8.2)

- Validación **on-blur**, no por tecla; el error aparece **bajo el campo** con icono + texto que dice **causa + cómo arreglar**.
- Tras enviar con error: foco al **primer campo inválido**; resumen arriba si hay varios.
- Números no aceptan letras; cantidades y pesos **no negativos**; desplegables alimentados por el catálogo.
- `aria-live`/`role="alert"` para anunciar errores; autosave de borrador en formularios largos; confirmar al descartar con cambios.

---

> **Recordatorio de la Regla de oro.** Mientras el Cap 0 no esté **desarrollado en código fuente y validado**, **no se escribe** la documentación del Capítulo 1.
