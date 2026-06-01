/**
 * microtest.js — micro framework de tests, sin dependencias.
 * Uso:
 *   const t = require('./helpers/microtest');
 *   t.suite('Util');
 *   t.test('numero convierte texto', () => t.eq(ctx.numero('3'), 3));
 *   // en run.js: t.run();
 */

var _tests = [];
var _suite = '';

function suite(nombre) { _suite = nombre; }

function test(nombre, fn) { _tests.push({ suite: _suite, nombre: nombre, fn: fn }); }

// ----- asserts -----
function eq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': esperaba ' + JSON.stringify(b) + ' y obtuve ' + JSON.stringify(a));
}
function ok(v, msg) { if (!v) throw new Error((msg || 'ok') + ': el valor no es verdadero (' + JSON.stringify(v) + ')'); }
function almost(a, b, msg, tol) {
  tol = tol || 1e-6;
  if (Math.abs(a - b) > tol) throw new Error((msg || 'almost') + ': esperaba ~' + b + ' y obtuve ' + a);
}
function deepEq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error((msg || 'deepEq') + ': esperaba ' + JSON.stringify(b) + ' y obtuve ' + JSON.stringify(a));
  }
}
function throws(fn, msg) {
  var lanzo = false;
  try { fn(); } catch (e) { lanzo = true; }
  if (!lanzo) throw new Error((msg || 'throws') + ': se esperaba un error y no se lanzó');
}

function run() {
  var pasados = 0, fallidos = 0, ultimaSuite = '';
  _tests.forEach(function (t) {
    if (t.suite !== ultimaSuite) { console.log('\n=== ' + t.suite + ' ==='); ultimaSuite = t.suite; }
    try {
      t.fn();
      pasados++;
      console.log('  ✓ ' + t.nombre);
    } catch (e) {
      fallidos++;
      console.log('  ✗ ' + t.nombre + '\n      ' + (e && e.message ? e.message : e));
    }
  });
  console.log('\n----------------------------------------');
  console.log('Total: ' + (pasados + fallidos) + '  Pasados: ' + pasados + '  Fallidos: ' + fallidos);
  return fallidos;
}

module.exports = { suite: suite, test: test, eq: eq, ok: ok, almost: almost, deepEq: deepEq, throws: throws, run: run };
