/**
 * Esquema.gs
 * Fuente unica de la verdad de la estructura de datos.
 * El instalador crea y repara las hojas comparandolas contra esto, y ademas
 * siembra las formulas de las columnas calculadas (ver Instalador.js).
 *
 * Cada hoja de datos define:
 *   archivo: 'op' | 'cat'  (informativo; todo vive en un solo archivo).
 *   nombre:  nombre de la pestana (usar HOJA.X).
 *   titulo_hoja: texto grande en la fila 1, dice que guarda la hoja.
 *   columnas: lista ordenada de { slug, titulo, num?, moneda?, calc? }.
 *       slug   -> clave interna que usa el codigo (no cambia).
 *       titulo -> encabezado legible que se ve en la hoja (fila 2).
 *       num/moneda -> formato de la columna.
 *       calc(L) -> si existe, la columna es CALCULADA por formula. L es el mapa
 *                  slug->letra de columna; devuelve el cuerpo de la ARRAYFORMULA
 *                  (sin el '='). El codigo NUNCA escribe estas columnas.
 *   validaciones: { slug: [valores...] } para dropdowns por celda.
 *
 * Hojas especiales:
 *   CONFIG  (esConfig): varios bloques editables a mano (generales, factores,
 *           tamanos, tipos de ajuste). Ver Configuracion.js.
 *   RESUMEN (esResumen): 100% formulas, sembrada por el instalador. Sin codigo.
 *
 * Layout de toda hoja de datos: fila 1 titulo grande, fila 2 cabeceras, datos
 * desde la fila 3 (constantes FILA_TITULO/FILA_HEADER/FILA_DATOS en Util.js).
 */

var VERSION_SISTEMA = '1.1';

// Nombres de las hojas, centralizados para no escribir strings sueltos.
var HOJA = {
  CONFIG: 'Config',
  INSUMOS: 'Insumos',
  PRESUPUESTOS: 'Presupuestos',
  PRESUPUESTO_DETALLE: 'PresupuestoDetalle',
  PEDIDOS: 'Pedidos',
  PEDIDO_REQ: 'PedidoRequerimientos',
  MOVIMIENTOS: 'Movimientos',
  COMPRAS: 'Compras',
  COMPRA_DETALLE: 'CompraDetalle',
  VENTAS: 'Ventas',
  AUDITORIA: 'Auditoria',
  RESUMEN: 'Resumen',
  CLIENTES: 'Clientes',
  PROVEEDORES: 'Proveedores',
  RECETAS: 'Recetas',
  RECETA_ING: 'RecetaIngredientes',
  REGLAS_EMPAQUE: 'ReglasEmpaque'
};

/**
 * Definicion completa del esquema. Funcion (no const) para estar disponible
 * desde cualquier archivo .gs.
 */
