/**
 * Instalador.gs
 * Crea y repara TODO en un solo archivo de Google Sheets. Idempotente.
 *   - Crea hojas que falten, con fila 1 (titulo grande), fila 2 (cabeceras) y datos
 *     desde la fila 3.
 *   - Siembra y REESCRIBE las formulas de las columnas calculadas (son estructura,
 *     no datos del usuario) y las formulas de la hoja Resumen.
 *   - Config se siembra por bloques; al reparar agrega bloques/parametros que falten
 *     pero NO pisa los valores que el usuario haya editado a mano.
 * Nunca borra hojas ni filas de datos.
 */

var DESC_PROTECCION = 'Sistema de costeo: hoja de datos, no editar a mano';

// Paleta del diseno.
var COLOR_HEADER_BG = '#f6e3d6';   // terracota suave (columnas base)
var COLOR_HEADER_FG = '#9a4324';   // terracota profundo
var COLOR_CALC_BG = '#e1efe2';     // verde suave (columnas calculadas por formula)
var COLOR_CALC_FG = '#2f5d3a';
var ALTO_CABECERA = 30;
var ANCHO_MIN = 120;
var ANCHO_MAX = 320;

/**
 * La instalacion se divide en pasos independientes para no superar el limite de
 * tiempo de ejecucion de Apps Script (cada paso corre por separado desde el menu):
 *   1. Crear tablas       -> hojas, titulos, cabeceras y siembra de Config (estructura)
 *   2. Aplicar diseno     -> formatos, colores y anchos (el paso mas lento, aparte)
 *   3. Agregar formulas   -> columnas calculadas + hoja Resumen
 *   4. Validaciones       -> dropdowns de listas cerradas
 *   5. Protecciones       -> proteger hojas + acabado (Resumen al frente, version)
 * `instalar()` corre los cinco en orden (puede tardar); los pasos sueltos no.
 */

// ---------- Paso 1: crear tablas (estructura) ----------

function instalarTablas() {
  _correrPaso('1. Crear tablas', function () {
    var r = ejecutarTablas();
    return 'Listo.\n\n'
      + 'Hojas creadas: ' + r.creadas.length
      + (r.creadas.length ? '\n  ' + r.creadas.join(', ') : '') + '\n'
      + 'Hojas revisadas: ' + r.revisadas;
  });
}

function ejecutarTablas() {
  var resumen = { creadas: [], revisadas: 0 };
  var ss = ssOperacion();

  definicionEsquema().forEach(function (def) {
    var sheet = ss.getSheetByName(def.nombre);
    if (!sheet) { sheet = ss.insertSheet(def.nombre); resumen.creadas.push(def.nombre); }
    resumen.revisadas++;

    if (def.esConfig) {
      sembrarConfig(sheet, def);
      quitarProteccion(sheet); // Config se edita a mano: sin proteccion.
    } else if (def.esResumen) {
      // El Resumen lo construye por completo el paso de formulas.
    } else {
      escribirTituloHoja(sheet, def, def.columnas.length);
      escribirHeaders(sheet, def);
    }
  });

  limpiarHojaSobrante(ss);
  guardarVersion();
  return resumen;
}

// ---------- Paso 2: aplicar diseno (lento) ----------

function instalarDiseno() {
  _correrPaso('2. Aplicar diseno', function () {
    var n = ejecutarDiseno();
    return 'Listo. Diseno reaplicado en ' + n + ' hoja(s) de datos.';
  });
}

function ejecutarDiseno() {
  var ss = ssOperacion();
  var n = 0;
  definicionEsquema().forEach(function (def) {
    if (def.esConfig || def.esResumen) return;
    var sheet = ss.getSheetByName(def.nombre);
    if (!sheet) return;
    formatearHoja(sheet, def);
    n++;
  });
  return n;
}

// ---------- Paso 3: agregar formulas ----------

