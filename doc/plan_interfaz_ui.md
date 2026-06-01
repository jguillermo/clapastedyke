# Diseño de la interfaz de usuario
### Sistema de costeo en Google Sheets + Apps Script

Este documento define cómo se ve y cómo se usa el sistema. Define la navegación, el menú, cada pantalla y cada formulario con todos sus campos, su tipo de entrada, si es obligatorio y qué valida. Es la guía para construir la parte visual.

---

## 1. El modelo general de la interfaz

Hay una idea que ordena todo y conviene entenderla antes de seguir. Las hojas del spreadsheet son la base de datos, están bloqueadas y nadie escribe en ellas a mano. Entonces los formularios no viven en hojas. Viven en ventanas que se abren encima de la hoja, hechas con HtmlService. Esas ventanas son las que tienen los campos donde escribes, y al guardar, una función de Apps Script lleva los datos a las hojas por debajo.

Esto da tres piezas de interfaz:

• **Las hojas de datos.** Catálogos e historiales. Bloqueadas, solo lectura para ti en el uso normal. No se navegan como pantallas, son la bodega de datos.
• **La hoja Inicio.** La única hoja pensada para mirarse. Es el panel de inicio, con el resumen del negocio y botones para abrir cada cosa.
• **Las ventanas de formulario.** Cajas que se abren sobre la hoja para crear o editar algo, o para ver una lista con acciones. Se cierran y vuelves al Inicio.

Por qué los formularios no son hojas. Si cada formulario fuera una hoja con celdas para escribir, esas celdas tendrían que estar desbloqueadas, y eso choca con la regla de que nada se edita a mano. Las ventanas HTML resuelven esto: escribes en la ventana, no en la hoja, y el control de qué entra queda en el código.

---

## 2. El menú principal

Al abrir el archivo, una función onOpen crea un menú propio en la barra superior de Google Sheets, al lado de Archivo, Editar, Ver. Se llama **Sistema** (o el nombre de tu negocio). Es el punto de entrada a todo.

Composición del menú **Sistema**:

• **Ir al Inicio.** Lleva a la hoja Inicio. Es el "volver a casa" que pediste.
• (separador)
• **Nuevo presupuesto.** Abre la ventana de presupuesto.
• **Ver presupuestos.** Abre la lista de presupuestos con sus acciones.
• **Ver pedidos.** Abre la lista de pedidos con sus acciones.
• (separador)
• **Comprar materiales.** Abre la lista de compras manual.
• **Registrar compra.** Abre el formulario de recepción.
• **Ajustar inventario.** Abre el formulario de mermas y ajustes.
• (separador)
• **Catálogos.** Submenú con: Clientes, Recetas, Insumos, Proveedores, Reglas de empaque.
• **Configuración.** Abre el formulario de parámetros.

Además del menú, la hoja Inicio repite estos accesos como botones grandes, para que no dependas de recordar dónde está cada cosa. El menú y los botones llaman a las mismas funciones, así que dan el mismo resultado.

---

## 3. La hoja Inicio

Es la pantalla de bienvenida y el centro de navegación. Tiene tres zonas, de arriba hacia abajo.

**Zona de resumen (arriba).** Un puñado de tarjetas con los números del momento, leídos del dashboard: presupuestos pendientes, presupuestos por vencer en los próximos días, pedidos en producción, pedidos por entregar, y productos en rojo (agotados) o amarillo (bajo mínimo). Son solo lectura.

**Zona de accesos (centro).** Botones grandes agrupados por tarea, en el mismo orden del menú: Nuevo presupuesto, Ver presupuestos, Ver pedidos, Comprar materiales, Registrar compra, Ajustar inventario, y un bloque de Catálogos y Configuración.

**Zona de alertas (abajo).** Una lista corta de cosas que piden atención: presupuestos que vencen pronto, pedidos atrasados, insumos en rojo. Cada alerta tiene un enlace que abre la pantalla correspondiente.

La hoja Inicio se refresca sola al abrir el archivo y cada vez que vuelves a ella después de guardar algo.

