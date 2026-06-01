/**
 * Clientes.gs  (Archivo 2)
 * Ventana 6.8. Lista con boton Nuevo, y formulario para crear o editar.
 */

function abrirClientes() {
  abrirModal('ClientesForm', 'Clientes', 760, 660);
}

/** Lista para autocompletar clientes desde otras ventanas. */
function catalogoClientes() {
  return leerHoja(HOJA.CLIENTES).filas.map(function (c) {
    return { id: c.id, nombre: c.nombre };
  });
}

function listarClientes() {
  return leerHoja(HOJA.CLIENTES).filas.map(function (c) {
    return { id: c.id, nombre: c.nombre, telefono: c.telefono, notas: c.notas, _fila: c._fila };
  });
}

/**
 * Crea o edita un cliente.
 * datos: { id, nombre, telefono, notas }
 * Si datos.id viene, es edicion. Si no, es alta.
 */
function guardarCliente(datos) {
  return conBloqueo(function () {
    var nombre = limpiar(datos.nombre);
    if (!nombre) throw new Error('El nombre es obligatorio.');

    var existentes = leerHoja(HOJA.CLIENTES).filas;
    // No se permiten dos clientes con el mismo nombre exacto.
    var dup = existentes.filter(function (c) {
      return String(c.nombre).toLowerCase() === nombre.toLowerCase()
          && String(c.id) !== String(datos.id || '');
    });
    if (dup.length) throw new Error('Ya existe un cliente con ese nombre.');

    if (datos.id) {
      var f = existentes.filter(function (c) { return String(c.id) === String(datos.id); })[0];
      if (!f) throw new Error('No se encontro el cliente para editar.');
      actualizarFila(HOJA.CLIENTES, f._fila, {
        nombre: nombre, telefono: limpiar(datos.telefono), notas: limpiar(datos.notas)
      });
      auditar('editar', 'cliente', datos.id, '', '', nombre, '');
      return { ok: true, id: datos.id, mensaje: 'Cliente actualizado.' };
    } else {
      var id = siguienteId(HOJA.CLIENTES);
      agregarFila(HOJA.CLIENTES, {
        id: id, nombre: nombre, telefono: limpiar(datos.telefono),
        notas: limpiar(datos.notas), creado_en: new Date()
      });
      auditar('crear', 'cliente', id, '', '', nombre, '');
      return { ok: true, id: id, mensaje: 'Cliente creado.' };
    }
  });
}
