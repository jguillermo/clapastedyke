/**
 * El esquema de la hoja del usuario: qué pestañas tiene, qué columnas, y cómo se fusiona cada tabla
 * con lo que ya hay escrito.
 *
 * **Es la única fuente**: la usa quien crea la hoja y quien escribe en ella. Hubo una versión en la
 * que esto vivía duplicado dentro de un script que había que desplegar aparte, con lo que eso tiene
 * de desalinearse en silencio; ahora es un fichero del repositorio y lo que se despliega es la app.
 *
 * `fields` va **en paralelo** a `headers`: la app manda objetos y aquí se convierten en filas con
 * este orden, así que cambiar el rótulo de una columna no rompe nada mientras el campo siga
 * llamándose igual.
 */

/** Nombre del fichero en el Drive del usuario. Lo ve él, así que se escribe como se lee. */
export const SPREADSHEET_NAME = 'Clapastedyke — Recetario';

/** Pestaña de servicio: versión del esquema, fecha del último envío y el dato de la prueba. */
export const META_TAB = '_meta';

/** Fila del `_meta` donde va la prueba de ida y vuelta. La 1-4 las ocupan los metadatos. */
export const PROBE_ROW = 6;
export const PROBE_KEY = 'pruebaConexion';

export const SCHEMA_VERSION = 3;

/**
 * Cuántas filas se le piden a una pestaña al crearla. Sheets no crece sola cuando se escribe fuera
 * de la cuadrícula: o cabe, o la petición falla. Con este colchón, un recetario normal no obliga
 * nunca a la llamada extra que la amplía.
 */
export const INITIAL_ROWS = 2000;

export interface SheetTable {
  /** Cómo la llama el lote que manda el origen. */
  name: string;
  /** Cómo se llama la pestaña en la hoja del usuario. */
  title: string;
  fields: readonly string[];
  headers: readonly string[];
  /** Upsert por esta columna: una fila por valor. */
  key?: string;
  /** Reemplazo por padre: se borran todas las filas de ese padre y se reinsertan las que llegan. */
  parentKey?: string;
}

export const SHEET_TABLES: readonly SheetTable[] = [
  {
    name: 'supplies',
    title: 'Insumos',
    key: 'id',
    fields: [
      'id',
      'name',
      'baseUnit',
      'usage',
      'priceAmount',
      'pricePerValue',
      'pricePerUnit',
      'currency',
      'syncedAt',
    ],
    headers: [
      'id',
      'Nombre',
      'Unidad base',
      'Uso',
      'Precio de compra',
      'Presentación (cantidad)',
      'Presentación (unidad)',
      'Moneda',
      'Sincronizado',
    ],
  },
  {
    name: 'recipes',
    title: 'Recetas',
    key: 'id',
    fields: [
      'id',
      'name',
      'categoryId',
      'categoryName',
      'flavorId',
      'flavorLabel',
      'portionsCapacityId',
      'portionsCapacityLabel',
      'moldCapacityId',
      'moldCapacityLabel',
      'lineCount',
      'syncedAt',
    ],
    headers: [
      'id',
      'Nombre',
      'categoriaId',
      'Categoría',
      'saborId',
      'Sabor',
      'capacidadPorcionesId',
      'Porciones',
      'capacidadMoldeId',
      'Molde',
      'Nº de insumos',
      'Sincronizado',
    ],
  },
  {
    name: 'recipeLines',
    title: 'RecetaInsumos',
    parentKey: 'recipeId',
    fields: ['recipeId', 'recipeName', 'supplyId', 'supplyName', 'quantity', 'unit', 'syncedAt'],
    headers: ['recetaId', 'Receta', 'insumoId', 'Insumo', 'Cantidad', 'Unidad', 'Sincronizado'],
  },
  {
    name: 'categories',
    title: 'Categorias',
    key: 'id',
    fields: ['id', 'name', 'syncedAt'],
    headers: ['id', 'Nombre', 'Sincronizado'],
  },
  {
    name: 'flavors',
    title: 'Sabores',
    key: 'id',
    fields: ['id', 'label', 'syncedAt'],
    headers: ['id', 'Sabor', 'Sincronizado'],
  },
  {
    name: 'capacities',
    title: 'Capacidades',
    key: 'id',
    fields: ['id', 'group', 'label', 'factor', 'syncedAt'],
    headers: ['id', 'Grupo', 'Etiqueta', 'Factor', 'Sincronizado'],
  },
];

/** Todas las pestañas de la hoja, en el orden en que se crean. */
export const ALL_TABS: readonly { title: string; headers: readonly string[] }[] = [
  ...SHEET_TABLES.map((table) => ({ title: table.title, headers: table.headers })),
  { title: META_TAB, headers: ['Clave', 'Valor'] },
];

/** `'RecetaInsumos'!A2:G` — las comillas son obligatorias si el nombre lleva `_` o espacios. */
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
