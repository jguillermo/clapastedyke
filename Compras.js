/**
 * Compras.gs  (Archivo 1)  -- FASE 3
 * Dos pantallas. Comprar materiales arma la lista de lo que falta y los enlaces de
 * WhatsApp por proveedor. Registrar compra sube el stock y actualiza el precio.
 */

// ---------- Comprar materiales (6.5) ----------

function abrirComprarMateriales() {
  abrirModal('ComprarMaterialesForm', 'Comprar materiales', 880, 720);
}
function abrirRegistrarCompra() {
  abrirModal('RegistrarCompraForm', 'Registrar compra', 860, 720);
}

function datosComprarMateriales() {
  var insumos = leerHoja(HOJA.INSUMOS).filas;
  var prov = {};
  leerHoja(HOJA.PROVEEDORES).filas.forEach(function (p) {
    prov[p.id] = { nombre: p.nombre, whatsapp: p.whatsapp };
  });

  // Pedidos con faltantes y que siguen vivos.
  var estadosVivos = {};
  leerHoja(HOJA.PEDIDOS).filas.forEach(function (p) { estadosVivos[p.id] = { estado: limpiar(p.estado), cliente: p.cliente_nombre }; });
  var faltantesPorPedido = {};
  leerHoja(HOJA.PEDIDO_REQ).filas.forEach(function (r) {
    if (numero(r.faltante) > 0) {
      var e = estadosVivos[r.pedido_id];
      if (e && (e.estado === 'Pendiente' || e.estado === 'Producción')) {
        faltantesPorPedido[r.pedido_id] = (faltantesPorPedido[r.pedido_id] || 0) + 1;
      }
    }
  });
  var pedidos = Object.keys(faltantesPorPedido).map(function (id) {
    return { id: id, cliente_nombre: estadosVivos[id] ? estadosVivos[id].cliente : '' };
  });

  return {
    pedidos: pedidos,
    proveedores: prov,
    insumos: insumos.map(function (i) {
      return {
        id: i.id, nombre: i.nombre, unidad_base: i.unidad_base,
        stock_actual: numero(i.stock_actual), stock_minimo: numero(i.stock_minimo),
        precio_presentacion: numero(i.precio_presentacion),
        tamano_presentacion: numero(i.tamano_presentacion),
        proveedor_recomendado_id: limpiar(i.proveedor_recomendado_id),
        bajo_minimo: numero(i.stock_actual) <= numero(i.stock_minimo)
      };
    })
  };
}

/** Faltantes de un pedido, con datos del insumo y su proveedor. */
function faltantesDePedido(pedidoId) {
  var insumos = {};
  leerHoja(HOJA.INSUMOS).filas.forEach(function (i) {
    insumos[i.id] = { precio: numero(i.precio_presentacion), prov: limpiar(i.proveedor_recomendado_id) };
  });
  return leerHoja(HOJA.PEDIDO_REQ).filas
    .filter(function (r) { return String(r.pedido_id) === String(pedidoId) && numero(r.faltante) > 0; })
    .map(function (r) {
      var info = insumos[r.insumo_id] || { precio: 0, prov: '' };
      return { insumo_id: r.insumo_id, nombre: r.insumo_nombre, faltante: numero(r.faltante),
               precio_presentacion: info.precio, proveedor_recomendado_id: info.prov };
    });
}

// ---------- Registrar compra (6.6) ----------

function datosRegistrarCompra() {
  return {
    proveedores: catalogoProveedores(),
    insumos: leerHoja(HOJA.INSUMOS).filas.map(function (i) {
      return { id: i.id, nombre: i.nombre, unidad_base: i.unidad_base,
               tamano_presentacion: numero(i.tamano_presentacion),
               precio_presentacion: numero(i.precio_presentacion) };
    })
  };
}

/**
 * Registra una compra. Por cada línea sube el stock en unidades base, actualiza
 * el precio de la presentación y recalcula el precio por unidad base.
 * payload: { proveedor_id, proveedor_nombre, fecha,
 *            lineas:[{insumo_id, cantidad_recibida_present, precio_presentacion_pagado}] }
 */
function registrarCompra(payload) {
  return conBloqueo(function () {
    if (!limpiar(payload.proveedor_id)) throw new Error('Elige un proveedor.');
    var lineas = (payload.lineas || []).filter(function (l) {
      return limpiar(l.insumo_id) && numero(l.cantidad_recibida_present) > 0 && numero(l.precio_presentacion_pagado) > 0;
    });
    if (!lineas.length) throw new Error('Agrega al menos una línea con cantidad y precio mayores que cero.');

    var fecha = payload.fecha ? new Date(payload.fecha) : new Date();
    var compraId = siguienteId(HOJA.COMPRAS);
    agregarFila(HOJA.COMPRAS, {
      id: compraId, proveedor_id: payload.proveedor_id,
      proveedor_nombre: limpiar(payload.proveedor_nombre), fecha: fecha, usuario: usuarioActual()
    });

    lineas.forEach(function (l) {
      var insumo = leerHoja(HOJA.INSUMOS).filas
        .filter(function (i) { return String(i.id) === String(l.insumo_id); })[0];
      if (!insumo) throw new Error('Insumo no encontrado: ' + l.insumo_id);
      var tamano = numero(insumo.tamano_presentacion);
      if (tamano <= 0) throw new Error('El insumo ' + insumo.nombre + ' no tiene tamaño de presentación válido.');

      var present = numero(l.cantidad_recibida_present);
      var precioPagado = numero(l.precio_presentacion_pagado);
      var cantidadBase = present * tamano;          // a unidad base (g o u)
      var ppu = precioPagado / tamano;              // nuevo precio por unidad base
      var nuevoStock = numero(insumo.stock_actual) + cantidadBase;

      // Sube stock y actualiza precios en una sola escritura del insumo.
      actualizarFila(HOJA.INSUMOS, insumo._fila, {
        stock_actual: nuevoStock, precio_presentacion: precioPagado,
        precio_por_unidad_base: ppu, actualizado_en: new Date()
      });
      agregarFila(HOJA.MOVIMIENTOS, {
        id: siguienteId(HOJA.MOVIMIENTOS), fecha: fecha, insumo_id: insumo.id,
        insumo_nombre: insumo.nombre, tipo: 'compra', cantidad: cantidadBase,
        referencia: compraId, motivo: 'Compra ' + compraId, stock_resultante: nuevoStock,
        usuario: usuarioActual()
      });
      agregarFila(HOJA.COMPRA_DETALLE, {
        id_linea: siguienteId(HOJA.COMPRA_DETALLE), compra_id: compraId, insumo_id: insumo.id,
        insumo_nombre: insumo.nombre, cantidad_recibida_present: present,
        precio_presentacion_pagado: precioPagado, tamano_presentacion: tamano,
        cantidad_unidad_base: cantidadBase, precio_por_unidad_base: ppu
      });
    });

    auditar('compra', 'compra', compraId, '', '', payload.proveedor_nombre, lineas.length + ' líneas');
    refrescarInicioSeguro();
    return { ok: true, id: compraId, mensaje: 'Compra ' + compraId + ' registrada. Stock y precios actualizados.' };
  });
}
