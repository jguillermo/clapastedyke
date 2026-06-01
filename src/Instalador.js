/**
 * Instalador.gs
 * Crea y repara TODO en un solo archivo de Google Sheets, el que tienes abierto.
 * Es idempotente:
 *   - Primera vez: crea todas las hojas y siembra Config y Factores.
 *   - Veces siguientes: revisa hoja por hoja, crea solo lo que falta, agrega columnas
 *     que falten al final sin tocar las que ya tienen datos, y SIEMPRE vuelve a aplicar
 *     el diseno de las cabeceras, los formatos, las validaciones y la proteccion.
 * Nunca borra hojas, filas ni columnas con datos. Tus datos no se pierden.
 */

var DESC_PROTECCION = 'Sistema de costeo: hoja de datos, no editar a mano';

// Paleta del diseno, para las cabeceras.
var COLOR_HEADER_BG = '#f6e3d6';   // terracota suave
var COLOR_HEADER_FG = '#9a4324';   // terracota profundo
var ALTO_CABECERA = 34;            // px, para que no se vea apretado
var ANCHO_MIN = 120;
var ANCHO_MAX = 320;

/** Punto de entrada llamado desde el menu. */
function instalar() {
  var ui = SpreadsheetApp.getUi();
  try {
    var resumen = conBloqueo(function () { return ejecutarInstalacion(); });
    var msg = 'Listo. Todo quedo en este mismo archivo.\n\n'
      + 'Hojas creadas: ' + resumen.creadas.length
      + (resumen.creadas.length ? '\n  ' + resumen.creadas.join(', ') : '') + '\n'
      + 'Hojas revisadas: ' + resumen.revisadas + '\n'
      + 'Columnas agregadas: ' + resumen.columnas + '\n\n'
      + 'El diseno de las cabeceras se reaplico en todas.';
    ui.alert(nombreNegocio() + ' - Instalar o reparar', msg, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('No se pudo instalar', String(e && e.message ? e.message : e), ui.ButtonSet.OK);
    throw e;
  }
}

function ejecutarInstalacion() {
  var resumen = { creadas: [], revisadas: 0, columnas: 0 };
  var ss = ssOperacion();
  var defs = definicionEsquema();

  defs.forEach(function (def) {
    var sheet = ss.getSheetByName(def.nombre);
    if (!sheet) {
      sheet = ss.insertSheet(def.nombre);
      escribirHeaders(sheet, def.headers);
      resumen.creadas.push(def.nombre);
    } else {
      resumen.columnas += repararHeaders(sheet, def.headers);
    }
    resumen.revisadas++;

    formatearHoja(sheet, def);     // reaplica diseno y formatos SIEMPRE
    aplicarValidaciones(sheet, def);
    protegerHoja(sheet);
  });

  // Borra la pestana por defecto vacia (Hoja 1 / Sheet1) si sobra.
  limpiarHojaSobrante(ss);

  // Siembra Config y Factores solo si estan vacias.
  sembrarSiVacia(HOJA.CONFIG);
  sembrarSiVacia(HOJA.FACTORES);

  // Panel de Inicio.
  prepararInicio();
  if (typeof refrescarInicioSeguro === 'function') refrescarInicioSeguro();

  guardarVersion();
  auditar('instalar', 'sistema', '', 'version', '', VERSION_SISTEMA,
    'creadas:' + resumen.creadas.length + ' revisadas:' + resumen.revisadas);

  return resumen;
}

/** Escribe la fila de headers. */
function escribirHeaders(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

/**
 * Compara los headers actuales con los esperados. Agrega al final los que falten.
 * No mueve ni borra columnas existentes. Devuelve cuantas agrego.
 */
function repararHeaders(sheet, headersEsperados) {
  var ultimaCol = Math.max(1, sheet.getLastColumn());
  var actuales = sheet.getRange(1, 1, 1, ultimaCol).getValues()[0]
    .map(function (h) { return String(h); });
  var agregadas = 0;
  headersEsperados.forEach(function (h) {
    if (actuales.indexOf(h) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
      actuales.push(h);
      agregadas++;
    }
  });
  return agregadas;
}

/**
 * Diseno de la hoja. Se reaplica en cada instalacion o reparacion, asi las
 * cabeceras siempre se ven bien aunque alguien las haya tocado.
 */
function formatearHoja(sheet, def) {
  if (def.esPanel) {
    sheet.setHiddenGridlines(true);
    return; // el panel de Inicio se dibuja aparte
  }

  var ultimaCol = Math.max(1, sheet.getLastColumn());
  var headerRange = sheet.getRange(1, 1, 1, ultimaCol);

  headerRange
    .setFontWeight('bold')
    .setFontSize(11)
    .setFontColor(COLOR_HEADER_FG)
    .setBackground(COLOR_HEADER_BG)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('left')
    .setWrap(false);

  // Borde inferior suave bajo la cabecera.
  headerRange.setBorder(false, false, true, false, false, false, '#e7ddcf', SpreadsheetApp.BorderStyle.SOLID);

  sheet.setFrozenRows(1);
  try { sheet.setRowHeight(1, ALTO_CABECERA); } catch (e) {}

  var headers = headerRange.getValues()[0];
  aplicarFormatoColumnas(sheet, headers, def.numericas, '#,##0.####');
  aplicarFormatoColumnas(sheet, headers, def.moneda, '"S/" #,##0.0000');

  // Anchos parejos: ni apretados ni gigantes.
  try {
    sheet.autoResizeColumns(1, ultimaCol);
    for (var c = 1; c <= ultimaCol; c++) {
      var w = sheet.getColumnWidth(c);
      if (w < ANCHO_MIN) sheet.setColumnWidth(c, ANCHO_MIN);
      else if (w > ANCHO_MAX) sheet.setColumnWidth(c, ANCHO_MAX);
    }
  } catch (e) {}
}

function aplicarFormatoColumnas(sheet, headers, lista, formato) {
  if (!lista) return;
  var filas = Math.max(sheet.getMaxRows() - 1, 1);
  lista.forEach(function (nombreCol) {
    var idx = headers.indexOf(nombreCol);
    if (idx >= 0) sheet.getRange(2, idx + 1, filas, 1).setNumberFormat(formato);
  });
}

/** Dropdowns por celda para columnas con lista cerrada de valores. */
function aplicarValidaciones(sheet, def) {
  if (!def.validaciones) return;
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  var filas = Math.max(sheet.getMaxRows() - 1, 1);
  Object.keys(def.validaciones).forEach(function (col) {
    var idx = headers.indexOf(col);
    if (idx < 0) return;
    var regla = SpreadsheetApp.newDataValidation()
      .requireValueInList(def.validaciones[col], true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(2, idx + 1, filas, 1).setDataValidation(regla);
  });
}

/**
 * Protege la hoja con aviso. El script sigue escribiendo sin problema y a una
 * persona le sale un aviso si intenta editar a mano. No arriesga dejarte fuera.
 */
function protegerHoja(sheet) {
  var existentes = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  var ya = existentes.some(function (p) { return p.getDescription() === DESC_PROTECCION; });
  if (ya) return;
  sheet.protect().setDescription(DESC_PROTECCION).setWarningOnly(true);
}

/** Borra la pestana por defecto (Hoja 1 / Sheet1) si quedo vacia y no es del esquema. */
function limpiarHojaSobrante(ss) {
  var nombresEsquema = definicionEsquema().map(function (d) { return d.nombre; });
  ss.getSheets().forEach(function (sh) {
    var esDelEsquema = nombresEsquema.indexOf(sh.getName()) >= 0;
    var vacia = sh.getLastRow() === 0 && sh.getLastColumn() <= 1;
    if (!esDelEsquema && vacia && ss.getSheets().length > 1) {
      try { ss.deleteSheet(sh); } catch (e) {}
    }
  });
}

/** Siembra una hoja con su seed solo si no tiene filas de datos. */
function sembrarSiVacia(nombreHoja) {
  var def = buscarDef(nombreHoja);
  if (!def || !def.seed || !def.seed.length) return;
  var sheet = hojaReq(nombreHoja);
  if (sheet.getLastRow() > 1) return;
  sheet.getRange(2, 1, def.seed.length, def.headers.length).setValues(def.seed);
}

/** Deja la hoja Inicio lista y como primera pestana. El panel lo dibuja refrescarInicio. */
function prepararInicio() {
  var sheet = hoja(HOJA.INICIO);
  if (!sheet) return;
  sheet.setHiddenGridlines(true);
  if (limpiar(sheet.getRange('A1').getValue()) === '') {
    sheet.getRange('A1').setValue(nombreNegocio() + ' — Inicio')
      .setFontFamily('Georgia').setFontSize(20).setFontWeight('bold').setFontColor(COLOR_HEADER_FG);
  }
  ssOperacion().setActiveSheet(sheet);
  ssOperacion().moveActiveSheet(1);
}

/** Guarda o actualiza la version en Config sin duplicar la fila. */
function guardarVersion() {
  var datos = leerHoja(HOJA.CONFIG);
  for (var i = 0; i < datos.filas.length; i++) {
    if (datos.filas[i].parametro === 'version_sistema') {
      actualizarFila(HOJA.CONFIG, datos.filas[i]._fila, { valor: VERSION_SISTEMA });
      return;
    }
  }
}
