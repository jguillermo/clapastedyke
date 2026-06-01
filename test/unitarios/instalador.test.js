var t = require('./helpers/microtest');
var loader = require('./helpers/loader');
var ctx = loader.loadServer();
ctx.ejecutarInstalacion();
var ss = ctx.SpreadsheetApp.getActiveSpreadsheet();

t.suite('Instalador');

t.test('crea todas las hojas del esquema', function () {
  ctx.definicionEsquema().forEach(function (def) {
    t.ok(ss.getSheetByName(def.nombre), 'falta la hoja ' + def.nombre);
  });
});

t.test('cada hoja de datos tiene título (fila 1) y cabeceras legibles (fila 2)', function () {
  var sh = ss.getSheetByName(ctx.HOJA.INSUMOS);
  t.eq(sh.getRange(1, 1).getValue(), 'Insumos — catálogo, costo y stock');
  t.eq(sh.getRange(2, 1).getValue(), 'ID');
  t.eq(sh.getRange(2, 2).getValue(), 'Nombre');
});

t.test('siembra fórmula en la columna calculada precio por unidad base', function () {
  var sh = ss.getSheetByName(ctx.HOJA.INSUMOS);
  var def = ctx.buscarDef(ctx.HOJA.INSUMOS);
  var idx = ctx.slugsDe(def).indexOf('precio_por_unidad_base');
  var f = String(sh.getRange(3, idx + 1).getValue());
  t.ok(f.indexOf('ARRAYFORMULA') >= 0, 'la celda debe tener una ARRAYFORMULA');
});

t.test('Config queda con sus bloques (títulos en columna A)', function () {
  var sh = ss.getSheetByName(ctx.HOJA.CONFIG);
  var colA = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(function (r) { return String(r[0]); });
  t.ok(colA.indexOf('Parámetros generales') >= 0);
  t.ok(colA.indexOf('Factores de escalado') >= 0);
  t.ok(colA.indexOf('Tamaños') >= 0);
  t.ok(colA.indexOf('Tipos de ajuste') >= 0);
});

t.test('reinstalar es idempotente: no duplica hojas', function () {
  var antes = ss.getSheets().length;
  ctx.ejecutarInstalacion();
  t.eq(ss.getSheets().length, antes, 'no debe crear hojas nuevas al reparar');
});

t.test('reparar no pisa un valor editado a mano en Config', function () {
  ctx.setConfigGeneral('margen_defecto', 77);
  ctx.ejecutarInstalacion();
  t.eq(ctx.numero(ctx.getConfig().margen_defecto), 77, 'el valor editado debe sobrevivir a reparar');
});
