/**
 * Util.gs
 * Ayudantes que usa todo el sistema.
 *
 * Estructura de las hojas de datos:
 *   fila 1 -> titulo grande (que guarda la hoja)
 *   fila 2 -> cabeceras legibles (titulos)
 *   fila 3+ -> datos
 * El codigo trabaja con SLUGS internos; leer/escribir traduce slug<->titulo
 * usando el esquema. Las columnas calculadas (con formula) las maneja el
 * instalador: el codigo nunca las escribe.
 */

var FILA_TITULO = 1;
var FILA_HEADER = 2;
var FILA_DATOS = 3;

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

/**
 * Lee una hoja completa como lista de objetos {slug: valor}.
 * Las cabeceras estan en FILA_HEADER y se traducen a slugs via el esquema.
 */
function leerHoja(nombre) {
  var def = buscarDef(nombre);
  var h = hojaReq(nombre);
  var rango = h.getDataRange().getValues();
  if (rango.length < FILA_HEADER) return { headers: [], filas: [] };
  var titulos = rango[FILA_HEADER - 1] || [];
  var slugs = titulos.map(function (t) { return def ? slugDeTitulo(def, t) : String(t); });
  var filas = [];
  for (var i = FILA_DATOS - 1; i < rango.length; i++) {
    var fila = rango[i];
    if (fila.join('') === '') continue; // salta filas vacias
    var obj = { _fila: i + 1 };
    for (var c = 0; c < slugs.length; c++) obj[slugs[c]] = fila[c];
    filas.push(obj);
  }
  return { headers: slugs, filas: filas };
}

/** Indice (base 0) de una columna por su slug. */
function colIndex(headers, slug) {
  for (var i = 0; i < headers.length; i++) if (headers[i] === slug) return i;
  return -1;
}

/**
 * Genera el siguiente id legible tipo P-0001 para una hoja.
 * Mira los ids existentes y toma el mayor numero + 1.
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

/** Primera fila libre (col A vacia) a partir de FILA_DATOS, ignorando formulas. */
function primeraFilaLibre(h) {
  var filas = Math.max(1, h.getMaxRows() - FILA_DATOS + 1);
  var colA = h.getRange(FILA_DATOS, 1, filas, 1).getValues();
  for (var i = 0; i < colA.length; i++) {
    if (String(colA[i][0]) === '') return FILA_DATOS + i;
  }
  return FILA_DATOS + colA.length;
}

/**
 * Agrega una fila respetando el orden de columnas. Solo escribe columnas BASE
 * (las calculadas las llena la formula). obj viene con claves slug.
 */
function agregarFila(nombreHoja, obj) {
  var def = buscarDef(nombreHoja);
  var h = hojaReq(nombreHoja);
  var ultimaCol = Math.max(1, h.getLastColumn());
  var titulos = h.getRange(FILA_HEADER, 1, 1, ultimaCol).getValues()[0];

  // Numero de columnas base (no calculadas), que van a la izquierda.
  var nBase = ultimaCol;
  if (def) {
    nBase = titulos.filter(function (t) {
      return !esColumnaCalc(def, slugDeTitulo(def, t)) && String(t) !== '';
    }).length || ultimaCol;
  }

  var valores = [];
  for (var c = 0; c < nBase; c++) {
    var slug = def ? slugDeTitulo(def, titulos[c]) : String(titulos[c]);
    valores.push((obj[slug] === undefined || obj[slug] === null) ? '' : obj[slug]);
  }
  var fila = primeraFilaLibre(h);
  h.getRange(fila, 1, 1, valores.length).setValues([valores]);
  return valores;
}

/**
 * Actualiza una fila existente (por numero de fila) con los campos de obj.
 * Nunca toca columnas calculadas. obj viene con claves slug.
 */
function actualizarFila(nombreHoja, numFila, obj) {
  var def = buscarDef(nombreHoja);
  var h = hojaReq(nombreHoja);
  var titulos = h.getRange(FILA_HEADER, 1, 1, Math.max(1, h.getLastColumn())).getValues()[0];
  for (var c = 0; c < titulos.length; c++) {
    var slug = def ? slugDeTitulo(def, titulos[c]) : String(titulos[c]);
    if (def && esColumnaCalc(def, slug)) continue; // no pisar formulas
    if (obj.hasOwnProperty(slug)) {
      h.getRange(numFila, c + 1).setValue(obj[slug]);
    }
  }
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

/**
 * Tras guardar, lleva el foco a la hoja donde quedo el dato (seccion 15 del plan).
 * Si la hoja no existe, avisa en vez de fallar.
 */
function irAHojaDelDato(nombreHoja) {
  try {
    var h = hoja(nombreHoja);
    if (h) ssOperacion().setActiveSheet(h);
    else toast('No encuentro la hoja "' + nombreHoja + '". Corre Instalar o reparar.');
  } catch (e) { /* no romper el guardado por un fallo de navegacion */ }
}