---

## 4. Cómo son las ventanas

Se usan dos formatos según el caso.

• **Ventana modal (caja centrada).** Para crear o editar algo y para listas con acciones. Bloquea el fondo hasta que guardas o cierras. Es la que más se usa.
• **Barra lateral (sidebar a la derecha).** Para tareas rápidas que quieres tener a mano mientras miras una hoja, como un ajuste de inventario suelto. Opcional.

Toda ventana tiene la misma estructura: un título arriba, el contenido en el centro, y abajo a la derecha los botones de acción (el principal a la derecha, Cancelar a su izquierda). Cancelar siempre cierra sin guardar. Cerrar una ventana te devuelve al Inicio.

---

## 5. Convenciones de los campos

Para que todos los formularios se sientan iguales, estas reglas valen en todos lados.

**Tipos de entrada que se usan:**

• **Autocompletado.** Caja de texto que filtra mientras escribes y sugiere de un catálogo. Para elegir cliente, receta, insumo o proveedor, donde la lista puede ser larga.
• **Lista desplegable (dropdown).** Para opciones cortas y fijas, como un estado o un tipo de ajuste.
• **Selección múltiple (checkboxes).** Para marcar varios a la vez, como los empaques sugeridos.
• **Texto libre.** Para nombres, notas y motivos.
• **Fecha.** Selector de calendario.
• **Número.** Caja numérica, con decimales donde haga falta.
• **Casilla de verificación.** Para un sí o no, como "aplicar IGV".
• **Solo lectura.** Valores que el sistema calcula y muestra, pero no se editan, como el precio por gramo o el precio final.

**Reglas generales de validación y comportamiento:**

• Los campos obligatorios se marcan con un asterisco. Si falta uno, el botón Guardar no procede y el campo se resalta en rojo con un mensaje breve.
• Los números no aceptan letras, y los que no pueden ser negativos (precios, cantidades, stock mínimo) lo validan.
• Los dropdown y autocompletados se alimentan de los catálogos, así que nunca eliges algo que no existe.
• Al guardar, el botón se deshabilita un instante para evitar el doble clic y el registro duplicado.
• Toda acción que no se puede deshacer fácil (aprobar, rechazar, cancelar, entregar, guardar una compra) pide una confirmación antes.
• Tras guardar, la ventana se cierra, aparece un aviso corto de éxito y la hoja Inicio o la lista se refresca.
• Si algo falla, el aviso explica qué pasó y la ventana no se cierra, para no perder lo escrito.

---

## 6. Catálogo de pantallas

A partir de aquí, cada pantalla con su detalle. En las tablas de campos, la columna Obligatorio dice Sí o No, y la última columna explica el tipo de entrada y qué valida o hace.

---

### 6.1 Nuevo presupuesto

La pantalla central del sistema. Una ventana modal grande, dividida en secciones que se recorren de arriba hacia abajo. A medida que llenas, las secciones de cálculo se van actualizando solas.

**Sección 1, Cliente y producto:**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Cliente | Sí | Autocompletado sobre el catálogo de Clientes. Si no existe, un botón "Nuevo cliente" abre una mini ventana para crearlo sin salir. |
| Producto o receta | Sí | Autocompletado sobre Recetas. Al elegir, el sistema autocompleta los ingredientes y el tiempo de mano de obra de esa receta. |

**Sección 2, Escalado:**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Modo de escalado | Sí | Dropdown con cuatro opciones: por cantidad, por tamaño, por número de personas, por factor directo. Solo se elige uno. |
| Valor | Sí | Número mayor que cero. La etiqueta cambia según el modo (por ejemplo "número de personas"). Al cambiarlo, todos los ingredientes se reescalan al instante. |

**Sección 3, Ingredientes (solo lectura):**
Una tabla que el sistema arma solo. Muestra cada ingrediente, la cantidad ya escalada, el precio por gramo o unidad y el subtotal de la línea. No se edita aquí, refleja la receta y el escalado. Al pie, el costo total de ingredientes.

