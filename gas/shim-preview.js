/* PREVIEW SHIM — copia EXACTA del de scripts/render-preview.js.
   Inerte en GAS real (detecta window.google.script); en preview/juego evita
   errores de google.script.*. */
(function () {
  if (window.google && window.google.script) return;
  var noop = function () {};
  var chain = {};
  ['withSuccessHandler', 'withFailureHandler', 'withUserObject'].forEach(function (k) {
    chain[k] = function () { return runProxy; };
  });
  var runProxy = new Proxy(chain, {
    get: function (t, p) { return (p in t) ? t[p] : noop; } // funciones de servidor: sin datos en preview
  });
  window.google = {
    script: {
      run: runProxy,
      host: { close: noop, setWidth: noop, setHeight: noop, origin: '' },
      url:  { getLocation: function (cb) { if (cb) cb({ parameter: {} }); } }
    }
  };
})();