function instalarFormulas() {
  _correrPaso('3. Agregar formulas', function () {
    var n = ejecutarFormulas();
    return 'Listo. Formulas reescritas en ' + n + ' hoja(s).';
  });
}

function ejecutarFormulas() {
  var ss = ssOperacion();
  var n = 0;
  definicionEsquema().forEach(function (def) {
    if (def.esConfig) return;
    var sheet = ss.getSheetByName(def.nombre);
    if (!sheet) return;
    if (def.esResumen) sembrarResumen(sheet, def);
    else sembrarFormulas(sheet, def); // reescribe formulas de columnas calculadas
    n++;
  });
  return n;
}

// ---------- Paso 4: validaciones ----------

function instalarValidaciones() {
  _correrPaso('4. Validaciones', function () {
    var n = ejecutarValidaciones();
    return 'Listo. Validaciones aplicadas en ' + n + ' hoja(s).';
  });
}

function ejecutarValidaciones() {
  var ss = ssOperacion();
  var n = 0;
  definicionEsquema().forEach(function (def) {
    if (def.esConfig || def.esResumen) return;
    var sheet = ss.getSheetByName(def.nombre);
    if (!sheet) return;
    aplicarValidaciones(sheet, def);
    n++;
  });
  return n;
}

// ---------- Paso 5: protecciones y acabado ----------

function instalarProtecciones() {
  _correrPaso('5. Protecciones', function () {
    var n = ejecutarProtecciones();
    return 'Listo. ' + n + ' hoja(s) protegidas y Resumen al frente.';
  });
}

function ejecutarProtecciones() {
  var ss = ssOperacion();
  var n = 0;
  definicionEsquema().forEach(function (def) {
    var sheet = ss.getSheetByName(def.nombre);
    if (!sheet) return;
    if (def.esConfig) { quitarProteccion(sheet); return; }
    protegerHoja(sheet); // datos y Resumen: solo lectura
    n++;
  });
  prepararResumen();
  guardarVersion();
  return n;
}

// ---------- Todo en uno (puede superar el limite de tiempo) ----------

/** Punto de entrada llamado desde el menu: corre los cinco pasos en orden. */
function instalar() {
  _correrPaso(nombreNegocio() + ' - Instalar o reparar', function () {
    var resumen = ejecutarInstalacion();
    return 'Listo.\n\n'
      + 'Hojas creadas: ' + resumen.creadas.length
      + (resumen.creadas.length ? '\n  ' + resumen.creadas.join(', ') : '') + '\n'
      + 'Hojas revisadas: ' + resumen.revisadas + '\n\n'
      + 'Cabeceras, diseno, formulas, validaciones y protecciones reaplicados.\n\n'
      + 'Si tarda demasiado, usa los pasos sueltos del menu Mantenimiento.';
  });
}

function ejecutarInstalacion() {
  var resumen = ejecutarTablas();
  ejecutarDiseno();
  ejecutarFormulas();
  ejecutarValidaciones();
  ejecutarProtecciones();
  auditar('instalar', 'sistema', '', 'version', '', VERSION_SISTEMA,
    'creadas:' + resumen.creadas.length + ' revisadas:' + resumen.revisadas);
  return resumen;
}