**Sección 4, Empaque y materiales:**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Empaques sugeridos | No | Selección múltiple con checkboxes, prellenada según la combinación de receta y tamaño. Cada empaque marcado muestra una cantidad editable (número). |
| Agregar empaque o insumo | No | Autocompletado sobre Insumos de tipo empaque, más un número de cantidad, para sumar algo que no estaba sugerido. Se pueden agregar varias filas. |

Al pie, el costo total de materiales, en solo lectura.

**Sección 5, Otros costos (solo lectura):**
Tres líneas que el sistema calcula desde Config y la receta: mano de obra (tiempo por tarifa), costos indirectos (monto fijo por pedido) y depreciación (monto fijo por pedido). Se muestran para que veas el desglose, no se editan en el presupuesto.

**Sección 6, Ganancia y precio:**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Margen de ganancia | Sí | Número en porcentaje, prellenado con el valor por defecto de Config, editable para este presupuesto. |
| Aplicar IGV | No | Casilla de verificación, prellenada según Config. Si está marcada, suma el 18 por ciento después de la ganancia. |
| Notas | No | Texto libre para aclaraciones del presupuesto. |

Al pie de esta sección, en solo lectura, el desglose final: costo total de producción, precio con la ganancia aplicada, IGV si corresponde, redondeo al múltiplo de 5, y el precio final que se cobra, resaltado.

**Botones:** Cancelar y **Guardar presupuesto**. Al guardar, el sistema congela todos los precios y parámetros, asigna fecha de emisión y vencimiento a 15 días, guarda en el histórico con estado Pendiente, registra en auditoría, cierra la ventana y avisa.

---

### 6.2 Ver presupuestos

Ventana modal con una lista. Arriba, los filtros. Abajo, la tabla. A la derecha de cada fila, las acciones.

**Filtros (todos opcionales):**

| Campo | Tipo y comportamiento |
|---|---|
| Estado | Dropdown: Todos, Pendiente, Aprobado, Rechazado, Vencido. |
| Cliente | Autocompletado sobre Clientes. |
| Desde / Hasta | Dos campos de fecha para acotar por fecha de emisión. |

**Tabla:** número de presupuesto, cliente, fecha de emisión, fecha de vencimiento, precio final y estado. El estado se muestra con color (Pendiente neutro, Aprobado verde, Rechazado y Vencido grises o rojo).

**Acciones por fila:**

• **Ver.** Abre el detalle congelado (pantalla 6.3).
• **Aprobar.** Solo si está Pendiente. Pide confirmación y dispara la conversión a pedido.
• **Rechazar.** Solo si está Pendiente. Abre un campo de motivo opcional y marca Rechazado.

---

### 6.3 Detalle de presupuesto

Ventana modal de solo lectura que reconstruye el presupuesto tal como se guardó, con sus precios congelados: cliente, fechas, lista de ingredientes con sus subtotales, empaque, otros costos, ganancia, IGV y precio final. Nada de esto se edita, es el snapshot.

Abajo, según el estado, aparecen los botones:

| Botón | Cuándo aparece | Comportamiento |
|---|---|---|
| Aprobar | Estado Pendiente | Pide confirmación. Cambia el presupuesto a Aprobado, crea el pedido, descuenta stock y arma la lista de compras. |
| Rechazar | Estado Pendiente | Campo de motivo (texto libre, opcional). Marca Rechazado. No toca inventario. |
| Cerrar | Siempre | Vuelve a la lista. |

---

### 6.4 Ver pedidos

Ventana modal con lista, igual en forma a la de presupuestos.

**Filtros (opcionales):** Estado (dropdown: Todos, Pendiente, Producción, Entregado, Cancelado) y Cliente (autocompletado).

**Tabla:** número de pedido, presupuesto de origen, cliente, fecha, estado con color.

**Acciones por fila, según el estado:**

