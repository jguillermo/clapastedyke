/**
 * Pedidos.gs  (Archivo 1)  -- FASE 3
 * El pedido nace cuando se aprueba un presupuesto. Aquí vive su ciclo de vida:
 * Pendiente, Producción, Entregado, Cancelado, más el descuento y la devolución de stock.
 */

function abrirVerPedidos() {
  abrirModal('VerPedidosForm', 'Ver pedidos', 920, 760);
}

/** Abre el detalle de un pedido. Reemplaza la ventana actual. */
function abrirDetallePedido(id) {
  var t = HtmlService.createTemplateFromFile('DetallePedidoForm');
  t.pedidoId = id;
  SpreadsheetApp.getUi().showModalDialog(t.evaluate().setWidth(720).setHeight(700), 'Pedido ' + id);
}

/**
 * Crea el pedido a partir de un presupuesto aprobado.
 * Arma los requerimientos de material y, si toca, descuenta stock.
 * Devuelve el id del pedido y la lista de faltantes.
 */
function crearPedidoDesdePresupuesto(presupuestoId, descontarAhora) {
  var p = leerHoja(HOJA.PRESUPUESTOS).filas
    .filter(function (x) { return String(x.id) === String(presupuestoId); })[0];
  if (!p) throw new Error('No se encontró el presupuesto.');

  var pedidoId = siguienteId(HOJA.PEDIDOS);
  agregarFila(HOJA.PEDIDOS, {
    id: pedidoId, presupuesto_id: presupuestoId,
    cliente_id: p.cliente_id, cliente_nombre: p.cliente_nombre, receta_nombre: p.receta_nombre,
    estado: 'Pendiente', fecha_creacion: new Date(), fecha_entrega: '',
    motivo_cancelacion: '', usuario: usuarioActual()
  });

  // Requerimientos: suma de ingredientes y materiales por insumo.
  var stockPorInsumo = {};
  leerHoja(HOJA.INSUMOS).filas.forEach(function (i) { stockPorInsumo[i.id] = numero(i.stock_actual); });

  var agregados = {};
  leerHoja(HOJA.PRESUPUESTO_DETALLE).filas
    .filter(function (l) { return String(l.presupuesto_id) === String(presupuestoId); })
    .forEach(function (l) {
      if (!limpiar(l.insumo_id)) return;
      if (!agregados[l.insumo_id]) agregados[l.insumo_id] = { nombre: l.nombre, cantidad: 0 };
      agregados[l.insumo_id].cantidad += numero(l.cantidad);
    });

  var faltantes = [];
  Object.keys(agregados).forEach(function (insumoId) {
    var necesaria = agregados[insumoId].cantidad;
    var disponible = numero(stockPorInsumo[insumoId]);
    var faltante = Math.max(0, necesaria - disponible);
    agregarFila(HOJA.PEDIDO_REQ, {
      id_linea: siguienteId(HOJA.PEDIDO_REQ), pedido_id: pedidoId,
      insumo_id: insumoId, insumo_nombre: agregados[insumoId].nombre,
      cantidad_necesaria: necesaria, faltante: faltante
    });
    if (faltante > 0) faltantes.push(agregados[insumoId].nombre + ' (' + faltante + ')');
  });

  if (descontarAhora) descontarPedidoSiHaceFalta(pedidoId);

  return { pedidoId: pedidoId, faltantes: faltantes };
}

/** Descuenta el stock del pedido una sola vez. Si ya se hizo, no repite. */
function descontarPedidoSiHaceFalta(pedidoId) {
  var yaHecho = leerHoja(HOJA.MOVIMIENTOS).filas.some(function (m) {
    return String(m.referencia) === String(pedidoId) && m.tipo === 'consumo';
  });
  if (yaHecho) return;
  leerHoja(HOJA.PEDIDO_REQ).filas
    .filter(function (r) { return String(r.pedido_id) === String(pedidoId); })
    .forEach(function (r) {
      moverStock(r.insumo_id, -numero(r.cantidad_necesaria), 'consumo', pedidoId,
                 'Consumo por pedido ' + pedidoId);
    });
}

function listarPedidos() {
  return leerHoja(HOJA.PEDIDOS).filas.map(function (p) {
    return {
      id: p.id, presupuesto_id: p.presupuesto_id, cliente_nombre: p.cliente_nombre,
      receta_nombre: p.receta_nombre, estado: limpiar(p.estado),
      fecha_creacion: fechaCorta(p.fecha_creacion), fecha_entrega: fechaCorta(p.fecha_entrega)
    };
  });
}

