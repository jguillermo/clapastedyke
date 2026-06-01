/**
 * Presupuestos.gs  (Archivo 1)  -- FASE 2
 * El cerebro del sistema. Toma una receta, la escala, suma costos, aplica margen
 * e IGV, redondea y guarda el presupuesto con todo congelado.
 *
 * Sirve a tres ventanas:
 *   NuevoPresupuesto.html   -> crear y calcular en vivo
 *   VerPresupuestos.html    -> lista con filtros y acciones
 *   DetallePresupuesto.html -> snapshot de solo lectura con Aprobar / Rechazar
 *
 * Decisiones de cálculo (confirmadas):
 *   factor por raciones  = raciones_pedidas / raciones_base
 *   factor por factor    = el código elegido de la hoja Factores
 *   ingredientes escalan por el factor.
 *   mano de obra escala por el factor (tiempo_base * factor * tarifa).
 *   indirecto y depreciación son fijos por pedido.
 *   precio_con_margen = costo_total / (1 - margen)   (margen sobre la venta)
 *   IGV sobre ese precio. Redondeo hacia arriba al múltiplo de 5.
 *   El empaque sale de las reglas por tamaño y NO escala con el factor (es editable).
 */

// ---------- Ventanas ----------

function abrirNuevoPresupuesto() {
  abrirModal('NuevoPresupuestoForm', 'Nuevo presupuesto', 900, 820);
}
function abrirVerPresupuestos() {
  abrirModal('VerPresupuestosForm', 'Ver presupuestos', 920, 760);
}

/** Abre el detalle congelado de un presupuesto. Reemplaza la ventana actual. */
function abrirDetallePresupuesto(id) {
  var t = HtmlService.createTemplateFromFile('DetallePresupuestoForm');
  t.presupuestoId = id;
  var html = t.evaluate().setWidth(720).setHeight(780);
  SpreadsheetApp.getUi().showModalDialog(html, 'Detalle ' + id);
}

// ---------- Datos que necesita la ventana al abrir ----------

function datosNuevoPresupuesto() {
  var cfg = getConfig();
  return {
    clientes: catalogoClientes(),
    recetas: catalogoRecetas(),
    factores: leerHoja(HOJA.FACTORES).filas
      .sort(function (a, b) { return numero(a.orden) - numero(b.orden); })
      .map(function (f) { return { codigo: numero(f.codigo), label: f.label }; }),
    tamanos: listaTamanos(),
    config: {
      margen_defecto: numero(cfg.margen_defecto),
      aplicar_igv: limpiar(cfg.aplicar_igv) || 'SI',
      tasa_igv: numero(cfg.tasa_igv),
      redondeo: limpiar(cfg.redondeo) || 'MULTIPLO_5',
      dias_vencimiento: numero(cfg.dias_vencimiento)
    }
  };
}

/** Empaques sugeridos para una receta y un tamaño, listos para prellenar. */
function empaquesSugeridos(recetaId, tamano) {
  var insumos = {};
  leerHoja(HOJA.INSUMOS).filas.forEach(function (i) {
    insumos[i.id] = { nombre: i.nombre, precio: numero(i.precio_por_unidad_base), unidad: i.unidad_base };
  });
  return leerHoja(HOJA.REGLAS_EMPAQUE).filas
    .filter(function (r) { return String(r.receta_id) === String(recetaId) && String(r.tamano) === String(tamano); })
    .map(function (r) {
      var info = insumos[r.insumo_empaque_id] || { nombre: '(empaque eliminado)', precio: 0, unidad: '' };
      return { insumo_id: r.insumo_empaque_id, nombre: info.nombre,
               precio: info.precio, unidad: info.unidad, cantidad: numero(r.cantidad) };
    });
}

// ---------- Motor de cálculo ----------

/**
 * Calcula el presupuesto a partir de lo que el usuario eligió.
 * payload: { receta_id, modo_escalado, valor_escalado, empaques:[{insumo_id,cantidad}],
 *            margen, aplica_igv ('SI'/'NO') }
 * Devuelve el desglose completo y las líneas, tanto para la vista previa como para guardar.
 */