| Acción | Cuándo | Comportamiento |
|---|---|---|
| Ver | Siempre | Abre el detalle del pedido y su requerimiento de materiales. |
| Iniciar producción | Estado Pendiente | Pide confirmación. Cambia a Producción. |
| Marcar entregado | Estado Producción | Pide confirmación. Cambia a Entregado, genera el registro de venta y refresca métricas. |
| Cancelar | Pendiente o Producción | Campo de motivo (texto libre, opcional). Cambia a Cancelado y devuelve el stock que se había descontado. |

---

### 6.5 Comprar materiales (lista de compras)

Ventana modal con dos modos, elegibles con un dropdown arriba.

**Modo automático (desde un pedido):**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Pedido | Sí | Dropdown con los pedidos que tienen faltantes. Al elegir, abajo aparece la lista de lo que falta. |

**Modo manual (compra por tu cuenta):**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Productos | Sí | Selección múltiple con checkboxes sobre Insumos. Los que están bajo el mínimo aparecen ya marcados. |
| Cantidad por producto | Sí | Número junto a cada producto marcado. Mayor que cero. |

**Resultado (en ambos modos):** una lista agrupada por proveedor. Por cada producto muestra cantidad a comprar, último precio registrado y proveedor recomendado. Por cada proveedor, un botón que abre WhatsApp con un mensaje listo para preguntar disponibilidad. Un botón "Registrar compra" lleva a la pantalla 6.6 con el proveedor precargado.

---

### 6.6 Registrar compra (recepción)

Ventana modal. Es el paso que sube el stock y actualiza precios.

**Cabecera:**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Proveedor | Sí | Autocompletado sobre Proveedores. |
| Fecha | Sí | Fecha, con el día de hoy puesto por defecto. |

**Líneas de la compra (se agregan las que hagan falta):**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Producto | Sí | Autocompletado sobre Insumos. |
| Cantidad recibida | Sí | Número mayor que cero, en la unidad de presentación del producto. |
| Precio pagado por la presentación | Sí | Número mayor que cero. Es el precio del empaque completo, no del gramo. |

**Botones:** Cancelar y **Guardar compra** (pide confirmación). Al guardar, por cada línea suma la cantidad al stock, actualiza el precio de la presentación, recalcula y guarda el precio por gramo o unidad, y registra todo en auditoría.

---

### 6.7 Ajustar inventario (mermas y ajustes)

Ventana modal o barra lateral, según prefieras tenerla a mano.

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Producto | Sí | Autocompletado sobre Insumos. |
| Tipo de ajuste | Sí | Dropdown: merma, daño, vencimiento, ajuste por conteo, devolución. |
| Cantidad | Sí | Número. El signo lo define el tipo (resta en merma y daño, puede sumar o restar en conteo). |
| Motivo | No | Texto libre. Recomendado en mermas grandes. |
| Fecha | Sí | Fecha, con hoy por defecto. |

**Botones:** Cancelar y **Guardar ajuste**. Mueve el stock, evalúa el semáforo y registra en auditoría.

---

### 6.8 Catálogo de Clientes

Ventana modal con la lista arriba y un botón "Nuevo cliente". Editar una fila abre el mismo formulario con los datos cargados.

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Nombre | Sí | Texto libre. No se permiten dos clientes con el mismo nombre exacto. |
| Teléfono o contacto | No | Texto libre. |
| Notas | No | Texto libre. |

---

### 6.9 Catálogo de Recetas

Ventana modal en dos partes: la cabecera de la receta y su lista de ingredientes.

**Cabecera:**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Nombre | Sí | Texto libre, único. |
| Categoría | No | Dropdown o texto libre (tortas, bocaditos, etc.). |
| Tipo de base | Sí | Dropdown: por personas o por tamaño. Define cómo se escala. |
| Valor de la base | Sí | Número mayor que cero (para cuántas personas o qué tamaño rinde tal como está). |
| Tiempo de mano de obra | Sí | Número en horas. Alimenta el cálculo de mano de obra. |

**Ingredientes (filas que se agregan):**

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Insumo | Sí | Autocompletado sobre Insumos. |
| Cantidad base | Sí | Número mayor que cero, para la base de la receta. |
| Unidad | Sí | Se toma sola del insumo (gramos o unidad), en solo lectura. |

