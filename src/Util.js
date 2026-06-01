/**
 * Util.gs
 * Ayudantes que usa todo el sistema.
 */

/** Incluye un archivo HTML dentro de otro (para compartir estilos y scripts). */
function include(archivo) {
  return HtmlService.createHtmlOutputFromFile(archivo).getContent();
}

/** Correo del usuario que tiene el archivo abierto. Cae a "desconocido" si no hay. */
function usuarioActual() {
  try {
    var u = Session.getActiveUser().getEmail();
    return u || 'desconocido';
  } catch (e) {
    return 'desconocido';
  }
}

/** Ejecuta fn con bloqueo, para que un doble clic no escriba dos veces. */
function conBloqueo(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // espera hasta 20 s
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/** Lee una hoja completa como lista de objetos {columna: valor}. */
function leerHoja(nombre) {
  var h = hojaReq(nombre);
  var rango = h.getDataRange().getValues();
  if (rango.length < 2) return { headers: rango[0] || [], filas: [] };
  var headers = rango[0];
  var filas = [];
  for (var i = 1; i < rango.length; i++) {
    var fila = rango[i];
    // Salta filas totalmente vacias.
    if (fila.join('') === '') continue;
    var obj = { _fila: i + 1 }; // numero de fila real en la hoja
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = fila[c];
    filas.push(obj);
  }
  return { headers: headers, filas: filas };
}

/** Indice (base 0) de una columna por su nombre de header. */
function colIndex(headers, nombre) {
  for (var i = 0; i < headers.length; i++) if (headers[i] === nombre) return i;
  return -1;
}

/**
 * Genera el siguiente id legible tipo P-0001 para una hoja.
 * Mira los ids existentes y toma el mayor numero + 1, asi no se repite
 * aunque hayas borrado filas.
 */
function siguienteId(nombreHoja) {
  var prefijo = prefijoId(nombreHoja);
  var datos = leerHoja(nombreHoja);
  var idCol = (colIndex(datos.headers, 'id') >= 0) ? 'id'
            : (colIndex(datos.headers, 'id_linea') >= 0) ? 'id_linea'
            : (colIndex(datos.headers, 'id_regla') >= 0) ? 'id_regla' : 'id';
  var max = 0;
  for (var i = 0; i < datos.filas.length; i++) {
    var v = String(datos.filas[i][idCol] || '');
    var m = v.match(/(\d+)\s*$/);
    if (m) { var n = parseInt(m[1], 10); if (n > max) max = n; }
  }
  var num = max + 1;
  return prefijo + '-' + ('000' + num).slice(-Math.max(4, ('' + num).length));
}

/** Agrega una fila a una hoja respetando el orden de sus headers. */
function agregarFila(nombreHoja, obj) {
  var h = hojaReq(nombreHoja);
  var headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0];
  var fila = headers.map(function (col) {
    return (obj[col] === undefined || obj[col] === null) ? '' : obj[col];
  });
  h.appendRow(fila);
  return fila;
}

/** Actualiza una fila existente (por numero de fila) con los campos de obj. */
function actualizarFila(nombreHoja, numFila, obj) {
  var h = hojaReq(nombreHoja);
  var headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0];
  for (var c = 0; c < headers.length; c++) {
    if (obj.hasOwnProperty(headers[c])) {
      h.getRange(numFila, c + 1).setValue(obj[headers[c]]);
    }
  }
}

/** Lee toda la Config como objeto {parametro: valor}. */
function getConfig() {
  var datos = leerHoja(HOJA.CONFIG);
  var cfg = {};
  for (var i = 0; i < datos.filas.length; i++) {
    cfg[datos.filas[i].parametro] = datos.filas[i].valor;
  }
  return cfg;
}

/** Lee un solo valor de Config. */
function getConfigValor(parametro) {
  return getConfig()[parametro];
}

/** Escribe una linea de auditoria. */
function auditar(accion, entidad, entidadId, campo, antes, despues, detalle) {
  agregarFila(HOJA.AUDITORIA, {
    fecha: new Date(),
    usuario: usuarioActual(),
    accion: accion,
    entidad: entidad,
    entidad_id: entidadId || '',
    campo: campo || '',
    valor_anterior: (antes === undefined || antes === null) ? '' : antes,
    valor_nuevo: (despues === undefined || despues === null) ? '' : despues,
    detalle: detalle || ''
  });
}

/** Aviso corto sobre la hoja. */
function toast(mensaje, titulo) {
  ssOperacion().toast(mensaje, titulo || nombreNegocio(), 5);
}

/** Convierte texto a numero seguro. Devuelve 0 si no es numero. */
function numero(v) {
  if (v === '' || v === null || v === undefined) return 0;
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

/** Quita espacios de los lados de un texto. */
function limpiar(v) {
  return (v === null || v === undefined) ? '' : String(v).trim();
}

/** Abre una ventana modal a partir de un archivo HTML. */
function abrirModal(archivoHtml, titulo, ancho, alto) {
  var html = HtmlService.createTemplateFromFile(archivoHtml)
    .evaluate()
    .setWidth(ancho || 720)
    .setHeight(alto || 640);
  SpreadsheetApp.getUi().showModalDialog(html, titulo);
}
