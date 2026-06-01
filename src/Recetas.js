/**
 * Recetas.gs  (Archivo 2)
 * Ventana 6.9. Cabecera de la receta mas su lista de ingredientes.
 * La receta se define en raciones (raciones_base). El escalado del presupuesto
 * (Fase 2) multiplica todo segun raciones pedidas / raciones_base, o por un factor.
 * La unidad de cada ingrediente se toma sola del insumo, no se guarda aparte.
 */

function abrirRecetas() {
  abrirModal('RecetasForm', 'Recetas', 880, 760);
}

function catalogoRecetas() {
  return leerHoja(HOJA.RECETAS).filas.map(function (r) {
    return { id: r.id, nombre: r.nombre, raciones_base: numero(r.raciones_base) };
  });
}

/** Lista de recetas con su cabecera y sus ingredientes resueltos con nombre y unidad. */
function listarRecetas() {
  var recetas = leerHoja(HOJA.RECETAS).filas;
  var ingredientes = leerHoja(HOJA.RECETA_ING).filas;
  var insumos = {};
  leerHoja(HOJA.INSUMOS).filas.forEach(function (i) {
    insumos[i.id] = { nombre: i.nombre, unidad_base: i.unidad_base };
  });

  return recetas.map(function (r) {
    var ings = ingredientes
      .filter(function (g) { return String(g.receta_id) === String(r.id); })
      .map(function (g) {
        var info = insumos[g.insumo_id] || { nombre: '(insumo eliminado)', unidad_base: '' };
        return {
          id_linea: g.id_linea, insumo_id: g.insumo_id, insumo_nombre: info.nombre,
          unidad: info.unidad_base, cantidad_base: numero(g.cantidad_base)
        };
      });
    return {
      id: r.id, nombre: r.nombre, categoria: r.categoria,
      raciones_base: numero(r.raciones_base),
      tiempo_mano_obra_horas: numero(r.tiempo_mano_obra_horas),
      ingredientes: ings, _fila: r._fila
    };
  });
}

/** Borra las lineas de ingredientes de una receta (edicion del detalle). */
function eliminarIngredientesDe(recetaId) {
  var h = hojaReq(HOJA.RECETA_ING);
  var datos = leerHoja(HOJA.RECETA_ING).filas
    .filter(function (g) { return String(g.receta_id) === String(recetaId); })
    .map(function (g) { return g._fila; })
    .sort(function (a, b) { return b - a; }); // de abajo hacia arriba
  datos.forEach(function (fila) { h.deleteRow(fila); });
}

/**
 * Crea o edita una receta con sus ingredientes.
 * datos: { id, nombre, categoria, raciones_base, tiempo_mano_obra_horas,
 *          ingredientes: [{ insumo_id, cantidad_base }] }
 */
function guardarReceta(datos) {
  return conBloqueo(function () {
    var nombre = limpiar(datos.nombre);
    if (!nombre) throw new Error('El nombre es obligatorio.');
    var raciones = numero(datos.raciones_base);
    if (raciones <= 0) throw new Error('Las raciones base deben ser mayor que cero.');
    var tiempo = numero(datos.tiempo_mano_obra_horas);
    if (tiempo < 0) throw new Error('El tiempo de mano de obra no puede ser negativo.');

    var ings = (datos.ingredientes || []).filter(function (g) {
      return limpiar(g.insumo_id) && numero(g.cantidad_base) > 0;
    });
    if (!ings.length) throw new Error('Agrega al menos un ingrediente con cantidad mayor que cero.');

    var existentes = leerHoja(HOJA.RECETAS).filas;
    var dup = existentes.filter(function (r) {
      return String(r.nombre).toLowerCase() === nombre.toLowerCase()
          && String(r.id) !== String(datos.id || '');
    });
    if (dup.length) throw new Error('Ya existe una receta con ese nombre.');

    var recetaId;
    if (datos.id) {
      var f = existentes.filter(function (r) { return String(r.id) === String(datos.id); })[0];
      if (!f) throw new Error('No se encontro la receta para editar.');
      recetaId = datos.id;
      actualizarFila(HOJA.RECETAS, f._fila, {
        nombre: nombre, categoria: limpiar(datos.categoria),
        raciones_base: raciones, tiempo_mano_obra_horas: tiempo
      });
      eliminarIngredientesDe(recetaId);
      auditar('editar', 'receta', recetaId, '', '', nombre, ings.length + ' ingredientes');
    } else {
      recetaId = siguienteId(HOJA.RECETAS);
      agregarFila(HOJA.RECETAS, {
        id: recetaId, nombre: nombre, categoria: limpiar(datos.categoria),
        raciones_base: raciones, tiempo_mano_obra_horas: tiempo, creado_en: new Date()
      });
      auditar('crear', 'receta', recetaId, '', '', nombre, ings.length + ' ingredientes');
    }

    ings.forEach(function (g) {
      agregarFila(HOJA.RECETA_ING, {
        id_linea: siguienteId(HOJA.RECETA_ING), receta_id: recetaId,
        insumo_id: limpiar(g.insumo_id), cantidad_base: numero(g.cantidad_base)
      });
    });

    return { ok: true, id: recetaId, mensaje: 'Receta guardada.' };
  });
}