Botones para agregar y quitar filas. Al guardar, valida que haya al menos un ingrediente.

---

### 6.10 Catálogo de Insumos

Ventana modal con lista y formulario. Es donde vive el costo base de todo.

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Nombre | Sí | Texto libre, único. |
| Tipo | Sí | Dropdown: ingrediente o empaque. |
| Unidad base | Sí | Dropdown: gramos o unidad. Define si se cuenta o se pesa. |
| Tamaño de la presentación | Sí | Número mayor que cero (por ejemplo 1000 gramos, o 16 unidades el cartón). |
| Precio de la presentación | Sí | Número mayor que cero. Es el último precio pagado por el empaque completo. |
| Precio por gramo o unidad | No | Solo lectura. El sistema lo calcula y lo guarda al crear y en cada compra. |
| Stock inicial | No | Número. Solo se escribe al crear. Después lo mueven las funciones, no este campo. |
| Stock mínimo | Sí | Número. Es el umbral del semáforo. |
| Proveedor recomendado | No | Autocompletado sobre Proveedores. |

---

### 6.11 Catálogo de Proveedores

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Nombre | Sí | Texto libre, único. |
| WhatsApp | Sí | Número con código de país, validado para armar el enlace. |
| Notas | No | Texto libre. |

---

### 6.12 Reglas de empaque

Define qué empaque se sugiere para cada receta y tamaño. Ventana modal con lista y filas.

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Receta | Sí | Autocompletado sobre Recetas. |
| Tamaño | Sí | Dropdown sobre la lista cerrada de tamaños (chico, mediano, grande, o lo que definas). |
| Empaque | Sí | Autocompletado sobre Insumos de tipo empaque. |
| Cantidad | Sí | Número mayor que cero. |

Una misma receta y tamaño puede tener varias filas de empaque.

---

### 6.13 Configuración

Ventana modal con todos los parámetros del negocio. Cambiar algo aquí afecta los presupuestos nuevos, nunca los ya guardados.

| Campo | Obligatorio | Tipo y comportamiento |
|---|---|---|
| Tarifa de mano de obra por hora | Sí | Número. |
| Costo indirecto por pedido | Sí | Número. |
| Depreciación por pedido | Sí | Número. |
| Margen por defecto | Sí | Número en porcentaje. |
| Aplicar IGV | Sí | Casilla de verificación. |
| Tasa de IGV | Sí | Número, por defecto 18. |
| Redondeo del precio | Sí | Dropdown: ninguno, o al múltiplo de 5 más cercano hacia arriba. |
| Días de vencimiento | Sí | Número, por defecto 15. |
| Momento de descuento de stock | Sí | Dropdown: al aprobar el pedido, o al iniciar producción. Por ahora, al aprobar. |
| Lista de tamaños | Sí | Texto, los tamaños separados por coma, que alimenta el dropdown de las reglas de empaque. |

---

## 7. Validaciones y comportamientos transversales

Valen en todas las pantallas, además de lo dicho en cada una.

• Antes de aprobar un presupuesto, el sistema avisa cuánto stock quedará en negativo, para que sepas qué tendrás que comprar.
• No se puede aprobar dos veces el mismo presupuesto ni entregar un pedido que no está en producción. Los botones que no aplican no aparecen.
• Cancelar un pedido entregado no se permite. La cancelación solo está disponible antes de la entrega.
• Cada guardado escribe en auditoría con fecha, usuario, qué cambió, valor anterior y valor nuevo.
• Las funciones que mueven stock o crean pedidos usan bloqueo, para que un doble clic no descuente dos veces.
• Los avisos de éxito y error son cortos y aparecen sobre la hoja, sin tapar el trabajo.

---

## 8. Recorrido típico de uso

Para ver cómo encaja todo, un día normal.