function definicionEsquema() {
  return [

    // ====================== Configuracion (bloques) ======================
    {
      archivo: 'op', nombre: HOJA.CONFIG, esConfig: true,
      titulo_hoja: 'Configuración — ajustes del sistema',
      // Cada bloque: clave, titulo, cabeceras y filas semilla.
      bloques: [
        {
          clave: 'generales', titulo: 'Parámetros generales',
          cols: ['Parámetro', 'Valor'],
          filas: [
            ['tarifa_mano_obra_hora', 12],
            ['costo_indirecto_pedido', 5],
            ['depreciacion_pedido', 3],
            ['margen_defecto', 35],
            ['aplicar_igv', 'SI'],
            ['tasa_igv', 18],
            ['redondeo', 'MULTIPLO_5'],
            ['dias_vencimiento', 15],
            ['momento_descuento_stock', 'APROBAR'],
            ['nombre_negocio', 'Sistema'],
            ['version_sistema', VERSION_SISTEMA]
          ]
        },
        {
          clave: 'factores', titulo: 'Factores de escalado',
          cols: ['Código', 'Etiqueta', 'Orden'],
          filas: [
            [0.25, '1/4', 1], [0.5, '1/2', 2], [0.75, '3/4', 3],
            [1, '1', 4], [1.5, '1.5', 5], [2, '2', 6], [3, '3', 7]
          ]
        },
        {
          clave: 'tamanos', titulo: 'Tamaños',
          cols: ['Nombre', 'Factor'],
          filas: [['chico', 0.5], ['mediano', 1], ['grande', 2]]
        },
        {
          clave: 'tipos_ajuste', titulo: 'Tipos de ajuste',
          cols: ['Nombre', 'Signo'],
          // signo: -1 resta, 1 suma, 0 toma el signo del numero (conteo).
          filas: [['merma', -1], ['daño', -1], ['vencimiento', -1],
                  ['conteo', 0], ['devolución', 1]]
        }
      ]
    },

    // ====================== Insumos (con columnas calculadas) ============
    {
      archivo: 'op', nombre: HOJA.INSUMOS,
      titulo_hoja: 'Insumos — catálogo, costo y stock',
      columnas: [
        { slug: 'id', titulo: 'ID' },
        { slug: 'nombre', titulo: 'Nombre' },
        { slug: 'tipo', titulo: 'Tipo' },
        { slug: 'unidad_base', titulo: 'Unidad base' },
        { slug: 'tamano_presentacion', titulo: 'Tamaño presentación', num: true },
        { slug: 'precio_presentacion', titulo: 'Precio presentación', moneda: true },
        { slug: 'stock_actual', titulo: 'Stock actual', num: true },
        { slug: 'stock_minimo', titulo: 'Stock mínimo', num: true },
        { slug: 'proveedor_recomendado_id', titulo: 'Proveedor recomendado (ID)' },
        { slug: 'creado_en', titulo: 'Creado en' },
        { slug: 'actualizado_en', titulo: 'Actualizado en' },
        // Calculadas (a la derecha):
        { slug: 'precio_por_unidad_base', titulo: 'Precio por unidad base', moneda: true,
          calc: function (L) {
            return 'ARRAYFORMULA(IF(LEN(' + L.precio_presentacion + '3:' + L.precio_presentacion + ')=0,,'
              + 'IFERROR(' + L.precio_presentacion + '3:' + L.precio_presentacion + '/'
              + L.tamano_presentacion + '3:' + L.tamano_presentacion + ',0)))';
          } },
        { slug: 'semaforo', titulo: 'Semáforo',
          calc: function (L) {
            return 'ARRAYFORMULA(IF(LEN(' + L.id + '3:' + L.id + ')=0,,'
              + 'IF(' + L.stock_actual + '3:' + L.stock_actual + '<=0,"rojo",'
              + 'IF(' + L.stock_actual + '3:' + L.stock_actual + '<=' + L.stock_minimo + '3:' + L.stock_minimo + ',"amarillo","verde"))))';
          } }
      ],
      validaciones: { tipo: ['ingrediente', 'empaque'], unidad_base: ['g', 'u'] }
    },

    // ====================== Presupuestos (congelado) =====================
    {
      archivo: 'op', nombre: HOJA.PRESUPUESTOS,
      titulo_hoja: 'Presupuestos — historial con precios congelados',
      columnas: [
        { slug: 'id', titulo: 'ID' },
        { slug: 'cliente_id', titulo: 'Cliente (ID)' },
        { slug: 'cliente_nombre', titulo: 'Cliente' },
        { slug: 'receta_id', titulo: 'Receta (ID)' },
        { slug: 'receta_nombre', titulo: 'Receta' },
        { slug: 'modo_escalado', titulo: 'Modo escalado' },
        { slug: 'valor_escalado', titulo: 'Valor escalado', num: true },
        { slug: 'factor_aplicado', titulo: 'Factor', num: true },
        { slug: 'raciones_resultantes', titulo: 'Raciones', num: true },
        { slug: 'costo_ingredientes', titulo: 'Costo ingredientes', moneda: true },
        { slug: 'costo_materiales', titulo: 'Costo materiales', moneda: true },
        { slug: 'costo_mano_obra', titulo: 'Costo mano de obra', moneda: true },
        { slug: 'costo_indirecto', titulo: 'Costo indirecto', moneda: true },
        { slug: 'costo_depreciacion', titulo: 'Depreciación', moneda: true },
        { slug: 'costo_total', titulo: 'Costo total', moneda: true },
        { slug: 'margen', titulo: 'Margen %', num: true },
        { slug: 'precio_con_margen', titulo: 'Precio con margen', moneda: true },
        { slug: 'aplica_igv', titulo: 'Aplica IGV' },
        { slug: 'tasa_igv', titulo: 'Tasa IGV', num: true },
        { slug: 'monto_igv', titulo: 'Monto IGV', moneda: true },
        { slug: 'redondeo_aplicado', titulo: 'Redondeo', moneda: true },
        { slug: 'precio_final', titulo: 'Precio final', moneda: true },
        { slug: 'notas', titulo: 'Notas' },
        { slug: 'estado', titulo: 'Estado' },
        { slug: 'motivo_rechazo', titulo: 'Motivo rechazo' },
        { slug: 'fecha_emision', titulo: 'Fecha emisión' },
        { slug: 'fecha_vencimiento', titulo: 'Fecha vencimiento' },
        { slug: 'pedido_id', titulo: 'Pedido (ID)' },
        { slug: 'creado_en', titulo: 'Creado en' },
        { slug: 'usuario', titulo: 'Usuario' }
      ]
    },

    {
      archivo: 'op', nombre: HOJA.PRESUPUESTO_DETALLE,
      titulo_hoja: 'Detalle de presupuestos — líneas congeladas',
      columnas: [
        { slug: 'id_linea', titulo: 'ID línea' },
        { slug: 'presupuesto_id', titulo: 'Presupuesto (ID)' },
        { slug: 'tipo', titulo: 'Tipo' },
        { slug: 'insumo_id', titulo: 'Insumo (ID)' },
        { slug: 'nombre', titulo: 'Nombre' },
        { slug: 'cantidad', titulo: 'Cantidad', num: true },
        { slug: 'unidad', titulo: 'Unidad' },
        { slug: 'precio_unitario', titulo: 'Precio unitario', moneda: true },
        { slug: 'subtotal', titulo: 'Subtotal', moneda: true }
      ]
    },

    {
      archivo: 'op', nombre: HOJA.PEDIDOS,
      titulo_hoja: 'Pedidos — producción y entrega',
      columnas: [
        { slug: 'id', titulo: 'ID' },
        { slug: 'presupuesto_id', titulo: 'Presupuesto (ID)' },
        { slug: 'cliente_id', titulo: 'Cliente (ID)' },
        { slug: 'cliente_nombre', titulo: 'Cliente' },
        { slug: 'receta_nombre', titulo: 'Receta' },
        { slug: 'estado', titulo: 'Estado' },
        { slug: 'fecha_creacion', titulo: 'Fecha creación' },
        { slug: 'fecha_entrega', titulo: 'Fecha entrega' },
        { slug: 'motivo_cancelacion', titulo: 'Motivo cancelación' },
        { slug: 'usuario', titulo: 'Usuario' }
      ]
    },

    {
      archivo: 'op', nombre: HOJA.PEDIDO_REQ,
      titulo_hoja: 'Requerimientos de pedidos — materiales por pedido',
      columnas: [
        { slug: 'id_linea', titulo: 'ID línea' },
        { slug: 'pedido_id', titulo: 'Pedido (ID)' },
        { slug: 'insumo_id', titulo: 'Insumo (ID)' },
        { slug: 'insumo_nombre', titulo: 'Insumo' },
        { slug: 'cantidad_necesaria', titulo: 'Cantidad necesaria', num: true },
        { slug: 'faltante', titulo: 'Faltante', num: true }
      ]
    },

    {
      archivo: 'op', nombre: HOJA.MOVIMIENTOS,
      titulo_hoja: 'Movimientos — historial de stock',
      columnas: [
        { slug: 'id', titulo: 'ID' },
        { slug: 'fecha', titulo: 'Fecha' },
        { slug: 'insumo_id', titulo: 'Insumo (ID)' },
        { slug: 'insumo_nombre', titulo: 'Insumo' },
        { slug: 'tipo', titulo: 'Tipo' },
        { slug: 'cantidad', titulo: 'Cantidad', num: true },
        { slug: 'referencia', titulo: 'Referencia' },
        { slug: 'motivo', titulo: 'Motivo' },
        { slug: 'stock_resultante', titulo: 'Stock resultante', num: true },
        { slug: 'usuario', titulo: 'Usuario' }
      ]
    },

    {
      archivo: 'op', nombre: HOJA.COMPRAS,
      titulo_hoja: 'Compras — recepciones a proveedores',
      columnas: [
        { slug: 'id', titulo: 'ID' },
        { slug: 'proveedor_id', titulo: 'Proveedor (ID)' },
        { slug: 'proveedor_nombre', titulo: 'Proveedor' },
        { slug: 'fecha', titulo: 'Fecha' },
        { slug: 'usuario', titulo: 'Usuario' }
      ]
    },

    {
      archivo: 'op', nombre: HOJA.COMPRA_DETALLE,
      titulo_hoja: 'Detalle de compras — líneas recibidas',
      columnas: [
        { slug: 'id_linea', titulo: 'ID línea' },
        { slug: 'compra_id', titulo: 'Compra (ID)' },
        { slug: 'insumo_id', titulo: 'Insumo (ID)' },
        { slug: 'insumo_nombre', titulo: 'Insumo' },
        { slug: 'cantidad_recibida_present', titulo: 'Cantidad recibida (present.)', num: true },
        { slug: 'precio_presentacion_pagado', titulo: 'Precio presentación pagado', moneda: true },
        { slug: 'tamano_presentacion', titulo: 'Tamaño presentación', num: true },
        { slug: 'cantidad_unidad_base', titulo: 'Cantidad en unidad base', num: true },
        { slug: 'precio_por_unidad_base', titulo: 'Precio por unidad base', moneda: true }
      ]
    },

    {
      archivo: 'op', nombre: HOJA.VENTAS,
      titulo_hoja: 'Ventas — pedidos entregados',
      columnas: [
        { slug: 'id', titulo: 'ID' },
        { slug: 'pedido_id', titulo: 'Pedido (ID)' },
        { slug: 'cliente_id', titulo: 'Cliente (ID)' },
        { slug: 'cliente_nombre', titulo: 'Cliente' },
        { slug: 'monto', titulo: 'Monto', moneda: true },
        { slug: 'fecha', titulo: 'Fecha' }
      ]
    },

    {
      archivo: 'op', nombre: HOJA.AUDITORIA,
      titulo_hoja: 'Auditoría — registro de cambios',
      columnas: [
        { slug: 'fecha', titulo: 'Fecha' },
        { slug: 'usuario', titulo: 'Usuario' },
        { slug: 'accion', titulo: 'Acción' },
        { slug: 'entidad', titulo: 'Entidad' },
        { slug: 'entidad_id', titulo: 'Entidad (ID)' },
        { slug: 'campo', titulo: 'Campo' },
        { slug: 'valor_anterior', titulo: 'Valor anterior' },
        { slug: 'valor_nuevo', titulo: 'Valor nuevo' },
        { slug: 'detalle', titulo: 'Detalle' }
      ]
    },

    // ====================== Resumen (100% formulas) ======================
    {
      archivo: 'op', nombre: HOJA.RESUMEN, esResumen: true,
      titulo_hoja: 'Resumen — estado del negocio en vivo'
    },

    // ====================== Catalogos comerciales =======================
    {
      archivo: 'cat', nombre: HOJA.CLIENTES,
      titulo_hoja: 'Clientes — contactos',
      columnas: [
        { slug: 'id', titulo: 'ID' },
        { slug: 'nombre', titulo: 'Nombre' },
        { slug: 'telefono', titulo: 'Teléfono' },
        { slug: 'notas', titulo: 'Notas' },
        { slug: 'creado_en', titulo: 'Creado en' }
      ]
    },

    {
      archivo: 'cat', nombre: HOJA.PROVEEDORES,
      titulo_hoja: 'Proveedores — contactos y WhatsApp',
      columnas: [
        { slug: 'id', titulo: 'ID' },
        { slug: 'nombre', titulo: 'Nombre' },
        { slug: 'whatsapp', titulo: 'WhatsApp' },
        { slug: 'notas', titulo: 'Notas' },
        { slug: 'creado_en', titulo: 'Creado en' }
      ]
    },

    {
      archivo: 'cat', nombre: HOJA.RECETAS,
      titulo_hoja: 'Recetas — fórmulas de producto',
      columnas: [
        { slug: 'id', titulo: 'ID' },
        { slug: 'nombre', titulo: 'Nombre' },
        { slug: 'categoria', titulo: 'Categoría' },
        { slug: 'tipo_base', titulo: 'Tipo de base' },
        { slug: 'raciones_base', titulo: 'Valor de la base', num: true },
        { slug: 'tiempo_mano_obra_horas', titulo: 'Tiempo mano de obra (h)', num: true },
        { slug: 'creado_en', titulo: 'Creado en' }
      ],
      validaciones: { tipo_base: ['personas', 'tamano'] }
    },

    {
      archivo: 'cat', nombre: HOJA.RECETA_ING,
      titulo_hoja: 'Ingredientes de recetas',
      columnas: [
        { slug: 'id_linea', titulo: 'ID línea' },
        { slug: 'receta_id', titulo: 'Receta (ID)' },
        { slug: 'insumo_id', titulo: 'Insumo (ID)' },
        { slug: 'cantidad_base', titulo: 'Cantidad base', num: true }
      ]
    },

    {
      archivo: 'cat', nombre: HOJA.REGLAS_EMPAQUE,
      titulo_hoja: 'Reglas de empaque — empaque sugerido por receta y tamaño',
      columnas: [
        { slug: 'id_regla', titulo: 'ID regla' },
        { slug: 'receta_id', titulo: 'Receta (ID)' },
        { slug: 'tamano', titulo: 'Tamaño' },
        { slug: 'insumo_empaque_id', titulo: 'Empaque (ID)' },
        { slug: 'cantidad', titulo: 'Cantidad', num: true }
      ]
    }
  ];
}

