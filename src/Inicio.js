/**
 * Inicio.gs  (Archivo 1)  -- FASE 3
 * El panel de la hoja Inicio. Resumen de números y alertas, en solo lectura.
 * Se refresca al abrir el archivo y después de cada acción que mueve algo.
 */

/** Versión segura: si algo falla (sin instalar, etc.) no rompe la llamada que la invocó. */
function refrescarInicioSeguro() {
  try { refrescarInicio(); } catch (e) { /* silencioso */ }
}

function refrescarInicio() {
  var sheet = hoja(HOJA.INICIO);
  if (!sheet) return;

  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var en3 = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Presupuestos.
  var presupuestos = leerHoja(HOJA.PRESUPUESTOS).filas;
  var pendientes = 0, porVencer = 0, vencidos = 0, alertasVencer = [];
  presupuestos.forEach(function (p) {
    if (limpiar(p.estado) !== 'Pendiente') return;
    var v = p.fecha_vencimiento;
    var esFecha = Object.prototype.toString.call(v) === '[object Date]';
    if (esFecha && v < hoy) { vencidos++; return; }
    pendientes++;
    if (esFecha && v <= en3) { porVencer++; alertasVencer.push(p.id + ' ' + p.cliente_nombre + ' vence ' + fechaCorta(v)); }
  });

  // Pedidos.
  var pedidos = leerHoja(HOJA.PEDIDOS).filas;
  var pedPend = 0, enProd = 0, alertasProd = [];
  pedidos.forEach(function (p) {
    var e = limpiar(p.estado);
    if (e === 'Pendiente') pedPend++;
    if (e === 'Producción') { enProd++; alertasProd.push(p.id + ' ' + p.cliente_nombre + ' por entregar'); }
  });

  // Insumos.
  var insumos = leerHoja(HOJA.INSUMOS).filas;
  var rojos = 0, amarillos = 0, alertasStock = [];
  insumos.forEach(function (i) {
    var s = semaforoDe(i.stock_actual, i.stock_minimo);
    if (s === 'rojo') { rojos++; alertasStock.push(i.nombre + ' agotado'); }
    else if (s === 'amarillo') { amarillos++; alertasStock.push(i.nombre + ' bajo el mínimo'); }
  });

  // Pinta. Limpia primero una zona amplia.
  sheet.getRange(1, 1, 60, 3).clearContent();
  sheet.setHiddenGridlines(true);

  var filas = [
    [nombreNegocio() + ' — Inicio', ''],
    ['Actualizado', Utilities.formatDate(new Date(), ssOperacion().getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm')],
    ['', ''],
    ['RESUMEN', ''],
    ['Presupuestos pendientes', pendientes],
    ['Por vencer (3 días)', porVencer],
    ['Vencidos', vencidos],
    ['Pedidos pendientes', pedPend],
    ['Pedidos en producción', enProd],
    ['Insumos agotados', rojos],
    ['Insumos bajo mínimo', amarillos],
    ['', ''],
    ['ALERTAS', '']
  ];
  sheet.getRange(1, 1, filas.length, 2).setValues(filas);

  // Estilo de títulos.
  sheet.getRange('A1').setFontFamily('Georgia').setFontSize(20).setFontWeight('bold').setFontColor('#9a4324');
  sheet.getRange('A2').setFontColor('#8c8278');
  sheet.getRange('A4').setFontWeight('bold').setFontColor('#bb5530');
  sheet.getRange('A13').setFontWeight('bold').setFontColor('#bb5530');
  sheet.getRange('B5:B11').setFontFamily('Courier New').setFontWeight('bold');

  var alertas = alertasVencer.concat(alertasProd).concat(alertasStock);
  if (!alertas.length) alertas = ['Todo en orden por ahora.'];
  var inicioAlertas = filas.length + 1;
  var matriz = alertas.map(function (a) { return [a]; });
  sheet.getRange(inicioAlertas, 1, matriz.length, 1).setValues(matriz);
  sheet.getRange(inicioAlertas, 1, matriz.length, 1).setFontColor('#5d544b');

  // Sección AYUDA con link al manual.
  var filaAyuda = inicioAlertas + matriz.length + 1;
  sheet.getRange(filaAyuda, 1).setValue('AYUDA').setFontWeight('bold').setFontColor('#bb5530');
  sheet.getRange(filaAyuda + 1, 1).setFormula('=HYPERLINK("https://jguillermo.github.io/clapastedyke/Manual_de_usuario.html","Manual de usuario")');
  sheet.getRange(filaAyuda + 1, 1).setFontColor('#1155cc').setFontWeight('normal');

  try {
    sheet.setColumnWidth(1, 320);
    sheet.setColumnWidth(2, 180);
  } catch (e) {}
}
