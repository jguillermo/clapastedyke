/**
 * Insumos.gs  (Archivo 1)
 * Ventana 6.10. Aqui vive el costo base de todo y el stock.
 * El precio por unidad base se calcula y se guarda: precio_presentacion / tamano_presentacion.
 * Al crear, el stock inicial entra como un movimiento "inicial". Al editar, el stock
 * NO se toca desde este formulario, lo mueven las funciones de compra y ajuste.
 */

function abrirInsumos() {
  abrirModal('InsumosForm', 'Insumos', 820, 720);
}

/** Lista para autocompletar. tipo opcional: 'ingrediente' o 'empaque'. */
function catalogoInsumos(tipo) {
  return leerHoja(HOJA.INSUMOS).filas
    .filter(function (i) { return !tipo || i.tipo === tipo; })
    .map(function (i) {
      return { id: i.id, nombre: i.nombre, tipo: i.tipo, unidad_base: i.unidad_base,
               precio_por_unidad_base: numero(i.precio_por_unidad_base) };
    });
}

function listarInsumos() {
  return leerHoja(HOJA.INSUMOS).filas.map(function (i) {
    var stock = numero(i.stock_actual), min = numero(i.stock_minimo);
    var semaforo = (stock <= 0) ? 'rojo' : (stock <= min ? 'amarillo' : 'verde');
    return {
      id: i.id, nombre: i.nombre, tipo: i.tipo, unidad_base: i.unidad_base,
      tamano_presentacion: numero(i.tamano_presentacion),
      precio_presentacion: numero(i.precio_presentacion),
      precio_por_unidad_base: numero(i.precio_por_unidad_base),
      stock_actual: stock, stock_minimo: min,
      proveedor_recomendado_id: i.proveedor_recomendado_id,
      semaforo: semaforo, _fila: i._fila
    };
  });
}

function precioPorUnidad(precioPresent, tamanoPresent) {
  var t = numero(tamanoPresent);
  return t > 0 ? numero(precioPresent) / t : 0;
}

function guardarInsumo(datos) {
  return conBloqueo(function () {
    var nombre = limpiar(datos.nombre);
    if (!nombre) throw new Error('El nombre es obligatorio.');
    if (['ingrediente', 'empaque'].indexOf(datos.tipo) < 0) throw new Error('Elige un tipo valido.');
    if (['g', 'u'].indexOf(datos.unidad_base) < 0) throw new Error('Elige la unidad base.');

    var tamano = numero(datos.tamano_presentacion);
    var precioPres = numero(datos.precio_presentacion);
    var stockMin = numero(datos.stock_minimo);
    if (tamano <= 0) throw new Error('El tamano de la presentacion debe ser mayor que cero.');
    if (precioPres <= 0) throw new Error('El precio de la presentacion debe ser mayor que cero.');
    if (stockMin < 0) throw new Error('El stock minimo no puede ser negativo.');

    var ppu = precioPorUnidad(precioPres, tamano);

    var existentes = leerHoja(HOJA.INSUMOS).filas;
    var dup = existentes.filter(function (i) {
      return String(i.nombre).toLowerCase() === nombre.toLowerCase()
          && String(i.id) !== String(datos.id || '');
    });
    if (dup.length) throw new Error('Ya existe un insumo con ese nombre.');

    if (datos.id) {
      // Edicion: no se toca el stock.
      var f = existentes.filter(function (i) { return String(i.id) === String(datos.id); })[0];
      if (!f) throw new Error('No se encontro el insumo para editar.');
      actualizarFila(HOJA.INSUMOS, f._fila, {
        nombre: nombre, tipo: datos.tipo, unidad_base: datos.unidad_base,
        tamano_presentacion: tamano, precio_presentacion: precioPres,
        precio_por_unidad_base: ppu, stock_minimo: stockMin,
        proveedor_recomendado_id: limpiar(datos.proveedor_recomendado_id),
        actualizado_en: new Date()
      });
      auditar('editar', 'insumo', datos.id, 'precio_por_unidad_base', f.precio_por_unidad_base, ppu, nombre);
      return { ok: true, id: datos.id, mensaje: 'Insumo actualizado.' };
    } else {
      // Alta: el stock inicial entra como movimiento.
      var stockIni = numero(datos.stock_inicial);
      if (stockIni < 0) throw new Error('El stock inicial no puede ser negativo.');
      var id = siguienteId(HOJA.INSUMOS);
      agregarFila(HOJA.INSUMOS, {
        id: id, nombre: nombre, tipo: datos.tipo, unidad_base: datos.unidad_base,
        tamano_presentacion: tamano, precio_presentacion: precioPres,
        precio_por_unidad_base: ppu, stock_actual: stockIni, stock_minimo: stockMin,
        proveedor_recomendado_id: limpiar(datos.proveedor_recomendado_id),
        creado_en: new Date(), actualizado_en: new Date()
      });
      if (stockIni > 0) {
        agregarFila(HOJA.MOVIMIENTOS, {
          id: siguienteId(HOJA.MOVIMIENTOS), fecha: new Date(), insumo_id: id,
          insumo_nombre: nombre, tipo: 'inicial', cantidad: stockIni,
          referencia: id, motivo: 'Stock inicial al crear el insumo',
          stock_resultante: stockIni, usuario: usuarioActual()
        });
      }
      auditar('crear', 'insumo', id, '', '', nombre, 'ppu:' + ppu + ' stock_ini:' + stockIni);
      return { ok: true, id: id, mensaje: 'Insumo creado.' };
    }
  });
}
