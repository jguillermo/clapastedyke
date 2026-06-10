# De una cocina en casa a una gran empresa — la historia de Ariana y sus fases

Esta es la **guía macro** del proyecto. No define flujos de trabajo ni pantallas: cuenta la **historia de superación** que el jugador vive —de una repostera que hornea en su casa a la dueña de una empresa— y, de esa historia, **deriva las fases** por las que pasa el negocio.

El orden es deliberado: **primero la historia, después las fases**. Cada fase nace de un **dolor sentido** dentro del relato, no de un menú de funciones. Ariana no "activa la gestión de clientes": *se cansa de no recordar quién le pidió qué*. No "habilita el inventario": *se le acaba la harina a mitad de un pedido*. La función aparece como **respuesta a una necesidad de la historia**. Eso es la divulgación progresiva, contada desde la emoción.

> **Convención de implementación.** El código se escribe en **inglés** (bounded contexts, entidades, casos de uso, eventos, `Feature`s, escenas); los comentarios y textos de interfaz, en **español**. En este documento, todo identificador que existirá en el código va en inglés y su descripción en español.

> **Fuentes hermanas.** La definición técnica del dominio vive en `plan_de_negocio.md` (entidades, casos de uso, eventos, motor de `progression`); la representación en el mundo 3D, en `diseno_mundo_juego.md`; el lenguaje visual, en la suite de diseño visual (aún por crear). Esta guía es el **mapa que las une** y la fuente de verdad de **qué etapa es cada cosa**.

> **Nota.** `flujos.md` describe un producto anterior en Google Sheets y queda como **legado histórico**, no como definición vigente.

---

## Parte 0 — Cómo leer esta guía

- **Parte 1 (la historia)** es el relato continuo de Ariana, a profundidad. Es el "porqué" de todo lo que el sistema hace. Léela como una novela corta de superación.
- **Parte 2 (las fases)** traduce cada capítulo en una **fase del juego**, con una ficha macro uniforme. No hay detalle de flujo aquí: el flujo de trabajo paso a paso de cada fase irá en **archivos de entregable separados**, uno por fase.
- **Parte 3** explica cómo se avanza entre fases y qué queda fuera de esta guía.

La historia decidió una **Fase 0 (preludio)** y **17 fases**, agrupadas en **4 actos**. La Fase 0 es el arranque: antes de vender nada, Ariana arma su **recetario modular** y aprende a **componer una torta** (queque + relleno + cobertura + empaque + topper) y a sacar su **lista de compra**. Algunas funciones del plan técnico (costos indirectos, estados de pedido) no son una fase aparte: se absorben dentro del capítulo donde realmente duelen.

---

# Parte 1 — La historia de Ariana

## Acto I · La pasión en casa

### Capítulo 0 — El libro de recetas en blanco (preludio)

Antes de hornear nada, Ariana tiene un sueño concreto: hacer una **torta de verdad** —no un bizcocho pelado, sino la de capas, con relleno, cobertura, un topper y su caja bonita—. Abre su libro de recetas y está **en blanco**. Y cae en cuenta de algo: una torta no es *una* receta. Es una **base (el queque)**, un **relleno**, una **cobertura** y los **complementos** (caja, base, topper).

Así que empieza a escribir. Primero su **queque**: los ingredientes y **cuánto rinde** (1 kg, alcanza para X porciones) —esa es su medida de referencia—. Luego un **relleno**, suficiente para ese kilo. Luego una **cobertura**. Su libro deja de estar vacío: tiene un pequeño **recetario modular**.

Ahora **compone su primera torta** sobre el papel: *este* queque + *este* relleno + *esta* cobertura, para 1 kg. El libro hace las cuentas —escala relleno y cobertura al peso del queque—, le **sugiere la caja y la base** del tamaño correcto, y ella **elige un topper** para decorar. Al final sale una **lista**: qué necesita y cuánto. Si mañana quiere la misma torta de 2 kg, todo se **recalcula** solo.

No compra nada todavía, no piensa en plata. Solo sabe, por primera vez, **exactamente qué es su torta y qué lleva**. Con esa lista en la mano, está lista para empezar.

### Capítulo 1 — La cocina vacía y el libro de recetas