Abres el archivo y caes en el Inicio, que te muestra qué vence pronto y qué está en rojo. Eliges Nuevo presupuesto, escoges cliente y receta, pones el escalado, revisas el precio que el sistema calculó y guardas. El presupuesto queda Pendiente. El cliente acepta, así que entras a Ver presupuestos, lo apruebas, y el sistema crea el pedido, descuenta stock y te arma la lista de lo que falta. Desde esa lista mandas WhatsApp a los proveedores. Cuando llega el material, usas Registrar compra y el stock sube solo. Inicias producción desde Ver pedidos, y al terminar lo marcas como entregado. La venta queda registrada y el Inicio actualiza sus números. Si en el camino se echó a perder algo, lo descuentas con Ajustar inventario.

---

## 9. Mapa de navegación

```
Abrir archivo
   ↓
Hoja INICIO (panel + botones + alertas)
   │
   ├── Menú "Sistema" (siempre visible arriba)
   │
   ├── Nuevo presupuesto ........ ventana 6.1
   ├── Ver presupuestos ......... ventana 6.2 → Detalle 6.3 (Aprobar / Rechazar)
   ├── Ver pedidos .............. ventana 6.4 (Producción / Entregar / Cancelar)
   ├── Comprar materiales ....... ventana 6.5 → Registrar compra 6.6
   ├── Registrar compra ......... ventana 6.6
   ├── Ajustar inventario ....... ventana 6.7
   ├── Catálogos
   │      ├── Clientes .......... ventana 6.8
   │      ├── Recetas ........... ventana 6.9
   │      ├── Insumos ........... ventana 6.10
   │      ├── Proveedores ....... ventana 6.11
   │      └── Reglas de empaque . ventana 6.12
   └── Configuración ............ ventana 6.13

Cada ventana se cierra y devuelve al INICIO.
```
# Adición al plan
## Más lógica en las hojas, menos en las funciones

Esta adición se pega después del plan actual y lo complementa. No reemplaza lo ya definido, salvo en los puntos donde se dice de forma explícita. La idea de fondo es aprovechar Google Sheets como lo que es, una hoja de cálculo, y no usarla solo como bodega de datos. Donde una fórmula puede resolver algo, lo resuelve la fórmula, no el código. El instalador es quien siembra esas fórmulas, y al reparar las vuelve a poner todas, existan o no.

## 10. Principio rector

Una regla simple para decidir dónde vive cada cosa.

Lo que es un cálculo de referencia, que mira datos actuales y los muestra, va en una fórmula dentro de la hoja. Por ejemplo el precio por gramo de un insumo, el semáforo de stock, los contadores del resumen, o traer el nombre de un cliente a partir de su código. Eso son fórmulas.

Lo que es una transacción, que escribe un hecho del negocio que debe quedar fijo en el tiempo, lo hace el código. Por ejemplo guardar un presupuesto con su precio congelado, descontar stock al aprobar, registrar una venta al entregar. Eso son funciones.

La frontera entre ambos mundos es esta. Si el valor debe quedar congelado tal como estaba el día que se guardó, lo escribe el código como número fijo. Si el valor debe reflejar siempre el estado actual, es una fórmula. Los presupuestos y los pedidos quedan congelados, por eso siguen siendo del código. Los catálogos, las listas y el resumen son vivos, por eso son fórmulas.

## 11. El instalador siembra y repara las fórmulas

El instalador deja de ser solo el que crea hojas y columnas. Ahora también es el dueño de todas las fórmulas del sistema. Su comportamiento se amplía así.

Al instalar por primera vez, además de crear las hojas, escribe en cada hoja que lo necesite sus fórmulas de cabecera, las que calculan columnas enteras, y las referencias entre hojas.

Al reparar, vuelve a escribir todas las fórmulas desde cero, pisando las que hubiera. Esto es a propósito. Si alguien borró o ensució una fórmula, reparar la deja como debe estar. Las fórmulas no son datos del usuario, son estructura, así que reescribirlas no pierde nada.

Las fórmulas que calculan una columna entera se siembran una sola vez, en la fila de cabecera o en la primera fila de datos, usando ARRAYFORMULA, de modo que cubren todas las filas presentes y las que el código agregue después. El código nunca escribe en esas columnas calculadas, solo escribe en las columnas base. Así no pelean la fórmula y la función por la misma celda.