// ---------- Ayudantes del esquema ----------

/** Columnas (base + calculadas) en orden, o [] si la hoja no las usa. */
function columnasDe(def) { return (def && def.columnas) ? def.columnas : []; }

/** Slugs en orden. */
function slugsDe(def) { return columnasDe(def).map(function (c) { return c.slug; }); }

/** Titulos legibles en orden. */
function titulosDe(def) { return columnasDe(def).map(function (c) { return c.titulo; }); }

/** Solo columnas calculadas (las que tienen .calc). */
function columnasCalc(def) { return columnasDe(def).filter(function (c) { return typeof c.calc === 'function'; }); }

/** True si el slug es una columna calculada (no la escribe el codigo). */
function esColumnaCalc(def, slug) {
  return columnasDe(def).some(function (c) { return c.slug === slug && typeof c.calc === 'function'; });
}

/** Titulo legible de un slug (o el slug si no se halla). */
function tituloDeSlug(def, slug) {
  var c = columnasDe(def).filter(function (x) { return x.slug === slug; })[0];
  return c ? c.titulo : slug;
}

/** Slug a partir del titulo legible (o el titulo si no se halla). */
function slugDeTitulo(def, titulo) {
  var c = columnasDe(def).filter(function (x) { return String(x.titulo) === String(titulo); })[0];
  return c ? c.slug : titulo;
}