function calcularPresupuesto(payload) {
  var cfg = getConfig();

  // Receta y sus datos.
  var receta = leerHoja(HOJA.RECETAS).filas
    .filter(function (r) { return String(r.id) === String(payload.receta_id); })[0];
  if (!receta) throw new Error('Elige una receta válida.');
  var racionesBase = numero(receta.raciones_base);
  if (racionesBase <= 0) throw new Error('La receta no tiene raciones base válidas.');

  // Factor según el modo.
  var valor = numero(payload.valor_escalado);
  var factor, racionesResultantes;
  if (payload.modo_escalado === 'factor') {
    if (valor <= 0) throw new Error('Elige un factor.');
    factor = valor;
    racionesResultantes = racionesBase * factor;
  } else { // 'raciones'
    if (valor <= 0) throw new Error('Indica cuántas raciones quieres.');
    factor = valor / racionesBase;
    racionesResultantes = valor;
  }

  // Insumos en un mapa para precios y nombres.
  var insumos = {};
  leerHoja(HOJA.INSUMOS).filas.forEach(function (i) {
    insumos[i.id] = { nombre: i.nombre, precio: numero(i.precio_por_unidad_base), unidad: i.unidad_base };
  });

  // Ingredientes escalados.
  var lineas = [];
  var costoIngredientes = 0;
  leerHoja(HOJA.RECETA_ING).filas
    .filter(function (g) { return String(g.receta_id) === String(payload.receta_id); })
    .forEach(function (g) {
      var info = insumos[g.insumo_id] || { nombre: '(insumo eliminado)', precio: 0, unidad: '' };
      var cantidad = numero(g.cantidad_base) * factor;
      var subtotal = cantidad * info.precio;
      costoIngredientes += subtotal;
      lineas.push({ tipo: 'ingrediente', insumo_id: g.insumo_id, nombre: info.nombre,
                    cantidad: cantidad, unidad: info.unidad, precio_unitario: info.precio, subtotal: subtotal });
    });

  // Empaque y materiales, tal como vienen del formulario (no escalan solos).
  var costoMateriales = 0;
  (payload.empaques || []).forEach(function (e) {
    var cant = numero(e.cantidad);
    if (!limpiar(e.insumo_id) || cant <= 0) return;
    var info = insumos[e.insumo_id] || { nombre: '(empaque eliminado)', precio: 0, unidad: '' };
    var subtotal = cant * info.precio;
    costoMateriales += subtotal;
    lineas.push({ tipo: 'material', insumo_id: e.insumo_id, nombre: info.nombre,
                  cantidad: cant, unidad: info.unidad, precio_unitario: info.precio, subtotal: subtotal });
  });

  // Otros costos.
  var costoManoObra = numero(receta.tiempo_mano_obra_horas) * factor * numero(cfg.tarifa_mano_obra_hora);
  var costoIndirecto = numero(cfg.costo_indirecto_pedido);
  var costoDepreciacion = numero(cfg.depreciacion_pedido);

  var costoTotal = costoIngredientes + costoMateriales + costoManoObra + costoIndirecto + costoDepreciacion;

  // Margen sobre la venta.
  var margen = numero(payload.margen);
  if (margen < 0 || margen >= 100) throw new Error('El margen debe estar entre 0 y 99.');
  var precioConMargen = costoTotal / (1 - margen / 100);

  // IGV.
  var aplicaIgv = (payload.aplica_igv === 'SI');
  var tasaIgv = numero(cfg.tasa_igv);
  var montoIgv = aplicaIgv ? precioConMargen * (tasaIgv / 100) : 0;
  var precioAntesRedondeo = precioConMargen + montoIgv;

  // Redondeo.
  var redondeo = limpiar(cfg.redondeo) || 'MULTIPLO_5';
  var precioFinal = precioAntesRedondeo;
  if (redondeo === 'MULTIPLO_5') precioFinal = Math.ceil(precioAntesRedondeo / 5) * 5;
  var redondeoAplicado = precioFinal - precioAntesRedondeo;

  return {
    factor: factor, raciones_resultantes: racionesResultantes,
    lineas: lineas,
    costo_ingredientes: costoIngredientes, costo_materiales: costoMateriales,
    costo_mano_obra: costoManoObra, costo_indirecto: costoIndirecto, costo_depreciacion: costoDepreciacion,
    costo_total: costoTotal,
    margen: margen, precio_con_margen: precioConMargen,
    aplica_igv: aplicaIgv ? 'SI' : 'NO', tasa_igv: tasaIgv, monto_igv: montoIgv,
    redondeo_aplicado: redondeoAplicado, precio_final: precioFinal
  };
}

