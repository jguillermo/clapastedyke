# Plan de negocio — Simulador de pastelería que crece por fases

Este documento define **qué es el sistema y cómo crece**. Ya no es un sistema de gestión empresarial que se presenta completo desde el primer minuto. Es un **simulador de emprendimiento gradual**: el jugador empieza desde lo más básico, en la cocina de su casa, y va **desbloqueando funciones únicamente cuando su negocio realmente las necesita**.

La primera mitad del documento describe la **progresión y las fases**. La segunda mitad (§7 en adelante) recupera, con todo su detalle, la **lógica de negocio avanzada** —presupuestos, IGV, márgenes, pedidos, compras, inventario, configuración, fórmulas y validaciones—, ahora ubicada como **contenido que se desbloquea en las fases avanzadas**, no como el punto de partida.

> Fuentes hermanas: `diseno_mundo_juego.md` (mundo, lugar y cámara por fase), `diseno_visual_interfaz.html` (lenguaje visual) y `design_manual.md` (animación).

---

## 1. Concepto

La idea rectora es simple: **el sistema nunca abrume al usuario desde el inicio**. Las funciones avanzadas aparecen solo cuando tienen sentido dentro de la evolución del negocio. Todo se construye paso a paso, como una evolución natural del emprendimiento.

El jugador inicia literalmente desde su casa, en una cocina pequeña, sin conocimientos avanzados ni herramientas empresariales complejas. A medida que su negocio crece, el juego revela nuevas mecánicas.

Hay dos grandes modos, y se transita del primero al segundo de forma imperceptible:

- **Modo básico (Fases 1–4).** Solo compras ingredientes y vendes productos. La ganancia es **simple y directa** (precio de venta − lo que gastaste). No existe gestión financiera avanzada, **no existe IGV**, no existen pérdidas, deterioro, vencimientos ni costos operativos. El inventario es mínimo: una validación básica de ingredientes disponibles.
- **Modo avanzado (Fase 5+).** Conforme el negocio crece, se suman, **una a una**, las mecánicas reales de una pastelería: IGV, costos operativos, mermas, proveedores, empleados, equipamiento, producción masiva, delivery, marketing, finanzas, impuestos y sucursales.

La frontera entre ambos modos no es un interruptor: es la suma de pequeños desbloqueos que ocurren a lo largo de las fases.

---

## 2. Arranque y cinemática

El juego inicia con una transición visual que ubica al jugador en su mundo:

1. Una **vista aérea de la ciudad**.
2. Un **zoom progresivo** que desciende hasta la **casa del usuario**.
3. La cámara **entra a la cocina**.
4. Ahí comienza el **tutorial inicial**.

No hay menús de instalación ni configuración de parámetros empresariales al empezar. El primer contacto del jugador con el sistema es su propia cocina. El detalle técnico de la cámara está en `diseno_mundo_juego.md`.

---

## 3. Las fases y sus objetivos medibles

Cada fase introduce una mecánica nueva y define **objetivos medibles**. Solo cuando se cumplen todos los objetivos de una fase se abre la siguiente. Los valores numéricos son la meta de diseño por defecto; son **parámetros ajustables** del balance del juego.

### Fase 1 — Cocina en casa ("Nivel Básico 1")

Estás en una cocina. Piensas en una receta. Seleccionas qué deseas preparar. Antes de cocinar, revisas si tienes ingredientes suficientes.

Flujo: **elegir receta → revisar ingredientes → si falta, comprar → registrar lo comprado → almacenes simples por categoría → cocinar.**

- Validación básica de ingredientes: ¿cuántos huevos tienes? ¿hay harina suficiente? ¿falta azúcar?
- Si falta algo, el sistema solo indica "te falta esto, cómpralo". Sin proveedores ni precios complejos.
- Al volver de comprar, el jugador **registra manualmente** lo que trajo.
- Los ingredientes se guardan en **almacenes simples**, uno por ingrediente (almacén de huevos, de harina, de azúcar).
- **Semáforo:** vacío → rojo · poco → amarillo · suficiente → verde.

