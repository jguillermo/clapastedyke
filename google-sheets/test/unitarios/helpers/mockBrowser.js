/**
 * mockBrowser.js — Mock mínimo del navegador para correr el JS embebido en los
 * .html (el objeto S de Estilos y la lógica de los formularios) bajo Node.
 *
 * No es un DOM real: getElementById devuelve un elemento "universal" que acepta
 * cualquier propiedad/método usado por los formularios. google.script.run es un
 * no-op encadenable (no dispara callbacks), así que el código de arranque de cada
 * formulario corre sin lanzar errores y las funciones quedan definidas para testear.
 */

function makeEl() {
  var el = {
    value: '', checked: false, textContent: '', innerHTML: '', disabled: false,
    id: '', placeholder: '', title: '',
    style: {},
    classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
    appendChild: function (c) { return c; },
    removeChild: function (c) { return c; },
    addEventListener: function () {},
    removeEventListener: function () {},
    setAttribute: function () {},
    getAttribute: function () { return ''; },
    querySelector: function () { return makeEl(); },
    querySelectorAll: function () { return []; },
    focus: function () {}, blur: function () {}, remove: function () {},
    scrollIntoView: function () {}, click: function () {}
  };
  el.parentNode = el;
  return el;
}

function makeBrowserMock() {
  var universal = makeEl();
  var document = {
    getElementById: function () { return universal; },
    createElement: function () { return makeEl(); },
    querySelector: function () { return makeEl(); },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    body: { appendChild: function (c) { return c; }, scrollHeight: 0 }
  };

  // google.script.run: cualquier método es un no-op; with*Handler devuelve el runner.
  var runner = new Proxy({}, {
    get: function (target, prop) {
      if (prop === 'withSuccessHandler' || prop === 'withFailureHandler') {
        return function () { return runner; };
      }
      return function () { return runner; };
    }
  });
  var google = { script: { run: runner, host: { close: function () {} } } };

  var win = {
    confirm: function () { return true; },
    prompt: function () { return ''; },
    alert: function () {},
    open: function () {},
    scrollTo: function () {},
    setTimeout: function () { return 0; },
    clearTimeout: function () {}
  };

  var sandbox = {
    document: document, google: google, window: win,
    confirm: win.confirm, prompt: win.prompt, alert: win.alert,
    setTimeout: win.setTimeout, clearTimeout: win.clearTimeout,
    console: console, JSON: JSON, Math: Math, Date: Date, Number: Number,
    String: String, Array: Array, Object: Object, isNaN: isNaN,
    parseInt: parseInt, parseFloat: parseFloat,
    __el: universal
  };
  sandbox.globalThis = sandbox;
  return sandbox;
}

module.exports = { makeBrowserMock: makeBrowserMock, makeEl: makeEl };