Ariana siempre quiso hornear. Una noche, después del trabajo, abre la única cosa que tiene en su cocina pequeña: su **libro de recetas**. No hay clientes, no hay pedidos, no hay nada que vender. Solo ella, sus ganas y unas recetas escritas a mano.

Elige una: **torta de chocolate**. La receta le dice qué necesita. Mira su alacena: ¿tengo harina?, ¿tengo huevos? Sí, le alcanza. Se pone el delantal, mezcla, hornea. La casa se llena de olor a chocolate. Saca su **primera creación** del horno y siente algo que no sentía hace tiempo: *lo hizo ella*.

No piensa en dinero. No piensa en costos. Solo cocinó algo rico con lo que tenía. Así de simple empieza todo.

### Capítulo 2 — El primer aplauso

La torta se ve hermosa. Antes de que la familia la devore, Ariana le **toma fotos** y las sube a sus redes sociales. No espera nada.

Pero llegan los "me gusta". Una prima comenta "¡se ve increíble!". Su tía pregunta, medio en broma, "¿y eso se vende?". La familia se come la torta esa misma noche —no quedó ni una miga— pero a Ariana ya no le importa la torta: le importa que **a la gente le gustó**.

Anima a seguir. Hornea otra cosa, la fotografía, la publica. Y otra. Su pequeña página empieza a tener **seguidores y reputación**. Todavía no ha vendido nada, pero ya tiene algo más valioso para empezar: gente mirando.

### Capítulo 3 — El primer encargo (y el primer billete)

Pasa lo inevitable: una vecina le escribe por mensaje. *"Ariana, vi tus tortas. ¿Me haces una para el cumple de mi hija el sábado?"*. Es un **pedido informal** —sin contrato, sin nada, un favor que se paga—, pero es **real**.

Ariana revisa qué necesita para esa torta y descubre un problema: **le falta harina**. No tiene suficiente. Por primera vez aparece el botón **"pedir mercadería"**: pide lo que le falta. Al rato **llega el delivery** con la harina, y esa mercadería **entra a su almacén**. Ahora sí: tiene todo.

Prepara la torta con cariño, la entrega el sábado… y la vecina le **paga**. Ariana sostiene su **primer billete ganado horneando**. No es mucho. Pero algo cambió para siempre: lo que era un hobby acaba de cobrar por primera vez. *Esto podría ser un negocio.*

---

## Acto II · Esto se está volviendo serio

### Capítulo 4 — El recetario crece

El boca a boca corre. La vecina cuenta, la prima comparte, y de pronto le preguntan por cosas que Ariana ni hacía: *"¿haces cupcakes?", "¿tienes algo sin azúcar?", "¿galletas decoradas?"*.

Ariana entiende que con una sola receta no llega lejos. Empieza a **ampliar su repertorio**: agrega cupcakes, cheesecake, galletas. Su libro de recetas, que tenía una página, ahora tiene varias. **Más variedad = más gente interesada**. El catálogo deja de ser un detalle y se vuelve su carta de presentación.

### Capítulo 5 — "¿Quién me pidió qué?"

Con más productos llegan más pedidos. Un viernes Ariana tiene **seis encargos a la vez** y se le hace un nudo: ¿la torta de fresa era para Lucía o para la señora del segundo piso? ¿El número de quién pidió cupcakes? Anota todo en papelitos… que pierde.

El día que le entrega el pedido equivocado a la persona equivocada, **toca fondo con el desorden**. Se da cuenta de que necesita **registrar a sus clientes**: nombre, teléfono, qué pidieron. Nace su libreta de clientes. Ya no es "una señora me pidió algo": es **Lucía, 999-000-111, torta de fresa para el 12**.

### Capítulo 6 — "Se me acabó la harina"

Ariana, envalentonada, acepta **tres pedidos para el mismo fin de semana**. A mitad del segundo, abre el saco de harina y… **está vacío**. No le alcanza. No hay tiempo de pedir más. Un cliente, molesto, **cancela**. Otro, paciente, **confirma** y espera al lunes.

