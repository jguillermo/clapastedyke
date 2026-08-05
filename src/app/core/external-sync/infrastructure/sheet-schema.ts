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

/**
 * La versión del esquema con la que se escribe la hoja.
 *
 * | v | qué trajo |
 * |---|---|
 * | 3 | las seis pestañas, escritas en una sola dirección |
 * | 4 | las columnas de servicio (versión, origen, huella, borrado) y el rótulo `(auto)` |
 *
 * Se apunta en `_meta` y **se lee**: es lo que dispara el paso de adopción de una hoja escrita con una
 * versión anterior. Ver `schema-migration.ts`.
 */
export const SCHEMA_VERSION = 4;

/**
 * Las columnas de servicio de la sincronización. Van **al final** de cada tabla, y el rótulo es el
 * propio nombre del campo: no son datos del usuario y conviene que se lean como lo que son.
 *
 * `version` la lleva también la tabla de líneas, pero ahí es **informativa**: es copia de la de su
 * receta, porque las líneas no se fusionan por su cuenta (ver `reconcile.ts`).
 */
export const SERVICE_COLUMNS = ['version', 'origen', 'huella', 'borrado'] as const;

/**
 * Cuántas filas se le piden a una pestaña al crearla. Sheets no crece sola cuando se escribe fuera
 * de la cuadrícula: o cabe, o la petición falla. Con este colchón, un recetario normal no obliga
 * nunca a la llamada extra que la amplía.
 */
export const INITIAL_ROWS = 2000;

export interface SheetTable {
  /** Cómo la llama el lote que manda el origen. */
  name: string;
  /**
   * Qué agregado guarda, con el nombre que usa el origen en sus eventos y en sus referencias.
   *
   * Es lo que permite decirle a quien posee los datos «borra este» sin conocer su modelo: el contrato
   * del shared kernel habla de `{ aggregate, id }`, y esta es la traducción entre eso y una pestaña.
   * La tabla de líneas no lo lleva: no es un agregado, es parte de su receta.
   */
  aggregate?: string;
  /** Cómo se llama la pestaña en la hoja del usuario. */
  title: string;
  fields: readonly string[];
  headers: readonly string[];
  /** Upsert por esta columna: una fila por valor. */
  key?: string;
  /** Reemplazo por padre: se borran todas las filas de ese padre y se reinsertan las que llegan. */
  parentKey?: string;
}

/**
 * Las tablas **sin** sus columnas de servicio, que se añaden después.
 *
 * El rótulo `(auto)` marca las columnas que la app **recalcula sola** a partir de un id: el nombre de
 * la categoría en la fila de la receta, el número de insumos, el nombre del insumo en una línea.
 * Editarlas a mano no hace nada —se regeneran— y como la hoja no se protege, decirlo en la cabecera es
 * lo único que evita que alguien pierda el rato corrigiéndolas.
 *
 * Para cambiar la categoría de una receta se cambia `categoriaId`; para cambiar el nombre de la
 * categoría, su fila en la pestaña Categorias.
 */
const TABLES: readonly SheetTable[] = [
  {
    name: 'supplies',
    aggregate: 'supply',
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
    aggregate: 'recipe',
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
      'Categoría (auto)',
      'saborId',
      'Sabor (auto)',
      'capacidadPorcionesId',
      'Porciones (auto)',
      'capacidadMoldeId',
      'Molde (auto)',
      'Nº de insumos (auto)',
      'Sincronizado',
    ],
  },
  {
    name: 'recipeLines',
    title: 'RecetaInsumos',
    parentKey: 'recipeId',
    fields: ['recipeId', 'recipeName', 'supplyId', 'supplyName', 'quantity', 'unit', 'syncedAt'],
    headers: [
      'recetaId',
      'Receta (auto)',
      'insumoId',
      'Insumo (auto)',
      'Cantidad',
      'Unidad',
      'Sincronizado',
    ],
  },
  {
    name: 'categories',
    aggregate: 'category',
    title: 'Categorias',
    key: 'id',
    fields: ['id', 'name', 'syncedAt'],
    headers: ['id', 'Nombre', 'Sincronizado'],
  },
  {
    name: 'flavors',
    aggregate: 'flavor',
    title: 'Sabores',
    key: 'id',
    fields: ['id', 'label', 'syncedAt'],
    headers: ['id', 'Sabor', 'Sincronizado'],
  },
  {
    name: 'capacities',
    aggregate: 'capacity',
    title: 'Capacidades',
    key: 'id',
    fields: ['id', 'group', 'label', 'factor', 'syncedAt'],
    headers: ['id', 'Grupo', 'Etiqueta', 'Factor', 'Sincronizado'],
  },
];

/**
 * Las tablas con sus columnas de servicio puestas.
 *
 * Van al final a propósito: así las posiciones de las columnas de datos **no cambian** respecto a la
 * v3, y una hoja escrita con la versión anterior se sigue leyendo bien mientras se la migra.
 */
export const SHEET_TABLES: readonly SheetTable[] = TABLES.map((table) => ({
  ...table,
  fields: [...table.fields, ...serviceColumnsFor(table)],
  headers: [...table.headers, ...serviceColumnsFor(table)],
}));

/** Una tabla con clave las lleva todas; la de líneas solo la versión, y de adorno. */
function serviceColumnsFor(table: SheetTable): readonly string[] {
  return table.key === undefined ? ['version'] : [...SERVICE_COLUMNS];
}

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