/** Envuelve un paso con bloqueo y reporta el resultado por UI. */
function _correrPaso(titulo, fn) {
  var ui = SpreadsheetApp.getUi();
  try {
    var msg = conBloqueo(fn);
    ui.alert(titulo, msg, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('No se pudo: ' + titulo, String(e && e.message ? e.message : e), ui.ButtonSet.OK);
    throw e;
  }
}

// ---------- Titulo y cabeceras ----------

/** Escribe el titulo grande en la fila 1, fusionado a lo ancho de las columnas. */
function escribirTituloHoja(sheet, def, nCols) {
  nCols = Math.max(1, nCols || 4);
  var r = sheet.getRange(FILA_TITULO, 1, 1, nCols);
  try { if (!r.isPartOfMerge()) r.merge(); } catch (e) {}
  sheet.getRange(FILA_TITULO, 1).setValue(def.titulo_hoja || def.nombre)
    .setFontFamily('Georgia').setFontSize(15).setFontWeight('bold')
    .setFontColor(COLOR_HEADER_FG).setVerticalAlignment('middle');
  try { sheet.setRowHeight(FILA_TITULO, ALTO_CABECERA); } catch (e) {}
}

/** Escribe la fila de cabeceras (titulos legibles) en FILA_HEADER. */
function escribirHeaders(sheet, def) {
  var titulos = titulosDe(def);
  sheet.getRange(FILA_HEADER, 1, 1, titulos.length).setValues([titulos]);
}

/** Diseno de la hoja de datos. Se reaplica en cada instalacion o reparacion. */
function formatearHoja(sheet, def) {
  var cols = columnasDe(def);
  var nCols = Math.max(1, cols.length);
  var headerRange = sheet.getRange(FILA_HEADER, 1, 1, nCols);

  headerRange.setFontWeight('bold').setFontSize(11)
    .setFontColor(COLOR_HEADER_FG).setBackground(COLOR_HEADER_BG)
    .setVerticalAlignment('middle').setHorizontalAlignment('left').setWrap(false);
  headerRange.setBorder(false, false, true, false, false, false, '#e7ddcf', SpreadsheetApp.BorderStyle.SOLID);

  // Cabecera distinta para columnas calculadas (territorio de la formula).
  cols.forEach(function (c, i) {
    if (typeof c.calc === 'function') {
      sheet.getRange(FILA_HEADER, i + 1).setBackground(COLOR_CALC_BG).setFontColor(COLOR_CALC_FG);
    }
  });

  sheet.setFrozenRows(FILA_HEADER); // congela titulo + cabeceras
  try { sheet.setRowHeight(FILA_HEADER, ALTO_CABECERA); } catch (e) {}

  // Formatos numericos/moneda por columna, desde FILA_DATOS.
  var filas = Math.max(sheet.getMaxRows() - FILA_DATOS + 1, 1);
  cols.forEach(function (c, i) {
    var fmt = c.moneda ? '"S/" #,##0.0000' : (c.num ? '#,##0.####' : null);
    if (fmt) sheet.getRange(FILA_DATOS, i + 1, filas, 1).setNumberFormat(fmt);
  });

  try {
    sheet.autoResizeColumns(1, nCols);
    for (var k = 1; k <= nCols; k++) {
      var w = sheet.getColumnWidth(k);
      if (w < ANCHO_MIN) sheet.setColumnWidth(k, ANCHO_MIN);
      else if (w > ANCHO_MAX) sheet.setColumnWidth(k, ANCHO_MAX);
    }
  } catch (e) {}
}

/** Dropdowns por celda para columnas con lista cerrada (por slug). */
function aplicarValidaciones(sheet, def) {
  if (!def.validaciones) return;
  var slugs = slugsDe(def);
  var filas = Math.max(sheet.getMaxRows() - FILA_DATOS + 1, 1);
  Object.keys(def.validaciones).forEach(function (slug) {
    var idx = slugs.indexOf(slug);
    if (idx < 0) return;
    var regla = SpreadsheetApp.newDataValidation()
      .requireValueInList(def.validaciones[slug], true).setAllowInvalid(true).build();
    sheet.getRange(FILA_DATOS, idx + 1, filas, 1).setDataValidation(regla);
  });
}

/** Siembra (y reescribe) las formulas ARRAYFORMULA de las columnas calculadas. */
function sembrarFormulas(sheet, def) {
  var L = mapaColumnasLetra(def);
  columnasDe(def).forEach(function (c, i) {
    if (typeof c.calc === 'function') {
      sheet.getRange(FILA_DATOS, i + 1).setFormula('=' + c.calc(L));
    }
  });
}

// ---------- Config por bloques ----------

/** Fila (1-based) donde esta el titulo de un bloque en col A, o 0 si no esta. */
function filaTituloBloque(sheet, titulo) {
  var n = sheet.getLastRow();
  if (n < 1) return 0;
  var colA = sheet.getRange(1, 1, n, 1).getValues();
  for (var i = 0; i < colA.length; i++) {
    if (String(colA[i][0]) === String(titulo)) return i + 1;
  }
  return 0;
}

/** Escribe un bloque (titulo, cabeceras, filas) a partir de rowStart. Devuelve la ultima fila escrita. */
function escribirBloque(sheet, b, rowStart) {
  sheet.getRange(rowStart, 1).setValue(b.titulo)
    .setFontWeight('bold').setFontColor(COLOR_HEADER_FG).setFontSize(12);
  sheet.getRange(rowStart + 1, 1, 1, b.cols.length).setValues([b.cols])
    .setFontWeight('bold').setBackground(COLOR_HEADER_BG).setFontColor(COLOR_HEADER_FG);
  if (b.filas && b.filas.length) {
    sheet.getRange(rowStart + 2, 1, b.filas.length, b.cols.length).setValues(b.filas);
  }
  return rowStart + 1 + (b.filas ? b.filas.length : 0);
}

/** Agrega al bloque 'generales' los parametros del seed que falten, sin pisar valores. */
function completarParamsGenerales(sheet, b) {
  var filaT = filaTituloBloque(sheet, b.titulo);
  if (!filaT) return;
  var filaHeader = filaT + 1;
  // Lee los parametros existentes y la ultima fila del bloque.
  var existentes = {}, ultima = filaHeader;
  var max = sheet.getLastRow();
  for (var r = filaHeader + 1; r <= max; r++) {
    var v = String(sheet.getRange(r, 1).getValue());
    if (v === '') break; // fin del bloque
    existentes[v] = true; ultima = r;
  }
  var faltan = b.filas.filter(function (f) { return !existentes[f[0]]; });
  if (!faltan.length) return;
  sheet.insertRowsAfter(ultima, faltan.length);
  sheet.getRange(ultima + 1, 1, faltan.length, b.cols.length).setValues(faltan);
}

function sembrarConfig(sheet, def) {
  escribirTituloHoja(sheet, def, 4);
  var hayBloques = def.bloques.some(function (b) { return filaTituloBloque(sheet, b.titulo) > 0; });
  if (!hayBloques) {
    var r = FILA_DATOS; // primer bloque arranca despues del titulo
    def.bloques.forEach(function (b) { r = escribirBloque(sheet, b, r) + 2; });
  } else {
    def.bloques.forEach(function (b) {
      if (filaTituloBloque(sheet, b.titulo) <= 0) {
        escribirBloque(sheet, b, sheet.getLastRow() + 2);
      } else if (b.clave === 'generales') {
        completarParamsGenerales(sheet, b);
      }
    });
  }
  try { sheet.setColumnWidth(1, 240); sheet.setColumnWidth(2, 200); } catch (e) {}
  sheet.setHiddenGridlines(true);
}

// ---------- Resumen (100% formulas) ----------

function sembrarResumen(sheet, def) {
  escribirTituloHoja(sheet, def, 2);
  sheet.setHiddenGridlines(true);

  var P = mapaColumnasLetra(buscarDef(HOJA.PRESUPUESTOS));
  var D = mapaColumnasLetra(buscarDef(HOJA.PEDIDOS));
  var I = mapaColumnasLetra(buscarDef(HOJA.INSUMOS));
  var Pr = HOJA.PRESUPUESTOS, Pe = HOJA.PEDIDOS, In = HOJA.INSUMOS;
  function rng(hojaNom, letra) { return "'" + hojaNom + "'!" + letra + FILA_DATOS + ":" + letra; }

  var filas = [
    ['RESUMEN', ''],
    ['Presupuestos pendientes', '=COUNTIF(' + rng(Pr, P.estado) + ',"Pendiente")'],
    ['Por vencer (3 días)', '=COUNTIFS(' + rng(Pr, P.estado) + ',"Pendiente",' + rng(Pr, P.fecha_vencimiento) + ',">="&TODAY(),' + rng(Pr, P.fecha_vencimiento) + ',"<="&(TODAY()+3))'],
    ['Vencidos', '=COUNTIFS(' + rng(Pr, P.estado) + ',"Pendiente",' + rng(Pr, P.fecha_vencimiento) + ',"<"&TODAY())'],
    ['Pedidos pendientes', '=COUNTIF(' + rng(Pe, D.estado) + ',"Pendiente")'],
    ['Pedidos en producción', '=COUNTIF(' + rng(Pe, D.estado) + ',"Producción")'],
    ['Pedidos entregados', '=COUNTIF(' + rng(Pe, D.estado) + ',"Entregado")'],
    ['Insumos agotados', '=COUNTIF(' + rng(In, I.semaforo) + ',"rojo")'],
    ['Insumos bajo mínimo', '=COUNTIF(' + rng(In, I.semaforo) + ',"amarillo")'],
    ['', ''],
    ['ALERTAS', ''],
    ['Insumos agotados', '=IFERROR(TEXTJOIN(", ",TRUE,FILTER(' + rng(In, I.nombre) + ',' + rng(In, I.semaforo) + '="rojo")),"Ninguno")'],
    ['Insumos bajo mínimo', '=IFERROR(TEXTJOIN(", ",TRUE,FILTER(' + rng(In, I.nombre) + ',' + rng(In, I.semaforo) + '="amarillo")),"Ninguno")'],
    ['Presupuestos por vencer', '=IFERROR(TEXTJOIN(", ",TRUE,FILTER(' + rng(Pr, P.id) + ',' + rng(Pr, P.estado) + '="Pendiente",' + rng(Pr, P.fecha_vencimiento) + '<=(TODAY()+3))),"Ninguno")']
  ];

  sheet.getRange(FILA_HEADER, 1, 80, 2).clearContent();
  sheet.getRange(FILA_HEADER, 1, filas.length, 2).setValues(filas);
  // Estilo de los titulos de seccion.
  sheet.getRange(FILA_HEADER, 1).setFontWeight('bold').setFontColor(COLOR_HEADER_FG);
  sheet.getRange(FILA_HEADER + 10, 1).setFontWeight('bold').setFontColor(COLOR_HEADER_FG);
  sheet.getRange(FILA_DATOS, 2, 8, 1).setFontFamily('Courier New').setFontWeight('bold');
  try { sheet.setColumnWidth(1, 230); sheet.setColumnWidth(2, 360); } catch (e) {}
}

// ---------- Proteccion y utilidades ----------

function protegerHoja(sheet) {
  var existentes = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  var ya = existentes.some(function (p) { return p.getDescription() === DESC_PROTECCION; });
  if (ya) return;
  sheet.protect().setDescription(DESC_PROTECCION).setWarningOnly(true);
}

function quitarProteccion(sheet) {
  sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) {
    if (p.getDescription() === DESC_PROTECCION) { try { p.remove(); } catch (e) {} }
  });
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

/** Deja la hoja Resumen como primera pestana. */
function prepararResumen() {
  var sheet = ssOperacion().getSheetByName(HOJA.RESUMEN);
  if (!sheet) return;
  sheet.setHiddenGridlines(true);
  ssOperacion().setActiveSheet(sheet);
  ssOperacion().moveActiveSheet(1);
}

/** Guarda o actualiza la version en el bloque generales de Config. */
function guardarVersion() {
  try { setConfigGeneral('version_sistema', VERSION_SISTEMA); } catch (e) {}
}
