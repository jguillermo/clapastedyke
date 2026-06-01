/**
 * mockGas.js — Mock de las APIs de Google Apps Script para correr el código del
 * servidor (src/*.js) en Node, sin Google.
 *
 * Modela un spreadsheet en memoria con celdas (matriz 2D por hoja). Los setters
 * de formato (setFontWeight, setBackground, etc.) son no-op encadenables. Las
 * fórmulas se guardan como texto (NO se evalúan): los tests que necesiten un
 * valor calculado deben sembrar números directamente.
 *
 * makeGasMock() devuelve un "sandbox" con todos los globales que usa el código,
 * listo para vm.createContext. El spreadsheet vive en sandbox.__ss.
 */

function celdaVacia() { return ''; }

function Hoja(nombre) {
  this.nombre = nombre;
  this.cells = [];        // cells[r-1][c-1]
  this.protections = [];
  this.merges = [];       // strings "r,c,nr,nc"
}
Hoja.prototype._ensure = function (r, c) {
  while (this.cells.length < r) this.cells.push([]);
  for (var i = 0; i < r; i++) { while (this.cells[i].length < c) this.cells[i].push(''); }
};
Hoja.prototype.getName = function () { return this.nombre; };
Hoja.prototype.getLastRow = function () {
  var last = 0;
  for (var r = 0; r < this.cells.length; r++) {
    var fila = this.cells[r] || [];
    for (var c = 0; c < fila.length; c++) {
      if (String(fila[c]) !== '') { last = r + 1; break; }
    }
  }
  return last;
};
Hoja.prototype.getLastColumn = function () {
  var last = 0;
  for (var r = 0; r < this.cells.length; r++) {
    var fila = this.cells[r] || [];
    for (var c = fila.length - 1; c >= 0; c--) {
      if (String(fila[c]) !== '') { if (c + 1 > last) last = c + 1; break; }
    }
  }
  return last;
};
Hoja.prototype.getMaxRows = function () { return Math.max(1000, this.getLastRow() + 50); };
Hoja.prototype.getMaxColumns = function () { return Math.max(26, this.getLastColumn() + 5); };
Hoja.prototype.getRange = function (r, c, nr, nc) { return new Rango(this, r, c, nr || 1, nc || 1); };
Hoja.prototype.getDataRange = function () {
  return new Rango(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn()));
};
Hoja.prototype.appendRow = function (arr) {
  var r = this.getLastRow() + 1;
  this._ensure(r, arr.length);
  for (var c = 0; c < arr.length; c++) this.cells[r - 1][c] = arr[c];
  return this;
};
Hoja.prototype.insertRowsAfter = function (row, n) {
  this._ensure(row, 1);
  var nuevas = [];
  for (var i = 0; i < n; i++) nuevas.push([]);
  this.cells.splice(row, 0, ...nuevas);
  return this;
};
Hoja.prototype.setFrozenRows = function () { return this; };
Hoja.prototype.setHiddenGridlines = function () { return this; };
Hoja.prototype.setColumnWidth = function () { return this; };
Hoja.prototype.getColumnWidth = function () { return 150; };
Hoja.prototype.autoResizeColumns = function () { return this; };
Hoja.prototype.setRowHeight = function () { return this; };
Hoja.prototype.protect = function () {
  var p = new Proteccion();
  this.protections.push(p);
  return p;
};
Hoja.prototype.getProtections = function () { return this.protections.slice(); };

function Proteccion() { this._desc = ''; this._removed = false; }
Proteccion.prototype.setDescription = function (d) { this._desc = d; return this; };
Proteccion.prototype.setWarningOnly = function () { return this; };
Proteccion.prototype.getDescription = function () { return this._desc; };
Proteccion.prototype.remove = function () { this._removed = true; };