**Objetivos medibles (todos para avanzar):**
- Registrar al menos **1 compra** de ingredientes.
- Tener los **3 almacenes básicos** (huevos, harina, azúcar) en verde al menos una vez.
- **Cocinar 1 receta con éxito** (1 producción completada).

### Fase 2 — Producción para redes sociales

El usuario aún no tiene clientes formales. Produce más pasteles para mostrarlos en redes. Se introduce la idea de **popularidad / visibilidad**, y como consecuencia aparecen **pequeños pedidos informales**.

**Objetivos medibles:**
- **Cocinar 3 producciones** adicionales (acumulado de producción ≥ 4).
- **Publicar 3 veces** en redes (cada publicación requiere una producción terminada).
- Alcanzar **popularidad ≥ 100 puntos** (cada publicación suma popularidad).
- Recibir y atender **1 pedido informal**.

### Fase 3 — Primer cliente

Se desbloquea el **módulo de clientes**. Flujo mínimo: **Cliente → Pedido → Producción → Entrega → Cobro.** La ganancia sigue siendo directa (sin IGV ni costos).

**Objetivos medibles:**
- **Registrar 1 cliente.**
- **Crear 1 pedido** asociado a ese cliente.
- **Completar 1 venta** (pedido entregado y cobrado).

### Fase 4 — Primeras ventas y gamificación

El sistema introduce objetivos de venta. Al alcanzarlos se **desbloquea la primera tienda física** y el mundo pasa de la casa al pueblo de edificios (ver `diseno_mundo_juego.md`).

**Objetivos medibles:**
- **Completar 5 ventas** en total (a clientes registrados).
- (Al cumplirlo) se dispara la transición visual: salir de casa → ciudad → aparece la pastelería; la cocina crece.

### Fase 5+ — Avanzado

Cada función avanzada se desbloquea **por su propio hito**, solo cuando el negocio la necesita. Hitos medibles propuestos:

| Función avanzada | Hito que la desbloquea |
|---|---|
| **Configuración del negocio** (tarifas, margen por defecto) | Abrir la tienda física (Fase 4 completada). |
| **Presupuestos / cotización con costo y margen** | Acumular **10 ventas**. |
| **Proveedores y compra por proveedor** | Registrar **3 compras** de ingredientes. |
| **IGV / formalización** | Acumular **20 ventas** o **ingresos ≥ S/ 2 000**. |
| **Costos operativos** (indirecto, depreciación) | Operar la tienda durante **15 pedidos**. |
| **Mermas y deterioro de productos** | Tener **≥ 8 insumos** distintos en bodega. |
| **Reglas de empaque** | Vender **3 tamaños distintos** del mismo producto. |
| **Equipamiento / producción masiva** | Superar **10 pedidos en una semana**. |
| **Empleados** | Tener **≥ 5 pedidos simultáneos** en producción. |
| **Delivery** | Acumular **30 ventas**. |
| **Marketing** | Popularidad **≥ 1 000 puntos**. |
| **Finanzas / impuestos** | Cerrar **3 meses** de operación con la tienda. |
| **Sucursales** | Ingresos acumulados **≥ S/ 20 000**. |

---

## 4. Modelo de desbloqueo (resumen)

El desbloqueo es acumulativo: lo abierto no se pierde.