Le duele perder ese pedido. Y aprende la lección a la mala: **tiene que mirar su stock antes de aceptar**. Empieza a llevar control de lo que tiene, lo que está por agotarse y lo que ya se acabó —un **semáforo** mental: rojo, amarillo, verde— y a comprar a tiempo. El inventario deja de ser "lo que veo en la alacena" y se vuelve algo que **controla a propósito**. Los pedidos también ganan estados claros: pendiente, confirmado, cancelado.

### Capítulo 7 — "¿A cuánto lo vendo?"

Una clienta le encarga una torta enorme para **30 personas** y le pregunta el precio. Ariana abre la boca para improvisar un número… y se da cuenta de que **nunca supo cuánto cobrar**. Venía poniendo precios "a ojo", y haciendo cuentas honestas descubre algo feo: **en varios pedidos casi no ganó nada, o perdió**.

Se sienta con papel y lápiz. Suma cuánto cuestan los ingredientes de esa torta, cuántas **horas de su trabajo** le toma, el empaque, y cuánto quiere **ganar de verdad**. Por primera vez arma un **presupuesto**: precio = costo + margen. Deja de regalar su talento. Ahora, cuando alguien pregunta "¿cuánto?", Ariana **lo sabe**.

---

## Acto III · La pastelería de verdad

### Capítulo 8 — La tienda física

La cocina de casa ya no da más. Huele a torta a toda hora, la familia reclama el horno, las cajas invaden la sala. Pero Ariana tiene algo que no tenía: **clientes fijos, precios que le dan ganancia y ahorros**.

Con eso, da el salto que soñaba: **alquila un localcito** y abre su pequeña pastelería. El mundo se abre con ella —de la cocina de casa al **pueblo**—: una vitrina, un mostrador, gente que entra a mirar y a comprar sin haber encargado. Ariana ya no hornea a escondidas: **tiene una tienda con su nombre en la puerta**.

### Capítulo 9 — Proveedores de verdad

Comprar harina en el súper de la esquina, bolsa por bolsa, ya no le rinde: paga de más y se queda corta. Conoce a un **proveedor mayorista**, "Molinos SAC", que le da mejor precio si compra en volumen y con **factura**.

Ariana arma su lista de **proveedores de confianza**, les pide por WhatsApp, compara precios y **compra formal**. Su materia prima deja de ser una carrera de último minuto y se vuelve una **cadena de abastecimiento** que planifica.

### Capítulo 10 — Formalizarse

El negocio crece y la informalidad empieza a apretar: clientes que piden **boleta**, el proveedor que factura, el miedo a un problema legal. Ariana **saca su RUC** y formaliza la pastelería.

Aparece el **IGV**: ahora sus precios llevan impuesto, sus ventas dejan rastro y el negocio existe **ante la ley**. Da un poco de vértigo, pero es la señal de que esto ya es serio.

### Capítulo 11 — Lo que se echa a perder

Con más volumen aparece un enemigo nuevo: lo que **se pierde sin venderse**. Crema que se corta, fruta que se pasa, cajas que se aplastan, insumos que **se vencen** al fondo de la repisa.

Ariana descubre la **merma**: stock que se va a la basura y se lleva su ganancia con él. Aprende a **registrar las pérdidas** (merma, daño, vencimiento), a revisar fechas y a no sobre-comprar. Empieza a cuidar su inventario como cuida su caja.

---

## Acto IV · El sueño de la empresa

### Capítulo 12 — "No doy abasto"

Llega una semana con **diez pedidos grandes** y Ariana, con sus dos manos y su hornito, no llega. Trabaja de madrugada, duerme poco, la calidad empieza a temblar.

Decide **invertir en equipamiento**: una batidora industrial, un horno más grande, moldes en cantidad. De pronto puede **producir en lote** —hacer ocho tortas a la vez en lugar de una— y lo que antes la ahogaba ahora fluye.

### Capítulo 13 — "Necesito manos"

Ni con el mejor horno alcanza: el cuello de botella ahora es **ella misma**. Por primera vez **contrata a alguien** —una ayudante— y aprende algo difícil para quien empezó sola: **delegar**.

Reparte la producción, enseña sus recetas, organiza turnos y **paga su primer sueldo**. Ariana deja de ser "la que hace todo" para empezar a ser **la que dirige**.

### Capítulo 14 — Que llegue a todos

