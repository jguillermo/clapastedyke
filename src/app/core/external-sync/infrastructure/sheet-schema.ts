/**
 * Lo que la hoja del usuario tiene de fijo: cómo se llama el fichero, su pestaña de servicio, y cómo
 * se escribe un rango.
 *
 * **Aquí no hay columnas ni tablas**, y esa ausencia es el cambio de fondo: las pestañas se llaman
 * como los stores que se replican y sus columnas se deducen de los datos, así que replicar algo nuevo
 * no obliga a tocar este fichero. Antes vivía aquí una lista de seis tablas con sus campos y sus
 * rótulos, y olvidarse de actualizarla al añadir un campo lo perdía en silencio.
 */

/** Nombre del fichero en el Drive del usuario. Lo ve él, así que se escribe como se lee. */
export const SPREADSHEET_NAME = 'Clapastedyke — Recetario';

/** Pestaña de servicio: versión del esquema, fecha del último envío y el dato de la prueba. */
export const META_TAB = '_meta';

/** Fila del `_meta` donde va la prueba de ida y vuelta. La 1-4 las ocupan los metadatos. */
export const PROBE_ROW = 6;
export const PROBE_KEY = 'pruebaConexion';

/**
 * La versión del esquema con la que se escribe la hoja.
 *
 * | v | qué trajo |
 * |---|---|
 * | 3 | seis pestañas con rótulos en español, escritas en una sola dirección |
 * | 4 | las columnas de servicio (versión, origen, huella, borrado) y el rótulo `(auto)` |
 * | 5 | una pestaña por tabla, columnas deducidas de los datos, sin columnas derivadas |
 *
 * Se apunta en `_meta` y **se lee**: es lo que dispara el retiro de las pestañas de la versión
 * anterior (ver `GoogleSheetsRemoteRepository`).
 */
export const SCHEMA_VERSION = 5;

/**
 * Cuántas filas se le piden a una pestaña al crearla. Sheets no crece sola cuando se escribe fuera
 * de la cuadrícula: o cabe, o la petición falla. Con este colchón, un recetario normal no obliga
 * nunca a la llamada extra que la amplía.
 */
export const INITIAL_ROWS = 2000;

/** `'Insumos'!A2:G` — un rango de una pestaña, con el nombre entrecomillado como pide Sheets. */
export function rangeOf(title: string, range: string): string {
  return `'${title.replace(/'/g, "''")}'!${range}`;
}

/** `A`…`Z`, `AA`… — la letra de la última columna de una tabla de `count` campos. */
export function columnLetter(count: number): string {
  let letters = '';
  let n = count;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}
