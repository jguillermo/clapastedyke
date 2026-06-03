var t = require('./helpers/microtest');
var loader = require('./helpers/loader');
var ctx = loader.loadServer();
ctx.ejecutarInstalacion(); // crea hojas y siembra los bloques de Config

t.suite('Configuracion (bloques)');

t.test('getConfig lee el bloque generales', function () {
  var cfg = ctx.getConfig();
  t.eq(ctx.numero(cfg.margen_defecto), 35);
  t.eq(ctx.limpiar(cfg.aplicar_igv), 'SI');
  t.eq(ctx.numero(cfg.dias_vencimiento), 15);
});

t.test('factoresDeConfig lee el bloque de factores ordenado', function () {
  var f = ctx.factoresDeConfig();
  t.ok(f.length >= 5);
  t.eq(f[0].codigo, 0.25);
  t.eq(f[f.length - 1].codigo, 3);
});

t.test('tamanosConfig y factorDeTamano leen el bloque de tamaños', function () {
  var tam = ctx.tamanosConfig().map(function (x) { return x.nombre; });
  t.deepEq(tam, ['chico', 'mediano', 'grande']);
  t.eq(ctx.factorDeTamano('grande'), 2);
  t.eq(ctx.factorDeTamano('chico'), 0.5);
  t.eq(ctx.factorDeTamano('inexistente'), 0);
});

t.test('tiposAjusteConfig devuelve nombre y signo', function () {
  var tipos = ctx.tiposAjusteConfig();
  var byName = {};
  tipos.forEach(function (x) { byName[x.nombre] = x.signo; });
  t.eq(byName['merma'], -1);
  t.eq(byName['conteo'], 0);
  t.eq(byName['devolución'], 1);
});

t.test('setConfigGeneral actualiza un parámetro', function () {
  ctx.setConfigGeneral('margen_defecto', 50);
  t.eq(ctx.numero(ctx.getConfig().margen_defecto), 50);
});

t.test('listaTamanos sale del bloque de tamaños', function () {
  t.deepEq(ctx.listaTamanos(), ['chico', 'mediano', 'grande']);
});