Sus clientes ya no son solo del barrio: le escriben de toda la ciudad. Montar **delivery** se vuelve natural —reparto a domicilio, zonas, costo de envío— y su alcance se multiplica.

Una torta de Ariana ahora puede llegar a la otra punta de la ciudad. El negocio **rompe las paredes** de su local.

### Capítulo 15 — Que me conozcan

Para crecer en serio, ya no basta el boca a boca. Ariana **invierte en marketing**: campañas, publicaciones pagadas, promociones. Su marca empieza a sonar fuera de su círculo y la **popularidad** que arrancó en el Capítulo 2 ahora se cultiva a propósito, como una palanca de crecimiento.

### Capítulo 16 — Las cuentas claras

Con empleados, proveedores, delivery y marketing, el dinero entra y sale por todos lados. Ariana ya no puede **"sentir"** si gana: necesita **verlo**. Se sienta con sus **finanzas** —ingresos, gastos, sueldos, impuestos mensuales, utilidad real— y por fin entiende, con números, **cuánto gana su empresa**.

Ya no es una repostera con suerte: es una **administradora** que toma decisiones con datos.

### Capítulo 17 — Más de una tienda

Su pastelería funciona, es rentable y conocida. Ariana mira el local lleno y se atreve con el sueño que parecía imposible al principio: **abrir una segunda sucursal**. Luego una tercera. Replica lo que aprendió —recetas, precios, proveedores, equipo— en cada nueva tienda.

La chica que una noche horneó una torta con lo que tenía en una cocina vacía hoy es la **dueña de una empresa de pastelerías**. El sueño se cumplió. Y el juego le deja claro que llegó ahí **un paso a la vez**, cada uno nacido de una necesidad real.

---

# Parte 2 — Las fases derivadas

Cada capítulo es una fase. La ficha es macro: el **dolor que la dispara**, **qué aprende a hacer** Ariana, **qué entra al juego** (contexto/`Feature` en código), la **señal de avance** y **dónde ocurre en el mundo**. El detalle de flujo de cada una vive en su propio archivo de entregable.

> Los números de "señal de avance" son **parámetros de balance ajustables**, no cifras sagradas.

## Acto I · La pasión en casa

| Fase | Capítulo | El dolor que la dispara | Qué aprende a hacer | Entra al juego | Señal de avance | Mundo |
|---|---|---|---|---|---|---|
| **0** | El libro de recetas en blanco | "Quiero hacer una torta de verdad, pero no sé de qué está hecha ni qué comprar" | Crear recetas modulares (queque base con su rinde, relleno, cobertura); componer una torta escalada por el peso del queque; recibir empaque sugerido y elegir topper; sacar su lista de materiales | `catalog` (recetas modulares: queque/relleno/cobertura, topper, regla de empaque), `composition` (compone la torta, escala por peso del queque), `shopping-list` (lista de planificación) · `Feature RECIPE_BOOK` | 1.ª torta compuesta con su lista de compra generada | `KITCHEN` |
| **1** | La cocina vacía | "Quiero hornear algo" | Elegir receta, ver si tiene ingredientes, cocinar | `kitchen`, `catalog` (mínimo), `inventory` (consumo) · `Feature KITCHEN` | 1.ª producción cocinada | `KITCHEN` |
| **2** | El primer aplauso | "¿Y si lo muestro?" | Fotografiar y publicar; ganar reputación | `reputation` · `Feature SOCIAL` | Publica y suma popularidad | `KITCHEN` |
| **3** | El primer encargo | "Me piden una torta y me falta un ingrediente" | Atender un pedido informal, pedir mercadería, recibir stock, **cobrar** | `inventory` (compra simple), pedido informal · primera venta | 1.er pedido cobrado | `KITCHEN` |

## Acto II · Esto se está volviendo serio

