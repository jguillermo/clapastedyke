/**
 * Archivos.gs
 * Todo el sistema vive en UN solo archivo de Google Sheets, el que tienes abierto.
 * Cada hoja es una pestana de ese mismo archivo. Este modulo da acceso a las hojas.
 */

/** El archivo del sistema es siempre el que esta activo. */
function ssOperacion() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/** Alias por compatibilidad: ya no hay segundo archivo, es el mismo. */
function ssCatalogos() {
  return ssOperacion();
}

/**
 * Devuelve la pestana por su nombre. Si no existe, devuelve null.
 * Todas las hojas viven en el mismo archivo.
 */
function hoja(nombre) {
  var def = buscarDef(nombre);
  if (!def) throw new Error('Hoja desconocida: ' + nombre);
  return ssOperacion().getSheetByName(nombre);
}

/** Igual que hoja(), pero lanza error claro si falta (esta sin instalar). */
function hojaReq(nombre) {
  var h = hoja(nombre);
  if (!h) throw new Error('La hoja "' + nombre + '" no existe. Corre Sistema > Instalar o reparar.');
  return h;
}

/** Busca la definicion de una hoja en el esquema. */
function buscarDef(nombre) {
  var defs = definicionEsquema();
  for (var i = 0; i < defs.length; i++) {
    if (defs[i].nombre === nombre) return defs[i];
  }
  return null;
}

/** Nombre del negocio leido de Config, con respaldo "Sistema". */
function nombreNegocio() {
  try {
    var v = getConfigValor('nombre_negocio');
    return v ? String(v) : 'Sistema';
  } catch (e) {
    return 'Sistema';
  }
}