function Rango(hoja, r, c, nr, nc) {
  this.hoja = hoja; this.r = r; this.c = c; this.nr = nr; this.nc = nc;
  hoja._ensure(r + nr - 1, c + nc - 1);
}
Rango.prototype.getValues = function () {
  var out = [];
  for (var i = 0; i < this.nr; i++) {
    var fila = [];
    for (var j = 0; j < this.nc; j++) {
      var rr = this.r + i - 1, cc = this.c + j - 1;
      fila.push((this.hoja.cells[rr] && this.hoja.cells[rr][cc] !== undefined) ? this.hoja.cells[rr][cc] : '');
    }
    out.push(fila);
  }
  return out;
};
Rango.prototype.getValue = function () { return this.getValues()[0][0]; };
Rango.prototype.setValues = function (vals) {
  for (var i = 0; i < vals.length; i++) {
    for (var j = 0; j < vals[i].length; j++) {
      var rr = this.r + i - 1, cc = this.c + j - 1;
      this.hoja._ensure(rr + 1, cc + 1);
      this.hoja.cells[rr][cc] = vals[i][j];
    }
  }
  return this;
};
Rango.prototype.setValue = function (v) {
  this.hoja._ensure(this.r, this.c);
  this.hoja.cells[this.r - 1][this.c - 1] = v;
  return this;
};
Rango.prototype.setFormula = function (f) { return this.setValue(f); };
Rango.prototype.clearContent = function () {
  for (var i = 0; i < this.nr; i++) for (var j = 0; j < this.nc; j++) {
    var rr = this.r + i - 1, cc = this.c + j - 1;
    if (this.hoja.cells[rr]) this.hoja.cells[rr][cc] = '';
  }
  return this;
};
Rango.prototype.clearDataValidations = function () { return this; };
Rango.prototype.setDataValidation = function () { return this; };
Rango.prototype.insertCheckboxes = function () { return this; };
Rango.prototype.merge = function () { this.hoja.merges.push([this.r, this.c, this.nr, this.nc].join(',')); return this; };
Rango.prototype.isPartOfMerge = function () {
  var key = [this.r, this.c, this.nr, this.nc].join(',');
  return this.hoja.merges.indexOf(key) >= 0;
};
// Setters de formato encadenables (no-op).
['setFontWeight', 'setFontSize', 'setFontColor', 'setFontFamily', 'setBackground',
 'setVerticalAlignment', 'setHorizontalAlignment', 'setWrap', 'setBorder',
 'setNumberFormat', 'setNote'].forEach(function (m) {
  Rango.prototype[m] = function () { return this; };
});

function Spreadsheet() { this.sheets = []; this.active = null; this.toasts = []; }
Spreadsheet.prototype.getSheetByName = function (n) {
  return this.sheets.filter(function (s) { return s.getName() === n; })[0] || null;
};
Spreadsheet.prototype.insertSheet = function (n) { var s = new Hoja(n); this.sheets.push(s); return s; };
Spreadsheet.prototype.getSheets = function () { return this.sheets.slice(); };
Spreadsheet.prototype.deleteSheet = function (s) {
  this.sheets = this.sheets.filter(function (x) { return x !== s; });
};
Spreadsheet.prototype.setActiveSheet = function (s) { this.active = s; return s; };
Spreadsheet.prototype.getActiveSheet = function () { return this.active; };
Spreadsheet.prototype.moveActiveSheet = function () {};
Spreadsheet.prototype.toast = function (msg, titulo) { this.toasts.push({ msg: msg, titulo: titulo }); };
Spreadsheet.prototype.getSpreadsheetTimeZone = function () { return 'America/Lima'; };

function makeGasMock() {
  var ss = new Spreadsheet();

  var SpreadsheetApp = {
    getActiveSpreadsheet: function () { return ss; },
    getUi: function () {
      return {
        alert: function () {},
        showModalDialog: function () {},
        showSidebar: function () {},
        createMenu: function () { var m = { addItem: function () { return m; }, addSeparator: function () { return m; }, addSubMenu: function () { return m; }, addToUi: function () {} }; return m; },
        ButtonSet: { OK: 'OK' }
      };
    },
    newDataValidation: function () {
      var b = { requireValueInList: function () { return b; }, setAllowInvalid: function () { return b; }, build: function () { return {}; } };
      return b;
    },
    ProtectionType: { SHEET: 'SHEET' },
    BorderStyle: { SOLID: 'SOLID' }
  };

  var LockService = { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } };
  var Session = { getActiveUser: function () { return { getEmail: function () { return 'test@example.com'; } }; } };
  var Utilities = {
    formatDate: function (d, tz, fmt) {
      d = (d instanceof Date) ? d : new Date(d);
      function p(n) { return ('0' + n).slice(-2); }
      return fmt.replace('dd', p(d.getDate())).replace('MM', p(d.getMonth() + 1))
               .replace('yyyy', d.getFullYear()).replace('HH', p(d.getHours())).replace('mm', p(d.getMinutes()));
    }
  };
  var HtmlService = {
    createHtmlOutputFromFile: function () { return { getContent: function () { return ''; } }; },
    createTemplateFromFile: function () { return { evaluate: function () { return { setWidth: function () { return this; }, setHeight: function () { return this; } }; } }; },
    createHtmlOutput: function () { return { setWidth: function () { return this; }, setHeight: function () { return this; } }; }
  };
  var ScriptApp = { getProjectTriggers: function () { return []; }, newTrigger: function () { var t = { forSpreadsheet: function () { return t; }, onEdit: function () { return t; }, create: function () {} }; return t; } };

  var sandbox = {
    SpreadsheetApp: SpreadsheetApp, LockService: LockService, Session: Session,
    Utilities: Utilities, HtmlService: HtmlService, ScriptApp: ScriptApp,
    console: console, JSON: JSON, Math: Math, Date: Date, Number: Number, String: String,
    Array: Array, Object: Object, isNaN: isNaN, parseInt: parseInt, parseFloat: parseFloat,
    __ss: ss
  };
  sandbox.globalThis = sandbox;
  return sandbox;
}

module.exports = { makeGasMock: makeGasMock };