| Fase | Capítulo | El dolor que la dispara | Qué aprende a hacer | Entra al juego | Señal de avance | Mundo |
|---|---|---|---|---|---|---|
| **4** | El recetario crece | "Con una sola receta no llego" | Ampliar su catálogo de productos | `catalog` (crece) | Varias recetas activas | `KITCHEN` |
| **5** | "¿Quién me pidió qué?" | El caos de no recordar a quién le debe qué | Registrar clientes (nombre, contacto, pedido) | `sales` (`Customer`) · `Feature CUSTOMERS` | 1.er cliente registrado | `KITCHEN` |
| **6** | "Se me acabó la harina" | Quedarse sin stock a mitad de un pedido; uno cancela | Controlar inventario (semáforo), comprar a tiempo; estados de pedido (pendiente/confirmado/cancelado) | `inventory` (control real), `sales` (`Order` con estados) · `Feature ORDERS` | Gestiona varios pedidos sin quedarse sin stock | `KITCHEN` |
| **7** | "¿A cuánto lo vendo?" | Descubrir que cobraba mal y casi no ganaba | Costear y presupuestar: ingredientes + mano de obra + empaque + margen | `quoting` (`Quote`), incluye empaque y costos · `Feature QUOTING` | Presupuestos con precio calculado | `KITCHEN` |

## Acto III · La pastelería de verdad

| Fase | Capítulo | El dolor que la dispara | Qué aprende a hacer | Entra al juego | Señal de avance | Mundo |
|---|---|---|---|---|---|---|
| **8** | La tienda física | La cocina de casa ya no da más | Abrir un local; vender en mostrador | `dashboard` · `Feature PHYSICAL_STORE` | Tienda abierta | `KITCHEN` → `TOWN` |
| **9** | Proveedores de verdad | Comprar al menudeo ya no rinde | Proveedores fijos, compra formal en volumen | `supply-chain` (`Supplier`) · `Feature SUPPLIERS` | Compra formal a proveedor | `TOWN` |
| **10** | Formalizarse | Clientes piden boleta; la informalidad aprieta | Emitir comprobantes, aplicar IGV | `settings` (impuestos) · `Feature TAX` | Precios con IGV | `TOWN` |
| **11** | Lo que se echa a perder | Insumos que se vencen y se pierden | Registrar mermas, daños y vencimientos; no sobre-comprar | `inventory` (`AdjustInventory`) · `Feature SPOILAGE` | Inventario con mermas controladas | `TOWN` |

## Acto IV · El sueño de la empresa

| Fase | Capítulo | El dolor que la dispara | Qué aprende a hacer | Entra al juego | Señal de avance | Mundo |
|---|---|---|---|---|---|---|
| **12** | "No doy abasto" | Más pedidos que manos y horno | Comprar equipamiento, producir en lote | `Feature EQUIPMENT` | Producción en lote activa | `TOWN` |
| **13** | "Necesito manos" | El cuello de botella es ella misma | Contratar empleados, delegar, pagar sueldos | `Feature EMPLOYEES` | 1.er empleado operando | `TOWN` |
| **14** | Que llegue a todos | Clientes por toda la ciudad | Montar delivery: zonas, envío | `Feature DELIVERY` | Delivery operando | `TOWN` |
| **15** | Que me conozcan | El boca a boca ya no alcanza | Invertir en marketing y campañas | `Feature MARKETING` | Campaña activa, popularidad alta | `TOWN` |
| **16** | Las cuentas claras | No sabe cuánto gana de verdad | Llevar finanzas: ingresos, gastos, utilidad, impuestos | `Feature FINANCE` | Cierre financiero mensual | `TOWN` |
| **17** | Más de una tienda | El local se queda chico para el sueño | Abrir y replicar sucursales | `Feature BRANCHES` | 2.ª sucursal abierta | `TOWN` |

---

# Parte 3 — Avance y alcance

## Regla de oro — un capítulo, un archivo, y solo cuando toca (CRÍTICA)

> **La documentación del siguiente capítulo solo se escribe cuando el capítulo actual ya está desarrollado en código fuente y validado.** No se adelanta la documentación de la siguiente etapa mientras el capítulo actual no esté implementado y validado. La documentación avanza al ritmo del desarrollo real, no antes.

Tres reglas no negociables:

- **No adelantar documentación.** Primero se desarrolla y valida el capítulo actual; recién entonces se redacta el documento del siguiente. Nunca en paralelo, nunca adelantándose a lo que aún no se construye.
- **Un archivo por capítulo.** Cada capítulo nuevo es un **archivo nuevo y propio**, que especifica a detalle ese capítulo completo: todas las características, reglas, datos y flujo de trabajo que necesita para considerarse hecho. Ese archivo es la fuente de verdad de *ese* capítulo.
- **Aislamiento estricto.** Ese archivo **solo describe lo que hace su capítulo**. No toca, no modifica ni asume otros capítulos. Cada capítulo se especifica como una unidad cerrada.

### Qué debe contener cada documento de capítulo

Todo documento de capítulo es **autocontenido** y, salvo la narrativa, **todo lo que describe es exclusivo de ese capítulo** (el dominio, el contexto y los casos de uso justos para cumplirlo, ni más ni menos). El modelado sigue **siempre Domain-Driven Design** (diseño estratégico + táctico, reglas de agregado de Vernon). Debe incluir, como mínimo:

1. **Narrativa.** El fragmento del relato de Ariana que corresponde a este capítulo —el "porqué" emocional que lo dispara.
2. **Diálogos de ayuda.** Los textos y diálogos exactos que el jugador verá en las ayudas/tutoriales del capítulo (en español).
3. **Objetivo del capítulo.** Qué hay que cumplir para darlo por hecho —la señal de avance, detallada y medible.
4. **Modelo de dominio (DDD táctico).** Exclusivamente lo necesario para este capítulo, y siempre:
   - **Value objects** (igualdad por valor, inmutables) y **entidades** (identidad propia) bien distinguidos.
   - **Agregados explícitos**: marcar cada **agregado raíz**, sus **miembros internos** y el **comportamiento** que expone. Aplicar las reglas de Vernon: agregados **pequeños**, **referenciar otros agregados solo por identidad** (id, nunca el objeto), invariantes propias **dentro** del límite, y cambios entre agregados por **consistencia eventual** (Domain Events).
   - **Anti-anemia**: creación vía **factory** y **métodos de intención de negocio**, no setters públicos.
   - **Read models / proyecciones** marcados como tales (no son agregados; no se persisten como transacción ni tienen repositorio).
5. **Bounded context (DDD estratégico).** El o los contextos delimitados que entran, **exclusivamente para este capítulo**, y siempre:
   - Su **clasificación de subdominio** (Core / Supporting / Generic) y su **lenguaje ubicuo**.
   - El **Context Mapping**: relación con otros contextos (Customer/Supplier, Published Language, Anticorruption Layer, Shared Kernel…). Lo normal es publicar **Domain Events** y que los demás se suscriban, sin acoplamiento directo.
   - **Un repositorio por agregado raíz** y los **domain services** (operaciones sin estado que no caben en una entidad).
6. **Motor de progresión.** `GoalType`, `target`, `Feature`, eventos de dominio que disparan el avance y persistencia que habilitan y cierran el capítulo.
7. **Representación en el mundo 3D.** Escenas, estaciones/edificios, cámara y fallbacks (sin WebGL, `prefers-reduced-motion`) del capítulo.
8. **Componentes visuales.** Los componentes de interfaz que se van a usar.
9. **Flujo de trabajo detallado.** El paso a paso completo del capítulo, de entrada a estado final.
10. **Casos de uso (Application Services).** Una intención por caso de uso; delgados, orquestan el dominio y publican eventos. No llevan lógica de negocio.
11. **Validaciones.** Separadas por dónde viven: **invariantes de agregado** (una sola instancia, impuestas por factory/métodos) frente a **invariantes set-based o referenciales** (cruzan varias instancias u otros agregados → Domain Policy o Application Service vía repositorio), más las **transversales** de formulario y los **criterios de aceptación**.

## Cómo se avanza entre fases

- **Camino natural (recomendado).** Cada fase se cierra cumpliendo su **señal de avance**. El juego siempre muestra *qué falta* para la siguiente, así el camino nunca es ambiguo.
- **Atajo (`ForceLevelUp`).** Quien ya conoce el juego puede **saltar** a la fase donde realmente está su negocio, sin repetir la historia desde la cocina vacía. El mundo se reconfigura de inmediato a esa fase. Camino natural y atajo conviven.


Esta guía es el **mapa narrativo** que ordena todo lo anterior: dice **qué etapa es cada cosa** y **por qué aparece cuando aparece**.
