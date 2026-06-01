/**
 * Esquema.gs
 * Fuente unica de la verdad de la estructura de datos.
 * El instalador crea y repara las hojas comparandolas contra esto.
 * NO se borra nada nunca. Solo se crea lo que falta y se agregan columnas faltantes.
 *
 * Cada hoja define:
 *   archivo: 'op'  -> Archivo 1 (Operacion, donde vive este codigo)
 *            'cat' -> Archivo 2 (Catalogos comerciales)
 *   headers: nombres exactos de las columnas, en orden.
 *   numericas: columnas que se formatean como numero.
 *   moneda: columnas que se formatean como moneda.
 *   seed: filas que se siembran SOLO si la hoja esta vacia.
 *   validaciones: { columna: [valores...] } para dropdowns por celda.
 */

var VERSION_SISTEMA = '1.0';

// Nombres de las hojas, centralizados para no escribir strings sueltos.
var HOJA = {
  // Archivo 1, Operacion
  CONFIG: 'Config',
  FACTORES: 'Factores',
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
  INICIO: 'Inicio',
  // Archivo 2, Catalogos comerciales
  CLIENTES: 'Clientes',
  PROVEEDORES: 'Proveedores',
  RECETAS: 'Recetas',
  RECETA_ING: 'RecetaIngredientes',
  REGLAS_EMPAQUE: 'ReglasEmpaque'
};

/**
 * Devuelve la definicion completa del esquema.
 * Es una funcion (no const) para que este disponible desde cualquier archivo .gs.
 */