| Fase | Lugar | Mecánica nueva | Objetivo para avanzar | Desbloquea |
|---|---|---|---|---|
| **1 — Cocina en casa** | Casa / cocina | Elegir receta · revisar · comprar y registrar · cocinar | 1 compra + 3 almacenes en verde + 1 producción | Producción para redes (Fase 2) |
| **2 — Redes sociales** | Cocina | Producir para mostrar · popularidad · pedidos informales | 3 producciones + 3 publicaciones + 100 popularidad + 1 pedido informal | Clientes y pedidos (Fase 3) |
| **3 — Primer cliente** | Cocina | Cliente → pedido → producción → entrega → cobro | 1 cliente + 1 pedido + 1 venta | Objetivo de ventas (Fase 4) |
| **4 — Primeras ventas** | Casa → Ciudad | Objetivos de venta · tienda física | **5 ventas** | Tienda física + pueblo (Fase 5+) |
| **5+ — Avanzado** | Pueblo | IGV · costos · mermas · proveedores · empleados · equipamiento · producción masiva · delivery · marketing · finanzas · impuestos · sucursales | Hito propio de cada función (ver §3) | Cada mecánica, una a una |

Tramos de complejidad:
- **Inicial:** compra · producción · venta simple.
- **Intermedio:** clientes · pedidos · mayor stock · más recetas · organización básica.
- **Avanzado:** IGV · costos · deterioro · mermas · proveedores · empleados · equipamiento · producción masiva · delivery · marketing · finanzas · impuestos · sucursales.

---

## 5. Detalle del modo básico (Fases 1–4)

En el modo básico no hay pantallas empresariales: hay acciones simples sobre la cocina.

- **Recetas (básico).** Un nombre y su lista de ingredientes con cantidades. Sin categoría, sin tipo de base, sin mano de obra.
- **Ingredientes / almacenes (básico).** Cada ingrediente es un almacén con una cantidad y un semáforo. No hay precio por unidad ni proveedor ni stock mínimo manual: el umbral del semáforo es automático.
- **Comprar (básico).** Cuando falta un ingrediente para la receta elegida, el sistema lo señala. El jugador registra manualmente la cantidad que trajo y el almacén pasa de rojo a verde.
- **Cocinar (básico).** Consume del almacén las cantidades que pide la receta y cuenta como una producción.
- **Vender (básico, Fases 2–4).** Precio de venta puesto a mano; **ganancia = precio − gasto**, sin impuestos ni costos. El pedido informal (Fase 2) y el pedido a cliente (Fase 3+) comparten el flujo mínimo cliente/pedido → producción → entrega → cobro.

---

## 6. El mundo avanzado: dónde viven los flujos (Fase 5+)

Cuando se desbloquea la tienda física, el mundo pasa al **pueblo de edificios** (detalle en `diseno_mundo_juego.md`). Los flujos avanzados se reparten así:

| Edificio | Funciones avanzadas que aloja |
|---|---|
| **La Oficina** | Configuración · Clientes · Reglas de empaque |
| **La Bodega** | Insumos · Ajustar inventario |
| **La Tienda** | Nuevo presupuesto · Ver presupuestos |
| **El Obrador** | Ver pedidos · Recetas |
| **El Mercado** | Comprar materiales · Proveedores |

Las pantallas y campos de cada función están en §7–§13.

---

## 7. Presupuestos (cotización avanzada)

Se desbloquea cuando el negocio necesita cotizar con precisión (hito: 10 ventas). Es la pantalla central del modo avanzado: una ventana grande dividida en secciones que se recorren de arriba hacia abajo; las secciones de cálculo se actualizan solas.

**Sección 1 — Cliente y producto:**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Cliente | Sí | Autocompletado sobre Clientes. Botón "Nuevo cliente" para crear sin salir. |
| Producto o receta | Sí | Autocompletado sobre Recetas. Al elegir, autocompleta ingredientes y tiempo de mano de obra. |

**Sección 2 — Escalado:**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Modo de escalado | Sí | Dropdown: por cantidad, por tamaño, por número de personas, por factor directo. |
| Valor | Sí | Número > 0. La etiqueta cambia según el modo. Al cambiarlo, los ingredientes se reescalan al instante. |

**Sección 3 — Ingredientes (solo lectura):** tabla que el sistema arma solo: cada ingrediente, la cantidad ya escalada, el precio por gramo/unidad y el subtotal. Al pie, el costo total de ingredientes.