// ---------- Guardar ----------

function guardarPresupuesto(payload) {
  return conBloqueo(function () {
    if (!limpiar(payload.cliente_id)) throw new Error('Elige un cliente.');
    // Recalcula en el servidor, no se confía en lo que mande el navegador.
    var calc = calcularPresupuesto(payload);
    var cfg = getConfig();

    var id = siguienteId(HOJA.PRESUPUESTOS);
    var hoy = new Date();
    var vence = new Date(hoy.getTime() + numero(cfg.dias_vencimiento) * 24 * 60 * 60 * 1000);

    agregarFila(HOJA.PRESUPUESTOS, {
      id: id,
      cliente_id: payload.cliente_id, cliente_nombre: limpiar(payload.cliente_nombre),
      receta_id: payload.receta_id, receta_nombre: limpiar(payload.receta_nombre),
      modo_escalado: payload.modo_escalado, valor_escalado: numero(payload.valor_escalado),
      factor_aplicado: calc.factor, raciones_resultantes: calc.raciones_resultantes,
      costo_ingredientes: calc.costo_ingredientes, costo_materiales: calc.costo_materiales,
      costo_mano_obra: calc.costo_mano_obra, costo_indirecto: calc.costo_indirecto,
      costo_depreciacion: calc.costo_depreciacion, costo_total: calc.costo_total,
      margen: calc.margen, precio_con_margen: calc.precio_con_margen,
      aplica_igv: calc.aplica_igv, tasa_igv: calc.tasa_igv, monto_igv: calc.monto_igv,
      redondeo_aplicado: calc.redondeo_aplicado, precio_final: calc.precio_final,
      notas: limpiar(payload.notas),
      estado: 'Pendiente', motivo_rechazo: '',
      fecha_emision: hoy, fecha_vencimiento: vence,
      pedido_id: '', creado_en: hoy, usuario: usuarioActual()
    });

    // Líneas congeladas.
    calc.lineas.forEach(function (l) {
      agregarFila(HOJA.PRESUPUESTO_DETALLE, {
        id_linea: siguienteId(HOJA.PRESUPUESTO_DETALLE), presupuesto_id: id,
        tipo: l.tipo, insumo_id: l.insumo_id, nombre: l.nombre,
        cantidad: l.cantidad, unidad: l.unidad, precio_unitario: l.precio_unitario, subtotal: l.subtotal
      });
    });

    auditar('crear', 'presupuesto', id, '', '', 'Pendiente', 'precio:' + calc.precio_final);
    return { ok: true, id: id, precio_final: calc.precio_final, mensaje: 'Presupuesto ' + id + ' guardado.' };
  });
}

// ---------- Lista y detalle ----------

function fechaCorta(d) {
  if (!d) return '';
  if (Object.prototype.toString.call(d) !== '[object Date]') return String(d);
  return Utilities.formatDate(d, ssOperacion().getSpreadsheetTimeZone(), 'dd/MM/yyyy');
}

function listarPresupuestos() {
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return leerHoja(HOJA.PRESUPUESTOS).filas.map(function (p) {
    var estado = limpiar(p.estado);
    // Un pendiente vencido se muestra como Vencido, sin cambiar lo guardado.
    var vence = p.fecha_vencimiento;
    if (estado === 'Pendiente' && Object.prototype.toString.call(vence) === '[object Date]' && vence < hoy) {
      estado = 'Vencido';
    }
    return {
      id: p.id, cliente_id: p.cliente_id, cliente_nombre: p.cliente_nombre,
      receta_nombre: p.receta_nombre, precio_final: numero(p.precio_final),
      estado: estado, estado_real: limpiar(p.estado),
      fecha_emision: fechaCorta(p.fecha_emision), fecha_vencimiento: fechaCorta(p.fecha_vencimiento)
    };
  });
}

