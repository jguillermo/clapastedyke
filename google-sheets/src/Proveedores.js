/**
 * Proveedores.gs  (Archivo 2)
 * Ventana 6.11. El numero de WhatsApp se valida para poder armar el enlace.
 */

function abrirProveedores() {
  abrirModal('ProveedoresForm', 'Proveedores', 760, 640);
}

function catalogoProveedores() {
  return leerHoja(HOJA.PROVEEDORES).filas.map(function (p) {
    return { id: p.id, nombre: p.nombre, whatsapp: p.whatsapp };
  });
}

function listarProveedores() {
  return leerHoja(HOJA.PROVEEDORES).filas.map(function (p) {
    return { id: p.id, nombre: p.nombre, whatsapp: p.whatsapp, notas: p.notas, _fila: p._fila };
  });
}

/** Deja solo digitos. El enlace de WhatsApp necesita numero con codigo de pais. */
function normalizarWhatsapp(v) {
  return limpiar(v).replace(/[^\d]/g, '');
}

function guardarProveedor(datos) {
  return conBloqueo(function () {
    var nombre = limpiar(datos.nombre);
    if (!nombre) throw new Error('El nombre es obligatorio.');

    var wa = normalizarWhatsapp(datos.whatsapp);
    if (!wa) throw new Error('El WhatsApp es obligatorio (numero con codigo de pais).');
    if (wa.length < 8) throw new Error('El WhatsApp parece incompleto. Incluye el codigo de pais.');

    var existentes = leerHoja(HOJA.PROVEEDORES).filas;
    var dup = existentes.filter(function (p) {
      return String(p.nombre).toLowerCase() === nombre.toLowerCase()
          && String(p.id) !== String(datos.id || '');
    });
    if (dup.length) throw new Error('Ya existe un proveedor con ese nombre.');

    if (datos.id) {
      var f = existentes.filter(function (p) { return String(p.id) === String(datos.id); })[0];
      if (!f) throw new Error('No se encontro el proveedor para editar.');
      actualizarFila(HOJA.PROVEEDORES, f._fila, {
        nombre: nombre, whatsapp: wa, notas: limpiar(datos.notas)
      });
      auditar('editar', 'proveedor', datos.id, '', '', nombre, '');
      irAHojaDelDato(HOJA.PROVEEDORES);
      return { ok: true, id: datos.id, mensaje: 'Proveedor actualizado.' };
    } else {
      var id = siguienteId(HOJA.PROVEEDORES);
      agregarFila(HOJA.PROVEEDORES, {
        id: id, nombre: nombre, whatsapp: wa, notas: limpiar(datos.notas), creado_en: new Date()
      });
      auditar('crear', 'proveedor', id, '', '', nombre, '');
      irAHojaDelDato(HOJA.PROVEEDORES);
      return { ok: true, id: id, mensaje: 'Proveedor creado.' };
    }
  });
}