**Sección 4 — Empaque y materiales:**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Empaques sugeridos | No | Checkboxes prellenados según receta y tamaño; cada uno con cantidad editable. |
| Agregar empaque o insumo | No | Autocompletado sobre Insumos de tipo empaque + cantidad, para sumar lo no sugerido. Varias filas. |

Al pie, el costo total de materiales (solo lectura).

**Sección 5 — Otros costos (solo lectura):** tres líneas calculadas desde Configuración y la receta: **mano de obra** (tiempo × tarifa), **costo indirecto** (monto fijo por pedido) y **depreciación** (monto fijo por pedido).

**Sección 6 — Ganancia y precio:**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Margen de ganancia | Sí | Porcentaje, prellenado desde Configuración, editable para este presupuesto. |
| Aplicar IGV | No | Casilla; si está marcada suma el IGV después de la ganancia. |
| Notas | No | Texto libre. |

Al pie, en solo lectura, el desglose final: costo total de producción, precio con la ganancia, IGV si corresponde, redondeo y **precio final** resaltado.

**Guardar:** congela todos los precios y parámetros, asigna fecha de emisión y vencimiento (días configurables), guarda en el histórico con estado **Pendiente** y registra auditoría. Cambiar luego un precio de insumo **no** afecta a este presupuesto.

---

## 8. Reglas de cálculo del precio (avanzado)

Las fórmulas exactas del modo avanzado:

- **Costo total** = `ingredientes + materiales + mano_obra + indirecto_fijo + depreciacion_fija`.
- **Margen sobre el precio de venta** (no sobre el costo): `precio_con_margen = costo_total / (1 - margen/100)`.
- **IGV** (cuando está activado): se aplica **encima** del precio con margen → `monto_igv = precio_con_margen × (tasa_igv/100)`. Tasa por defecto **18 %**.
- **Redondeo:** al múltiplo de 5 hacia arriba cuando el modo es `MULTIPLO_5` → `precio_final = ceil((precio_con_margen + monto_igv) / 5) × 5`. Si el redondeo es "ninguno", `precio_final = precio_con_margen + monto_igv`.

Reglas de escalado:
- Las cantidades de **ingredientes escalan por el factor**; las de **empaque no escalan** (se fijan a mano por presupuesto).
- El factor se obtiene del modo de escalado: por factor directo (valor tal cual), por tamaño (factor del tamaño en Configuración), por cantidad/personas (`valor / base de la receta`).

---

## 9. Pedidos (ciclo de producción avanzado)

Un presupuesto aprobado se convierte en pedido.

**Estados y transiciones:**

| Acción | Cuándo | Comportamiento |
|---|---|---|
| Iniciar producción | Pendiente | Confirma y pasa a **Producción**. |
| Marcar entregado | Producción | Confirma, pasa a **Entregado**, genera el registro de **venta** y refresca métricas. |
| Cancelar | Pendiente o Producción | Motivo opcional; pasa a **Cancelado** y **devuelve** el stock descontado. |

**Momento de descuento de stock** (configurable): al **aprobar** el presupuesto o al **iniciar producción**. El descuento es idempotente (un doble clic no descuenta dos veces). Antes de aprobar, el sistema avisa cuánto stock quedará en negativo, para saber qué comprar.

---

## 10. Comprar materiales y registrar compra (avanzado)

Se desbloquea con los proveedores. Comprar deja de ser "te falta esto" y pasa a ser una operación con proveedor.

**Comprar materiales (lista de compras), dos modos:**
- **Automático (desde un pedido):** se elige un pedido con faltantes y aparece lo que falta.
- **Manual:** checkboxes sobre Insumos (los que están bajo el mínimo vienen marcados) + cantidad por producto.
- **Resultado:** lista agrupada por proveedor con cantidad a comprar, último precio y proveedor recomendado; botón de WhatsApp con mensaje listo; botón "Registrar compra".

**Registrar compra (recepción):** sube stock y actualiza precios.