Para que quede claro qué celdas son territorio de la fórmula y cuáles del código, en cada hoja las columnas calculadas van agrupadas a la derecha, después de las columnas base. El instalador las marca con un color de cabecera distinto, para que se note de un vistazo que esas no se tocan a mano.

## 12. Nombres de columnas legibles

Las columnas dejan de usar guion bajo. Se escriben como texto normal, con espacios y mayúscula inicial, para que se lean fácil en la hoja. Por ejemplo, "Precio presentacion" en vez de "precio_presentacion", "Stock actual" en vez de "stock_actual", "Cliente nombre" en vez de "cliente_nombre".

El código sigue ubicando cada columna por su nombre exacto de cabecera, así que el cambio es solo de cómo se escribe el encabezado. La fuente única de la verdad sobre los nombres sigue siendo el esquema, que ahora lista los nombres legibles.

Una nota para las fórmulas. Cuando una columna tiene espacios en el nombre, las referencias por nombre dentro de la hoja deben manejarlo. Por eso las fórmulas del sistema referencian por rango de columna, no por el texto del encabezado, para no depender de cómo esté escrito el nombre.

## 13. Menos hojas, y las listas salen de Configuración

Se reduce el número de hojas. El criterio es que las listas pequeñas y los catálogos menores no merecen una hoja propia. En vez de eso, viven dentro de la hoja Configuración y se mantienen desde ahí.

Qué se va a Configuración. Los factores de escalado, que antes eran su propia hoja Factores, pasan a ser una sección de Configuración. Los tipos de ajuste de inventario, que estaban escritos en el código, pasan a ser una lista en Configuración. Los tamaños, que ya estaban en Configuración como texto separado por coma, se mantienen ahí, y se pueden mostrar como una lista más clara.

Cómo queda Configuración. Deja de ser una sola tabla de parámetro y valor. Pasa a tener varios bloques, uno debajo de otro, cada uno con su pequeña tabla. Un bloque de parámetros generales, las tarifas, el margen, el IGV, el redondeo. Un bloque de factores de escalado. Un bloque de tamaños. Un bloque de tipos de ajuste. El mantenimiento de cada lista se hace escribiendo en su bloque, y como Configuración es la hoja de ajustes del sistema, aquí sí se permite editar a mano dentro de esos bloques. Los dropdowns de los formularios y las validaciones de las otras hojas leen sus opciones desde estos bloques.

Qué hojas se mantienen aparte. Las que guardan transacciones o catálogos grandes que crecen fila a fila siguen siendo hojas propias, porque no son listas cortas. Clientes, Proveedores, Recetas, Insumos, Presupuestos, Pedidos, Movimientos, Compras, Ventas y Auditoría siguen como hojas. Lo que se elimina o se absorbe son las listas chicas de apoyo.

## 14. Se elimina la hoja Inicio, entra la hoja Resumen

La hoja Inicio desaparece por completo, y con ella la idea de un panel que una función dibuja. En su lugar hay una hoja Resumen cuyo contenido es por completo fórmulas. Ninguna función la calcula ni la refresca. El instalador la crea y le siembra las fórmulas, y de ahí en adelante la hoja se actualiza sola, porque las fórmulas leen las otras hojas en vivo.

Qué muestra Resumen, todo por fórmula. Contadores de presupuestos por estado, contando con COUNTIF sobre la hoja de Presupuestos. Contadores de pedidos por estado, igual sobre Pedidos. Conteo de insumos en rojo y en amarillo, comparando stock contra mínimo con fórmulas sobre Insumos. Una lista de alertas armada con QUERY o FILTER, por ejemplo los presupuestos que vencen pronto o los insumos agotados, jalando las filas que cumplen la condición.

