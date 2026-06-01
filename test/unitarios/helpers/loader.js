/**
 * loader.js — Carga el código de src/ dentro de contextos vm con los mocks.
 *   loadServer()        -> sandbox con todos los src/*.js cargados (estilo GAS:
 *                          todas las funciones comparten el mismo scope global).
 *   loadHtmlScript(file)-> sandbox de navegador con el <script> de Estilos.html
 *                          (define S) y luego el de `file` cargados.
 *   listHtml()          -> nombres de los .html en src/.
 *   seedSheet(sb,h,rows)-> escribe título+cabeceras+filas en la hoja del mock,
 *                          mapeando slug->columna vía el esquema.
 */

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var mockGas = require('./mockGas');
var mockBrowser = require('./mockBrowser');

var SRC = path.join(__dirname, '..', '..', '..', 'src');

function listJs() { return fs.readdirSync(SRC).filter(function (f) { return /\.js$/.test(f); }); }
function listHtml() { return fs.readdirSync(SRC).filter(function (f) { return /\.html$/.test(f); }); }

function leer(f) { return fs.readFileSync(path.join(SRC, f), 'utf8'); }

/** Saca el JS de todos los bloques <script> y limpia el templating <?= ?> / <?!= ?>. */
function extraerScript(html) {
  var out = [];
  var re = /<script>([\s\S]*?)<\/script>/g, m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out.join('\n').replace(/<\?!?=?[\s\S]*?\?>/g, '0');
}

function loadServer() {
  var sandbox = mockGas.makeGasMock();
  vm.createContext(sandbox);
  listJs().forEach(function (f) {
    vm.runInContext(leer(f), sandbox, { filename: f });
  });
  return sandbox;
}

function loadHtmlScript(file) {
  var sandbox = mockBrowser.makeBrowserMock();
  vm.createContext(sandbox);
  // Estilos define el objeto S, del que dependen los formularios.
  if (file !== 'Estilos.html') {
    vm.runInContext(extraerScript(leer('Estilos.html')), sandbox, { filename: 'Estilos.html' });
  }
  vm.runInContext(extraerScript(leer(file)), sandbox, { filename: file });
  return sandbox;
}

/** Siembra una hoja del mock con filas (objetos por slug). */
function seedSheet(sandbox, nombre, rows) {
  var def = sandbox.buscarDef(nombre);
  var titulos = sandbox.titulosDe(def);
  var slugs = sandbox.slugsDe(def);
  var ss = sandbox.SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  sh.getRange(1, 1).setValue(def.titulo_hoja || nombre);
  sh.getRange(2, 1, 1, titulos.length).setValues([titulos]);
  (rows || []).forEach(function (obj, i) {
    var arr = slugs.map(function (s) { return obj[s] === undefined ? '' : obj[s]; });
    sh.getRange(3 + i, 1, 1, arr.length).setValues([arr]);
  });
  return sh;
}

module.exports = {
  loadServer: loadServer, loadHtmlScript: loadHtmlScript,
  listJs: listJs, listHtml: listHtml, extraerScript: extraerScript, seedSheet: seedSheet
};