| Campo | Obligatorio | Comportamiento |
|---|---|---|
| Proveedor | Sí | Autocompletado sobre Proveedores. |
| Fecha | Sí | Hoy por defecto. |
| Producto (línea) | Sí | Autocompletado sobre Insumos. |
| Cantidad recibida | Sí | Número > 0, en la unidad de presentación. |
| Precio pagado por la presentación | Sí | Número > 0 (precio del empaque completo, no del gramo). |

Al guardar, por cada línea: suma al stock, actualiza el precio de la presentación, recalcula y guarda el precio por gramo/unidad, y registra auditoría.

---

## 11. Ajustar inventario (mermas y ajustes, avanzado)

Se desbloquea junto con el deterioro y las mermas.

| Campo | Obligatorio | Comportamiento |
|---|---|---|
| Producto | Sí | Autocompletado sobre Insumos. |
| Tipo de ajuste | Sí | Dropdown: merma, daño, vencimiento, ajuste por conteo, devolución. |
| Cantidad | Sí | Número; el **signo lo define el tipo** (merma/daño/vencimiento restan; conteo puede sumar o restar; devolución suma). |
| Motivo | No | Texto libre (recomendado en mermas grandes). |
| Fecha | Sí | Hoy por defecto. |

Al guardar, mueve el stock, evalúa el semáforo y registra auditoría. Los tipos de ajuste y su signo se leen de Configuración.

---

## 12. Catálogos (avanzado)

### 12.1 Clientes

| Campo | Obligatorio | Comportamiento |
|---|---|---|
| Nombre | Sí | Texto libre, único. |
| Teléfono o contacto | No | Texto libre. |
| Notas | No | Texto libre. |

### 12.2 Recetas

**Cabecera:**

| Campo | Obligatorio | Comportamiento |
|---|---|---|
| Nombre | Sí | Texto libre, único. |
| Categoría | No | Dropdown o texto libre. |
| Tipo de base | Sí | Dropdown: por personas o por tamaño (define cómo escala). |
| Valor de la base | Sí | Número > 0 (para cuántas personas/qué tamaño rinde tal cual). |
| Tiempo de mano de obra | Sí | Número en horas (alimenta el cálculo de mano de obra). |

**Ingredientes (filas):** Insumo (autocompletado), Cantidad base (> 0), Unidad (se toma del insumo, solo lectura). Valida ≥ 1 ingrediente.

### 12.3 Insumos

| Campo | Obligatorio | Comportamiento |
|---|---|---|
| Nombre | Sí | Texto libre, único. |
| Tipo | Sí | Dropdown: ingrediente o empaque. |
| Unidad base | Sí | Dropdown: gramos o unidad. |
| Tamaño de la presentación | Sí | Número > 0 (p. ej. 1000 g, o 16 u el cartón). |
| Precio de la presentación | Sí | Número > 0 (último precio del empaque completo). |
| Precio por gramo o unidad | No | Solo lectura; lo calcula el sistema al crear y en cada compra. |
| Stock inicial | No | Número; solo al crear. Después lo mueven las funciones. |
| Stock mínimo | Sí | Número; umbral del semáforo. |
| Proveedor recomendado | No | Autocompletado sobre Proveedores. |

### 12.4 Proveedores

| Campo | Obligatorio | Comportamiento |
|---|---|---|
| Nombre | Sí | Texto libre, único. |
| WhatsApp | Sí | Número con código de país, validado para armar el enlace. |
| Notas | No | Texto libre. |

### 12.5 Reglas de empaque

Define qué empaque se sugiere por receta y tamaño (prellena los presupuestos).

| Campo | Obligatorio | Comportamiento |
|---|---|---|
| Receta | Sí | Autocompletado sobre Recetas. |
| Tamaño | Sí | Dropdown sobre la lista de tamaños. |
| Empaque | Sí | Autocompletado sobre Insumos de tipo empaque. |
| Cantidad | Sí | Número > 0. |