Qué cambia respecto al plan viejo. El plan original decía que Inicio se refresca al abrir el archivo y al volver a ella, mediante código. Eso se elimina. No hay refresco por función, porque las fórmulas ya están vivas y no necesitan que nadie las recalcule. Tampoco hay botones grandes dibujados en la hoja, la navegación queda solo en el menú Sistema, que se mantiene igual. El recorrido de uso y el mapa de navegación del plan se ajustan para que, donde decían Inicio, ahora no haya una parada de panel, sino que la navegación es directa desde el menú, y Resumen es una hoja más que puedes mirar cuando quieras.

## 15. Al cerrar un formulario, ir a la hoja del dato guardado

Cambia el comportamiento posterior al guardado. Antes, tras guardar, la ventana se cerraba y volvías al Inicio. Ahora, tras guardar con éxito, la ventana se cierra y el sistema te lleva a la hoja donde se guardó el dato, con el foco puesto en esa hoja, para que confirmes con tus propios ojos que la fila entró bien.

Ejemplos. Guardas un empleado y al cerrar caes en la hoja de empleados. Guardas un cliente y caes en Clientes. Guardas un insumo y caes en Insumos. Registras una compra y caes en Compras. Ajustas inventario y caes en Movimientos, que es donde quedó el rastro.

Cómo se siente. Guardar dejará de ser un acto a ciegas. Cada vez que completes algo, el sistema te muestra la bodega donde quedó, y como esa hoja puede tener columnas calculadas por fórmula, de paso ves el precio por gramo, el semáforo o lo que corresponda ya resuelto en la fila nueva. Si la hoja del dato no existiera por algún motivo, el sistema avisa en vez de fallar.

Una salvedad. Para las listas con acciones, como Ver presupuestos o Ver pedidos, el comportamiento de cerrar no cambia, porque ahí no estás guardando un dato nuevo sino operando sobre uno existente. Esto aplica a los formularios de alta y edición.

## 16. Qué de esto es fórmula y qué sigue siendo código

Un resumen para que no quede duda, dado lo que se decidió.

Es fórmula, sembrada por el instalador. El precio por gramo o unidad en Insumos. El semáforo de stock en Insumos. Todos los contadores y listas de la hoja Resumen. Las búsquedas que traen un nombre a partir de un código dentro de una hoja, para que las hojas se lean solas sin depender de que el código copie nombres.

Sigue siendo código, porque debe quedar congelado o porque mueve stock o dinero. Guardar un presupuesto con su precio fijo del día. Crear el pedido al aprobar. Descontar stock. Devolver stock al cancelar. Registrar la venta al entregar. Subir stock al registrar una compra. Escribir la auditoría. Estas no se pueden volver fórmula, porque una fórmula recalcularía y eso rompería el congelado y la trazabilidad.

El punto de equilibrio. Las hojas de catálogo y la de Resumen se vuelven inteligentes, se calculan solas y se leen sin ayuda del código. Las hojas de transacción siguen siendo un registro histórico fiel, escrito por el código y nunca recalculado. Cada parte hace lo que mejor sabe hacer.

## 17. Ajustes que esto provoca en el resto del plan

Para que la adición sea coherente con lo ya escrito, estos puntos del plan original quedan modificados.

La sección 3, La hoja Inicio, se elimina y se reemplaza por la idea de la hoja Resumen descrita aquí en el punto 14.

En la sección 2, El menú principal, el ítem Ir al Inicio pasa a llamarse Ir al Resumen y lleva a la hoja Resumen. Lo demás del menú se mantiene.

En la sección 5, Reglas generales, donde dice que tras guardar la ventana se cierra y vuelve al Inicio, ahora dice que vuelve a la hoja del dato guardado, según el punto 15.

La hoja Factores deja de existir como hoja y pasa a ser un bloque dentro de Configuración, según el punto 13. Donde el plan o el escalado mencionen la hoja Factores, ahora se entiende el bloque de factores de Configuración.

El campo Tipo de ajuste de la pantalla 6.7 toma sus opciones del bloque de tipos de ajuste de Configuración, en vez de tenerlas fijas en el código.

Todo lo demás del plan, las pantallas, los campos, las validaciones, el cálculo del precio y el recorrido de uso, se mantiene tal como está.
