var t = require('./helpers/microtest');
var loader = require('./helpers/loader');
var ctx = loader.loadServer();

t.suite('Esquema');

t.test('columnaLetra mapea 1->A, 26->Z, 27->AA', function () {
  t.eq(ctx.columnaLetra(1), 'A');
  t.eq(ctx.columnaLetra(26), 'Z');
  t.eq(ctx.columnaLetra(27), 'AA');
  t.eq(ctx.columnaLetra(28), 'AB');
});

t.test('slugDeTitulo y tituloDeSlug son inversos en Insumos', function () {
  var def = ctx.buscarDef(ctx.HOJA.INSUMOS);
  t.eq(ctx.tituloDeSlug(def, 'precio_presentacion'), 'Precio presentación');
  t.eq(ctx.slugDeTitulo(def, 'Precio presentación'), 'precio_presentacion');
});

t.test('Insumos tiene 2 columnas calculadas (precio/gramo y semaforo)', function () {
  var def = ctx.buscarDef(ctx.HOJA.INSUMOS);
  var calc = ctx.columnasCalc(def).map(function (c) { return c.slug; });
  t.deepEq(calc, ['precio_por_unidad_base', 'semaforo']);
  t.ok(ctx.esColumnaCalc(def, 'semaforo'));
  t.ok(!ctx.esColumnaCalc(def, 'stock_actual'));
});

t.test('mapaColumnasLetra ubica columnas por orden', function () {
  var def = ctx.buscarDef(ctx.HOJA.INSUMOS);
  var L = ctx.mapaColumnasLetra(def);
  t.eq(L.id, 'A');
  t.eq(L.stock_actual, 'G');
  t.eq(L.stock_minimo, 'H');
});

t.test('las hojas Factores e Inicio ya no existen en el esquema', function () {
  var nombres = ctx.definicionEsquema().map(function (d) { return d.nombre; });
  t.ok(nombres.indexOf('Factores') < 0, 'no debe haber hoja Factores');
  t.ok(nombres.indexOf('Inicio') < 0, 'no debe haber hoja Inicio');
  t.ok(nombres.indexOf(ctx.HOJA.RESUMEN) >= 0, 'debe existir Resumen');
});

t.test('Config define los 4 bloques', function () {
  var def = ctx.buscarDef(ctx.HOJA.CONFIG);
  var claves = def.bloques.map(function (b) { return b.clave; });
  t.deepEq(claves, ['generales', 'factores', 'tamanos', 'tipos_ajuste']);
});