Una misma receta y tamaño puede tener varias filas.

---

## 13. Configuración avanzada

Todos los parámetros del negocio. Cambiar algo aquí afecta los presupuestos **nuevos**, nunca los ya guardados. Nada de esto se pide en el modo básico: cada parámetro aparece con la función que lo usa.

| Campo | Comportamiento |
|---|---|
| Tarifa de mano de obra por hora | Número. |
| Costo indirecto por pedido | Número (monto fijo). |
| Depreciación por pedido | Número (monto fijo). |
| Margen por defecto | Porcentaje. |
| Aplicar IGV | Casilla. |
| Tasa de IGV | Número, por defecto 18. |
| Redondeo del precio | Dropdown: ninguno, o múltiplo de 5 hacia arriba. |
| Días de vencimiento | Número, por defecto 15. |
| Momento de descuento de stock | Dropdown: al aprobar, o al iniciar producción. |
| Lista de tamaños | Tamaños y su factor de escalado. |
| Factores de escalado | Lista de factores con su etiqueta. |
| Tipos de ajuste de inventario | Lista de tipos con su signo (merma/daño/vencimiento restan, conteo neutro, devolución suma). |

---

## 14. Validaciones y comportamientos transversales (avanzado)

- Antes de aprobar un presupuesto, el sistema avisa cuánto stock quedará en negativo.
- No se puede aprobar dos veces el mismo presupuesto ni entregar un pedido que no está en producción; los botones que no aplican no aparecen.
- Cancelar un pedido entregado no se permite; la cancelación solo está disponible antes de la entrega.
- Cada guardado escribe **auditoría** con fecha, usuario, qué cambió, valor anterior y valor nuevo.
- Las funciones que mueven stock o crean pedidos usan **bloqueo**, para que un doble clic no descuente dos veces.
- Campos obligatorios marcados; números no aceptan letras; precios/cantidades/stock no negativos; dropdowns y autocompletados se alimentan de los catálogos (nunca eliges algo que no existe).
- Tras guardar, aviso corto de éxito y refresco; si algo falla, el aviso explica qué pasó y no se pierde lo escrito.

---

## 15. Recorrido de uso

### 15.1 Modo básico (Fase 1)

La cámara baja desde la ciudad hasta tu casa y entra a la cocina. Eliges una receta; el sistema compara sus ingredientes con tus almacenes: el de azúcar está en rojo. Sales a comprar, vuelves y registras el azúcar; el almacén pasa a verde. Cocinas la receta. Cumpliste el objetivo de la fase y se abre la siguiente.

### 15.2 Modo avanzado (Fase 5+)

Con tienda física y clientes, el día se parece al de una pastelería real: revisas pedidos, cotizas con presupuesto (costo + margen + IGV + redondeo), lo apruebas para generar el pedido y descontar stock, compras lo que falte a proveedores, produces, entregas y cobras. Las funciones avanzadas (IGV, costos, mermas, finanzas) intervienen solo si ya las desbloqueaste.

---

## 16. Nota técnica: cálculos vivos vs. transacciones congeladas

Aplica al modo avanzado y guía dónde vive cada cálculo:

- **Cálculo de referencia (vivo):** mira datos actuales y los muestra; va en fórmula viva (precio por unidad de un insumo, semáforo de stock, contadores de resumen, búsquedas de nombre por código).
- **Transacción (congelada):** escribe un hecho del negocio que debe quedar fijo en el tiempo; lo hace el código (guardar un presupuesto con su precio congelado, descontar stock al aprobar, registrar la venta al entregar, devolver stock al cancelar, subir stock al registrar una compra, escribir auditoría).

La frontera: si el valor debe quedar congelado tal como estaba el día en que se guardó, es transacción; si debe reflejar siempre el estado actual, es cálculo vivo. Esto preserva la trazabilidad de presupuestos y pedidos mientras los catálogos y el resumen se leen solos.