/** Reconstruye el snapshot completo para la ventana de detalle. */
function detallePresupuesto(id) {
  var p = leerHoja(HOJA.PRESUPUESTOS).filas
    .filter(function (x) { return String(x.id) === String(id); })[0];
  if (!p) throw new Error('No se encontró el presupuesto.');
  var lineas = leerHoja(HOJA.PRESUPUESTO_DETALLE).filas
    .filter(function (l) { return String(l.presupuesto_id) === String(id); })
    .map(function (l) {
      return { tipo: l.tipo, nombre: l.nombre, cantidad: numero(l.cantidad),
               unidad: l.unidad, precio_unitario: numero(l.precio_unitario), subtotal: numero(l.subtotal) };
    });
  return {
    id: p.id, cliente_nombre: p.cliente_nombre, receta_nombre: p.receta_nombre,
    modo_escalado: p.modo_escalado, valor_escalado: numero(p.valor_escalado),
    factor_aplicado: numero(p.factor_aplicado), raciones_resultantes: numero(p.raciones_resultantes),
    lineas: lineas,
    costo_ingredientes: numero(p.costo_ingredientes), costo_materiales: numero(p.costo_materiales),
    costo_mano_obra: numero(p.costo_mano_obra), costo_indirecto: numero(p.costo_indirecto),
    costo_depreciacion: numero(p.costo_depreciacion), costo_total: numero(p.costo_total),
    margen: numero(p.margen), precio_con_margen: numero(p.precio_con_margen),
    aplica_igv: p.aplica_igv, tasa_igv: numero(p.tasa_igv), monto_igv: numero(p.monto_igv),
    redondeo_aplicado: numero(p.redondeo_aplicado), precio_final: numero(p.precio_final),
    notas: p.notas, estado: limpiar(p.estado), motivo_rechazo: p.motivo_rechazo,
    fecha_emision: fechaCorta(p.fecha_emision), fecha_vencimiento: fechaCorta(p.fecha_vencimiento)
  };
}

// ---------- Acciones ----------

function aprobarPresupuesto(id) {
  return conBloqueo(function () {
    var p = leerHoja(HOJA.PRESUPUESTOS).filas
      .filter(function (x) { return String(x.id) === String(id); })[0];
    if (!p) throw new Error('No se encontró el presupuesto.');
    if (limpiar(p.estado) !== 'Pendiente') throw new Error('Solo se puede aprobar un presupuesto Pendiente.');

    // Crea el pedido y, según la configuración, descuenta el stock ahora.
    var cfg = getConfig();
    var descontarAhora = (limpiar(cfg.momento_descuento_stock) === 'APROBAR');
    var res = crearPedidoDesdePresupuesto(id, descontarAhora);

    actualizarFila(HOJA.PRESUPUESTOS, p._fila, { estado: 'Aprobado', pedido_id: res.pedidoId });
    auditar('aprobar', 'presupuesto', id, 'estado', 'Pendiente', 'Aprobado', 'pedido:' + res.pedidoId);
    refrescarInicioSeguro();

    var msg = 'Presupuesto ' + id + ' aprobado. Se creó el pedido ' + res.pedidoId + '.';
    if (descontarAhora && res.faltantes.length) {
      msg += ' Quedó stock en falta: ' + res.faltantes.join(', ') + '. Revísalo en Comprar materiales.';
    } else if (!descontarAhora) {
      msg += ' El stock se descontará al iniciar producción.';
    }
    return { ok: true, mensaje: msg, pedido_id: res.pedidoId };
  });
}

function rechazarPresupuesto(id, motivo) {
  return conBloqueo(function () {
    var p = leerHoja(HOJA.PRESUPUESTOS).filas
      .filter(function (x) { return String(x.id) === String(id); })[0];
    if (!p) throw new Error('No se encontró el presupuesto.');
    if (limpiar(p.estado) !== 'Pendiente') throw new Error('Solo se puede rechazar un presupuesto Pendiente.');
    actualizarFila(HOJA.PRESUPUESTOS, p._fila, { estado: 'Rechazado', motivo_rechazo: limpiar(motivo) });
    auditar('rechazar', 'presupuesto', id, 'estado', 'Pendiente', 'Rechazado', limpiar(motivo));
    return { ok: true, mensaje: 'Presupuesto ' + id + ' rechazado.' };
  });
}

/** Alta rápida de cliente desde la ventana de presupuesto. */
function crearClienteRapido(nombre) {
  var r = guardarCliente({ nombre: nombre });
  return { id: r.id, nombre: limpiar(nombre) };
}
