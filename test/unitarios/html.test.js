var t = require('./helpers/microtest');
var loader = require('./helpers/loader');

t.suite('HTML (carga de todos los formularios)');

// Smoke: el <script> de cada .html debe cargar y arrancar sin lanzar bajo los mocks.
// Esto atrapa errores de sintaxis y de referencias en el JS embebido.
loader.listHtml().forEach(function (file) {
  t.test('carga ' + file, function () {
    loader.loadHtmlScript(file); // lanza si el script falla al definir/arrancar
  });
});

t.suite('HTML (helpers S de Estilos)');

var est = loader.loadHtmlScript('Estilos.html');

t.test('S existe con sus ayudantes', function () {
  t.ok(est.S && typeof est.S.money === 'function');
  t.ok(typeof est.S.num4 === 'function');
  t.ok(typeof est.S.esc === 'function');
});

t.test('S.esc escapa HTML', function () {
  t.eq(est.S.esc('<a>"&'), '&lt;a&gt;&quot;&amp;');
});

t.test('S.money formatea moneda', function () {
  var m = est.S.money(5);
  t.ok(/^S\/\s/.test(m), 'debe empezar con "S/ "');
  t.ok(m.indexOf('5') >= 0);
});

t.test('S.num4 formatea número', function () {
  var n = est.S.num4(1.5);
  t.ok(n.indexOf('1') >= 0 && n.indexOf('5') >= 0);
});

t.suite('HTML (lógica pura de formularios)');

t.test('NuevoPresupuesto escaladoListo distingue modo tamaño', function () {
  var sb = loader.loadHtmlScript('NuevoPresupuestoForm.html');
  t.eq(typeof sb.escaladoListo, 'function');
  t.ok(sb.escaladoListo({ modo_escalado: 'tamano', tamano: 'grande' }) === true);
  t.ok(sb.escaladoListo({ modo_escalado: 'tamano', tamano: '' }) === false);
  t.ok(sb.escaladoListo({ modo_escalado: 'personas', valor_escalado: 5 }) === true);
  t.ok(sb.escaladoListo({ modo_escalado: 'personas', valor_escalado: 0 }) === false);
});
