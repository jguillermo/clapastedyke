var t = require('./helpers/microtest');
var loader = require('./helpers/loader');
var ctx = loader.loadServer();
ctx.ejecutarInstalacion();

t.suite('Inventario');

t.test('semaforoDe: rojo/amarillo/verde', function () {
  t.eq(ctx.semaforoDe(0, 10), 'rojo');
  t.eq(ctx.semaforoDe(5, 10), 'amarillo');
  t.eq(ctx.semaforoDe(20, 10), 'verde');
});

t.test('signoAjuste usa el signo del tipo (de Config)', function () {
  t.eq(ctx.signoAjuste('merma', 30), -30, 'merma resta');
  t.eq(ctx.signoAjuste('devolución', 30), 30, 'devolución suma');
  t.eq(ctx.signoAjuste('conteo', -3), -3, 'conteo respeta el signo');
  t.eq(ctx.signoAjuste('conteo', 3), 3);
});

t.test('moverStock actualiza stock y registra movimiento', function () {
  loader.seedSheet(ctx, ctx.HOJA.INSUMOS, [
    { id: 'IN-0001', nombre: 'Harina', tipo: 'ingrediente', unidad_base: 'g',
      tamano_presentacion: 1000, precio_presentacion: 5, stock_actual: 100, stock_minimo: 50 }
  ]);
  loader.seedSheet(ctx, ctx.HOJA.MOVIMIENTOS, []);
  var nuevo = ctx.moverStock('IN-0001', -40, 'merma', '', 'prueba');
  t.eq(nuevo, 60);
  var ins = ctx.leerHoja(ctx.HOJA.INSUMOS).filas[0];
  t.eq(ctx.numero(ins.stock_actual), 60);
  var movs = ctx.leerHoja(ctx.HOJA.MOVIMIENTOS).filas;
  t.eq(movs.length, 1);
  t.eq(ctx.numero(movs[0].stock_resultante), 60);
});
