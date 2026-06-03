/**
 * Inventario.gs  (Archivo 1)  -- FASE 3
 * El motor del stock. Toda subida o bajada de inventario pasa por moverStock,
 * que actualiza el stock del insumo y deja el rastro en Movimientos.
 * También la pantalla 6.7 de mermas y ajustes.
 */

/** Semáforo según stock y mínimo. */
function semaforoDe(stock, minimo) {
  if (numero(stock) <= 0) return 'rojo';
  if (numero(stock) <= numero(minimo)) return 'amarillo';
  return 'verde';
}

/**
 * Mueve el stock de un insumo y registra el movimiento.
 * cantidad con signo: positivo entra, negativo sale.
 * Devuelve el stock resultante.
 */
function moverStock(insumoId, cantidad, tipo, referencia, motivo) {
  var fila = leerHoja(HOJA.INSUMOS).filas
    .filter(function (i) { return String(i.id) === String(insumoId); })[0];
  if (!fila) throw new Error('No se encontró el insumo ' + insumoId);
  var nuevo = numero(fila.stock_actual) + numero(cantidad);
  actualizarFila(HOJA.INSUMOS, fila._fila, { stock_actual: nuevo, actualizado_en: new Date() });
  agregarFila(HOJA.MOVIMIENTOS, {
    id: siguienteId(HOJA.MOVIMIENTOS), fecha: new Date(),
    insumo_id: insumoId, insumo_nombre: fila.nombre, tipo: tipo,
    cantidad: numero(cantidad), referencia: referencia || '', motivo: motivo || '',
    stock_resultante: nuevo, usuario: usuarioActual()
  });
  return nuevo;
}

// ---------- Ajustar inventario (6.7) ----------

function abrirAjustarInventario() {
  abrirModal('AjustarInventarioForm', 'Ajustar inventario', 760, 600);
}

function datosAjustarInventario() {
  return {
    tipos: tiposAjusteConfig().map(function (t) { return t.nombre; }),
    insumos: leerHoja(HOJA.INSUMOS).filas.map(function (i) {
      return { id: i.id, nombre: i.nombre, unidad_base: i.unidad_base,
               stock_actual: numero(i.stock_actual), stock_minimo: numero(i.stock_minimo) };
    })
  };
}

/** Tipos válidos de ajuste, leídos del bloque Tipos de ajuste de Config. */
function tiposAjuste() {
  return tiposAjusteConfig().map(function (t) { return t.nombre; });
}

/** Aplica el signo del tipo (de Config) a la cantidad. signo 0 = usa el signo del número. */
function signoAjuste(tipo, cantidad) {
  var c = Math.abs(numero(cantidad));
  var t = tiposAjusteConfig().filter(function (x) { return x.nombre === limpiar(tipo); })[0];
  var signo = t ? t.signo : -1;
  if (signo === 0) return numero(cantidad); // conteo: el usuario pone el signo
  return signo > 0 ? c : -c;
}

/** Vista previa del efecto, para que el usuario vea antes de guardar. */
function previsualizarAjuste(insumoId, tipo, cantidad) {
  var fila = leerHoja(HOJA.INSUMOS).filas
    .filter(function (i) { return String(i.id) === String(insumoId); })[0];
  if (!fila) throw new Error('Elige un insumo.');
  var delta = signoAjuste(tipo, cantidad);
  var antes = numero(fila.stock_actual);
  var despues = antes + delta;
  return { antes: antes, delta: delta, despues: despues, unidad: fila.unidad_base,
           semaforo: semaforoDe(despues, fila.stock_minimo) };
}

function ajustarInventario(payload) {
  return conBloqueo(function () {
    var insumoId = limpiar(payload.insumo_id);
    if (!insumoId) throw new Error('Elige un insumo.');
    if (tiposAjuste().indexOf(payload.tipo) < 0) throw new Error('Tipo de ajuste inválido.');
    var cant = numero(payload.cantidad);
    if (cant === 0) throw new Error('La cantidad no puede ser cero.');

    var delta = signoAjuste(payload.tipo, payload.cantidad);
    var nuevo = moverStock(insumoId, delta, payload.tipo, '', limpiar(payload.motivo));
    auditar('ajuste', 'insumo', insumoId, 'stock', '', nuevo, payload.tipo + ' ' + delta);
    irAHojaDelDato(HOJA.MOVIMIENTOS);
    return { ok: true, stock: nuevo, mensaje: 'Ajuste aplicado. Nuevo stock: ' + nuevo + '.' };
  });
}