function detallePedido(id) {
  var p = leerHoja(HOJA.PEDIDOS).filas.filter(function (x) { return String(x.id) === String(id); })[0];
  if (!p) throw new Error('No se encontró el pedido.');
  var req = leerHoja(HOJA.PEDIDO_REQ).filas
    .filter(function (r) { return String(r.pedido_id) === String(id); })
    .map(function (r) {
      return { insumo_nombre: r.insumo_nombre, cantidad_necesaria: numero(r.cantidad_necesaria),
               faltante: numero(r.faltante) };
    });
  return {
    id: p.id, presupuesto_id: p.presupuesto_id, cliente_nombre: p.cliente_nombre,
    receta_nombre: p.receta_nombre, estado: limpiar(p.estado),
    fecha_creacion: fechaCorta(p.fecha_creacion), fecha_entrega: fechaCorta(p.fecha_entrega),
    motivo_cancelacion: p.motivo_cancelacion, requerimientos: req
  };
}

function iniciarProduccion(id) {
  return conBloqueo(function () {
    var p = leerHoja(HOJA.PEDIDOS).filas.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!p) throw new Error('No se encontró el pedido.');
    if (limpiar(p.estado) !== 'Pendiente') throw new Error('Solo un pedido Pendiente puede pasar a Producción.');
    // Por si la configuración descuenta al iniciar producción, se asegura aquí.
    descontarPedidoSiHaceFalta(id);
    actualizarFila(HOJA.PEDIDOS, p._fila, { estado: 'Producción' });
    auditar('produccion', 'pedido', id, 'estado', 'Pendiente', 'Producción', '');
    refrescarInicioSeguro();
    return { ok: true, mensaje: 'Pedido ' + id + ' en producción.' };
  });
}

function marcarEntregado(id) {
  return conBloqueo(function () {
    var p = leerHoja(HOJA.PEDIDOS).filas.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!p) throw new Error('No se encontró el pedido.');
    if (limpiar(p.estado) !== 'Producción') throw new Error('Solo un pedido en Producción se puede entregar.');

    // Monto de la venta: el precio final del presupuesto de origen.
    var pres = leerHoja(HOJA.PRESUPUESTOS).filas
      .filter(function (x) { return String(x.id) === String(p.presupuesto_id); })[0];
    var monto = pres ? numero(pres.precio_final) : 0;

    actualizarFila(HOJA.PEDIDOS, p._fila, { estado: 'Entregado', fecha_entrega: new Date() });
    agregarFila(HOJA.VENTAS, {
      id: siguienteId(HOJA.VENTAS), pedido_id: id, cliente_id: p.cliente_id,
      cliente_nombre: p.cliente_nombre, monto: monto, fecha: new Date()
    });
    auditar('entregar', 'pedido', id, 'estado', 'Producción', 'Entregado', 'venta:' + monto);
    refrescarInicioSeguro();
    return { ok: true, mensaje: 'Pedido ' + id + ' entregado. Venta por ' + monto + ' registrada.' };
  });
}

function cancelarPedido(id, motivo) {
  return conBloqueo(function () {
    var p = leerHoja(HOJA.PEDIDOS).filas.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!p) throw new Error('No se encontró el pedido.');
    var estado = limpiar(p.estado);
    if (estado !== 'Pendiente' && estado !== 'Producción') {
      throw new Error('Solo se puede cancelar un pedido Pendiente o en Producción.');
    }
    // Devuelve al stock todo lo que se había consumido para este pedido.
    leerHoja(HOJA.MOVIMIENTOS).filas
      .filter(function (m) { return String(m.referencia) === String(id) && m.tipo === 'consumo'; })
      .forEach(function (m) {
        moverStock(m.insumo_id, -numero(m.cantidad), 'cancelacion', id,
                   'Devolución por cancelación del pedido ' + id);
      });
    actualizarFila(HOJA.PEDIDOS, p._fila, { estado: 'Cancelado', motivo_cancelacion: limpiar(motivo) });
    auditar('cancelar', 'pedido', id, 'estado', estado, 'Cancelado', limpiar(motivo));
    refrescarInicioSeguro();
    return { ok: true, mensaje: 'Pedido ' + id + ' cancelado y stock devuelto.' };
  });
}