/** Mapa slug -> letra de columna (A, B, C...), segun el orden de columnas. */
function mapaColumnasLetra(def) {
  var m = {};
  columnasDe(def).forEach(function (c, i) { m[c.slug] = columnaLetra(i + 1); });
  return m;
}

/** Numero de columna (1-based) -> letra. */
function columnaLetra(n) {
  var s = '';
  while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/** Prefijos para los ids legibles de cada entidad. */
function prefijoId(nombreHoja) {
  var p = {};
  p[HOJA.INSUMOS] = 'IN';
  p[HOJA.PRESUPUESTOS] = 'P';
  p[HOJA.PEDIDOS] = 'PD';
  p[HOJA.MOVIMIENTOS] = 'MV';
  p[HOJA.COMPRAS] = 'CMP';
  p[HOJA.VENTAS] = 'VT';
  p[HOJA.CLIENTES] = 'CL';
  p[HOJA.PROVEEDORES] = 'PR';
  p[HOJA.RECETAS] = 'RC';
  p[HOJA.RECETA_ING] = 'RI';
  p[HOJA.REGLAS_EMPAQUE] = 'RL';
  p[HOJA.PRESUPUESTO_DETALLE] = 'PDL';
  p[HOJA.PEDIDO_REQ] = 'REQ';
  p[HOJA.COMPRA_DETALLE] = 'CDL';
  return p[nombreHoja] || 'ID';
}
