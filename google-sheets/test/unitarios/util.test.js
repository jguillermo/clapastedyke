var t = require('./helpers/microtest');
var loader = require('./helpers/loader');
var ctx = loader.loadServer();

t.suite('Util');

t.test('numero convierte y cae a 0', function () {
  t.eq(ctx.numero('3.5'), 3.5);
  t.eq(ctx.numero(''), 0);
  t.eq(ctx.numero('abc'), 0);
  t.eq(ctx.numero(null), 0);
});

t.test('limpiar recorta espacios', function () {
  t.eq(ctx.limpiar('  hola  '), 'hola');
  t.eq(ctx.limpiar(null), '');
});

t.test('leerHoja/agregarFila hacen round-trip por slug, con cabecera en fila 2', function () {
  loader.seedSheet(ctx, ctx.HOJA.CLIENTES, []);
  ctx.agregarFila(ctx.HOJA.CLIENTES, { id: 'CL-0001', nombre: 'Ana', telefono: '999', notas: 'vip' });
  var datos = ctx.leerHoja(ctx.HOJA.CLIENTES);
  t.eq(datos.filas.length, 1);
  t.eq(datos.filas[0].nombre, 'Ana');
  t.eq(datos.filas[0].telefono, '999');
  t.eq(datos.filas[0]._fila, 3, 'la primera fila de datos es la 3 (título=1, cabeceras=2)');
});

t.test('la hoja muestra el título legible en la cabecera (fila 2)', function () {
  var ss = ctx.SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ctx.HOJA.CLIENTES);
  var cabeceras = sh.getRange(2, 1, 1, 5).getValues()[0];
  t.eq(cabeceras[1], 'Nombre');
  t.eq(cabeceras[2], 'Teléfono');
});

t.test('siguienteId incrementa el mayor', function () {
  // Clientes ya tiene CL-0001 sembrado arriba.
  t.eq(ctx.siguienteId(ctx.HOJA.CLIENTES), 'CL-0002');
});

t.test('agregarFila NO escribe columnas calculadas (precio/gramo)', function () {
  loader.seedSheet(ctx, ctx.HOJA.INSUMOS, []);
  ctx.agregarFila(ctx.HOJA.INSUMOS, {
    id: 'IN-0001', nombre: 'Harina', tipo: 'ingrediente', unidad_base: 'g',
    tamano_presentacion: 1000, precio_presentacion: 5, stock_actual: 0, stock_minimo: 100,
    precio_por_unidad_base: 999 // calculada: debe IGNORARSE
  });
  var ss = ctx.SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ctx.HOJA.INSUMOS);
  var def = ctx.buscarDef(ctx.HOJA.INSUMOS);
  var idxCalc = ctx.slugsDe(def).indexOf('precio_por_unidad_base'); // 0-based
  var valor = sh.getRange(3, idxCalc + 1).getValue();
  t.eq(String(valor), '', 'la celda calculada debe quedar vacía para que la fórmula la llene');
});
