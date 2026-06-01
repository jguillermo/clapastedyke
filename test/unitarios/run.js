/**
 * run.js — Corre TODOS los tests unitarios (servidor .js y HTML) bajo Node con
 * los mocks de Google. Uso: node test/unitarios/run.js  (o npm test)
 */
var fs = require('fs');
var path = require('path');
var t = require('./helpers/microtest');

// Carga cada archivo *.test.js de esta carpeta (registran sus tests).
fs.readdirSync(__dirname)
  .filter(function (f) { return /\.test\.js$/.test(f); })
  .sort()
  .forEach(function (f) { require(path.join(__dirname, f)); });

var fallidos = t.run();
process.exit(fallidos > 0 ? 1 : 0);