function definicionEsquema() {
  return [

    // ====================== ARCHIVO 1 (Operacion) ======================

    {
      archivo: 'op', nombre: HOJA.CONFIG,
      headers: ['parametro', 'valor', 'descripcion'],
      seed: [
        ['tarifa_mano_obra_hora', 12, 'Tarifa de mano de obra por hora'],
        ['costo_indirecto_pedido', 5, 'Costo indirecto fijo por pedido'],
        ['depreciacion_pedido', 3, 'Depreciacion fija por pedido'],
        ['margen_defecto', 35, 'Margen de ganancia por defecto en % (sobre la venta)'],
        ['aplicar_igv', 'SI', 'Aplicar IGV por defecto (SI / NO)'],
        ['tasa_igv', 18, 'Tasa de IGV en %'],
        ['redondeo', 'MULTIPLO_5', 'Redondeo del precio (NINGUNO / MULTIPLO_5)'],
        ['dias_vencimiento', 15, 'Dias de vencimiento del presupuesto'],
        ['momento_descuento_stock', 'APROBAR', 'Cuando baja el stock (APROBAR / PRODUCCION)'],
        ['lista_tamanos', 'chico, mediano, grande', 'Tamanos para reglas de empaque, separados por coma'],
        ['nombre_negocio', 'Sistema', 'Nombre del menu y del negocio'],
        ['version_sistema', VERSION_SISTEMA, 'Version del esquema instalado']
      ]
    },

    {
      archivo: 'op', nombre: HOJA.FACTORES,
      headers: ['codigo', 'label', 'orden'],
      numericas: ['codigo', 'orden'],
      seed: [
        [0.25, '1/4', 1],
        [0.5, '1/2', 2],
        [0.75, '3/4', 3],
        [1, '1', 4],
        [1.5, '1.5', 5],
        [2, '2', 6],
        [3, '3', 7]
      ]
    },

    {
      archivo: 'op', nombre: HOJA.INSUMOS,
      headers: ['id', 'nombre', 'tipo', 'unidad_base', 'tamano_presentacion',
                'precio_presentacion', 'precio_por_unidad_base', 'stock_actual',
                'stock_minimo', 'proveedor_recomendado_id', 'creado_en', 'actualizado_en'],
      numericas: ['tamano_presentacion', 'stock_actual', 'stock_minimo'],
      moneda: ['precio_presentacion', 'precio_por_unidad_base'],
      validaciones: { tipo: ['ingrediente', 'empaque'], unidad_base: ['g', 'u'] }
    },

    {
      archivo: 'op', nombre: HOJA.PRESUPUESTOS,
      headers: ['id', 'cliente_id', 'cliente_nombre', 'receta_id', 'receta_nombre',
                'modo_escalado', 'valor_escalado', 'factor_aplicado', 'raciones_resultantes',
                'costo_ingredientes', 'costo_materiales', 'costo_mano_obra',
                'costo_indirecto', 'costo_depreciacion', 'costo_total',
                'margen', 'precio_con_margen', 'aplica_igv', 'tasa_igv', 'monto_igv',
                'redondeo_aplicado', 'precio_final', 'notas',
                'estado', 'motivo_rechazo', 'fecha_emision', 'fecha_vencimiento',
                'pedido_id', 'creado_en', 'usuario'],
      moneda: ['costo_ingredientes', 'costo_materiales', 'costo_mano_obra', 'costo_indirecto',
               'costo_depreciacion', 'costo_total', 'precio_con_margen', 'monto_igv',
               'redondeo_aplicado', 'precio_final'],
      numericas: ['valor_escalado', 'factor_aplicado', 'raciones_resultantes', 'margen', 'tasa_igv']
    },

    {
      archivo: 'op', nombre: HOJA.PRESUPUESTO_DETALLE,
      headers: ['id_linea', 'presupuesto_id', 'tipo', 'insumo_id', 'nombre',
                'cantidad', 'unidad', 'precio_unitario', 'subtotal'],
      numericas: ['cantidad'],
      moneda: ['precio_unitario', 'subtotal']
    },

    {
      archivo: 'op', nombre: HOJA.PEDIDOS,
      headers: ['id', 'presupuesto_id', 'cliente_id', 'cliente_nombre', 'receta_nombre',
                'estado', 'fecha_creacion', 'fecha_entrega', 'motivo_cancelacion', 'usuario']
    },

    {
      archivo: 'op', nombre: HOJA.PEDIDO_REQ,
      headers: ['id_linea', 'pedido_id', 'insumo_id', 'insumo_nombre',
                'cantidad_necesaria', 'faltante'],
      numericas: ['cantidad_necesaria', 'faltante']
    },

    {
      archivo: 'op', nombre: HOJA.MOVIMIENTOS,
      headers: ['id', 'fecha', 'insumo_id', 'insumo_nombre', 'tipo',
                'cantidad', 'referencia', 'motivo', 'stock_resultante', 'usuario'],
      numericas: ['cantidad', 'stock_resultante']
    },

    {
      archivo: 'op', nombre: HOJA.COMPRAS,
      headers: ['id', 'proveedor_id', 'proveedor_nombre', 'fecha', 'usuario']
    },

    {
      archivo: 'op', nombre: HOJA.COMPRA_DETALLE,
      headers: ['id_linea', 'compra_id', 'insumo_id', 'insumo_nombre',
                'cantidad_recibida_present', 'precio_presentacion_pagado',
                'tamano_presentacion', 'cantidad_unidad_base', 'precio_por_unidad_base'],
      numericas: ['cantidad_recibida_present', 'tamano_presentacion', 'cantidad_unidad_base'],
      moneda: ['precio_presentacion_pagado', 'precio_por_unidad_base']
    },

    {
      archivo: 'op', nombre: HOJA.VENTAS,
      headers: ['id', 'pedido_id', 'cliente_id', 'cliente_nombre', 'monto', 'fecha'],
      moneda: ['monto']
    },

    {
      archivo: 'op', nombre: HOJA.AUDITORIA,
      headers: ['fecha', 'usuario', 'accion', 'entidad', 'entidad_id',
                'campo', 'valor_anterior', 'valor_nuevo', 'detalle']
    },

    {
      archivo: 'op', nombre: HOJA.INICIO,
      headers: ['panel'],  // hoja de panel, se arma en Fase 3. Aqui solo placeholder.
      esPanel: true
    },

    // ====================== ARCHIVO 2 (Catalogos comerciales) ======================

    {
      archivo: 'cat', nombre: HOJA.CLIENTES,
      headers: ['id', 'nombre', 'telefono', 'notas', 'creado_en']
    },

    {
      archivo: 'cat', nombre: HOJA.PROVEEDORES,
      headers: ['id', 'nombre', 'whatsapp', 'notas', 'creado_en']
    },

    {
      archivo: 'cat', nombre: HOJA.RECETAS,
      headers: ['id', 'nombre', 'categoria', 'raciones_base', 'tiempo_mano_obra_horas', 'creado_en'],
      numericas: ['raciones_base', 'tiempo_mano_obra_horas']
    },

    {
      archivo: 'cat', nombre: HOJA.RECETA_ING,
      headers: ['id_linea', 'receta_id', 'insumo_id', 'cantidad_base'],
      numericas: ['cantidad_base']
    },

    {
      archivo: 'cat', nombre: HOJA.REGLAS_EMPAQUE,
      headers: ['id_regla', 'receta_id', 'tamano', 'insumo_empaque_id', 'cantidad'],
      numericas: ['cantidad']
    }
  ];
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
