/**
 * ReglasEmpaque.gs  (Archivo 2)
 * Ventana 6.12. Define que empaque se sugiere para cada receta y tamano.
 * Una misma receta y tamano puede tener varias filas.
 */

function abrirReglasEmpaque() {
  abrirModal('ReglasEmpaqueForm', 'Reglas de empaque', 860, 720);
}

/** Tamanos validos, leidos del bloque Tamanos de Config. */
function listaTamanos() {
  return tamanosConfig().map(function (t) { return t.nombre; });
}

function listarReglasEmpaque() {
  var reglas = leerHoja(HOJA.REGLAS_EMPAQUE).filas;
  var recetas = {}; leerHoja(HOJA.RECETAS).filas.forEach(function (r) { recetas[r.id] = r.nombre; });
  var insumos = {}; leerHoja(HOJA.INSUMOS).filas.forEach(function (i) { insumos[i.id] = i.nombre; });

  return reglas.map(function (g) {
    return {
      id_regla: g.id_regla, receta_id: g.receta_id,
      receta_nombre: recetas[g.receta_id] || '(receta eliminada)',
      tamano: g.tamano, insumo_empaque_id: g.insumo_empaque_id,
      insumo_nombre: insumos[g.insumo_empaque_id] || '(empaque eliminado)',
      cantidad: numero(g.cantidad), _fila: g._fila
    };
  });
}

/** Datos que necesita la ventana al abrirse: recetas, empaques y tamanos. */
function datosReglasEmpaque() {
  return {
    recetas: catalogoRecetas(),
    empaques: catalogoInsumos('empaque'),
    tamanos: listaTamanos()
  };
}

function guardarReglaEmpaque(datos) {
  return conBloqueo(function () {
    var recetaId = limpiar(datos.receta_id);
    var tamano = limpiar(datos.tamano);
    var empaqueId = limpiar(datos.insumo_empaque_id);
    var cantidad = numero(datos.cantidad);

    if (!recetaId) throw new Error('Elige una receta.');
    if (!tamano) throw new Error('Elige un tamano.');
    if (!empaqueId) throw new Error('Elige un empaque.');
    if (cantidad <= 0) throw new Error('La cantidad debe ser mayor que cero.');
    if (listaTamanos().indexOf(tamano) < 0) throw new Error('Ese tamano no esta en la lista de Config.');

    var existentes = leerHoja(HOJA.REGLAS_EMPAQUE).filas;

    if (datos.id_regla) {
      var f = existentes.filter(function (g) { return String(g.id_regla) === String(datos.id_regla); })[0];
      if (!f) throw new Error('No se encontro la regla para editar.');
      actualizarFila(HOJA.REGLAS_EMPAQUE, f._fila, {
        receta_id: recetaId, tamano: tamano, insumo_empaque_id: empaqueId, cantidad: cantidad
      });
      auditar('editar', 'regla_empaque', datos.id_regla, '', '', tamano, '');
      irAHojaDelDato(HOJA.REGLAS_EMPAQUE);
      return { ok: true, id: datos.id_regla, mensaje: 'Regla actualizada.' };
    } else {
      // Evita duplicar la misma combinacion exacta de receta, tamano y empaque.
      var dup = existentes.filter(function (g) {
        return String(g.receta_id) === recetaId && String(g.tamano) === tamano
            && String(g.insumo_empaque_id) === empaqueId;
      });
      if (dup.length) throw new Error('Ya existe esa combinacion de receta, tamano y empaque.');

      var id = siguienteId(HOJA.REGLAS_EMPAQUE);
      agregarFila(HOJA.REGLAS_EMPAQUE, {
        id_regla: id, receta_id: recetaId, tamano: tamano,
        insumo_empaque_id: empaqueId, cantidad: cantidad
      });
      auditar('crear', 'regla_empaque', id, '', '', tamano, '');
      irAHojaDelDato(HOJA.REGLAS_EMPAQUE);
      return { ok: true, id: id, mensaje: 'Regla creada.' };
    }
  });
}
