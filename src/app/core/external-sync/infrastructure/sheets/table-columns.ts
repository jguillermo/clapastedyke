/**
 * Qué columnas tiene una pestaña y de qué clase es cada una — **deducido de los datos**, no de un
 * esquema escrito a mano.
 *
 * ## Por qué no hay esquema
 *
 * El sincronizador mueve tablas y no sabe qué significan. Si las columnas vinieran de una lista
 * mantenida a mano, replicar una tabla nueva —o añadir un campo a una que ya se replica— obligaría a
 * tocar este contexto, y olvidarse de hacerlo perdería ese campo **en silencio**. Deduciéndolas, un
 * campo nuevo aparece en la hoja el primer ciclo y ya está.
 *
 * ## El orden es estable, y eso importa más de lo que parece
 *
 * Las columnas que ya están en la hoja **conservan su posición**, en el orden en que están; las nuevas
 * se añaden al final, ordenadas alfabéticamente para que dos dispositivos que descubran el mismo campo
 * a la vez lo pongan en el mismo sitio. Reordenar la hoja de alguien porque hoy hemos leído los
 * registros en otro orden sería, además de grosero, un cambio masivo cada ciclo.
 *
 * ## La clase de una columna la decide el valor, no un mapa
 *
 * El motor anterior llevaba un mapa `tabla → columna → clase` escrito a mano. Aquí no cabe: no hay
 * esquema que consultar. La regla que lo sustituye:
 *
 * | Valor local | Clase | Por qué |
 * |---|---|---|
 * | `number` | `number` | `2.5` y `'2.5'` tienen que dar la misma huella vengan de donde vengan |
 * | `boolean` | `flag` | `true` y `'TRUE'` son lo mismo |
 * | el campo `id` | `code` | la identidad se compara sin mayúsculas: quien teclea `ING-1` se refiere a `ing-1` |
 * | cualquier otra cosa | `text` | lo prudente: se compara tal cual, sin interpretar |
 *
 * **La clase se decide una vez por columna y por ciclo**, mirando el primer valor local que no esté
 * vacío, y si la columna solo existe en la hoja, el primer valor remoto. Decidirla por fila haría que
 * la misma columna se canonizara de dos maneras dentro del mismo ciclo — que es exactamente cómo se
 * fabrica una huella que no coincide consigo misma.
 */

import { canonicalText, canonicalValue, FieldKind, RawValue } from '../sheet-canonical';
import { ARRAY_SUFFIX, Cells } from './row-shape';

/**
 * Las columnas de servicio de la sincronización. Van al final de cada pestaña y **nunca** entran en la
 * huella: una fila cuya huella cambiara al escribir su propia huella no convergería jamás.
 */
export const SERVICE_COLUMNS = ['version', 'origen', 'huella', 'borrado'] as const;
const SERVICE = new Set<string>(SERVICE_COLUMNS);

/** El campo que toda tabla replicable tiene, y que es su identidad. */
export const ID_COLUMN = 'id';

export interface TableShape {
  /** Las columnas de datos, en orden estable. Sin las de servicio. */
  readonly columns: readonly string[];
  /** Todas las columnas de la pestaña: las de datos y, al final, las de servicio. */
  readonly headers: readonly string[];
  readonly kinds: Readonly<Record<string, FieldKind>>;
}

/**
 * La forma de una pestaña a partir de lo que hay: lo que ya tiene escrito la hoja, las filas locales y
 * las remotas.
 *
 * `existing` son las cabeceras leídas de la hoja. Se respetan tal cual —incluidas columnas que ya
 * nadie escribe— porque borrar una columna de la hoja de alguien es una decisión que este código no
 * puede tomar: puede ser un campo que se dejó de usar, o puede ser que hoy no haya ninguna fila que lo
 * traiga.
 */
export function shapeOf(
  existing: readonly string[],
  local: readonly Cells[],
  remote: readonly Cells[],
): TableShape {
  const known = existing.filter((column) => column.length > 0 && !SERVICE.has(column));
  const seen = new Set(known);
  const discovered = new Set<string>();

  for (const cells of [...local, ...remote]) {
    for (const column of Object.keys(cells)) {
      if (!seen.has(column) && !SERVICE.has(column)) {
        discovered.add(column);
      }
    }
  }

  const columns = [...known, ...sortDiscovered(discovered)];
  return {
    columns,
    headers: [...columns, ...SERVICE_COLUMNS],
    kinds: kindsOf(columns, local, remote),
  };
}

/**
 * Las columnas que no estaban en la hoja, en el orden en que se van a añadir: **el `id` primero** y el
 * resto alfabético.
 *
 * Alfabético para que dos dispositivos que descubran los mismos campos a la vez los pongan en el mismo
 * sitio; si no, cada uno reordenaría la hoja del otro en cada ciclo. Y el `id` delante porque es lo
 * primero que mira quien abre la pestaña, y dejarlo donde caiga («activo, id, name…») convierte una
 * tabla recién creada en algo que no se lee.
 *
 * Solo afecta a las columnas **nuevas**: las que ya están en la hoja conservan su posición aunque el
 * `id` esté en medio. Moverlas sería reordenar la hoja de alguien sin que lo haya pedido.
 */
function sortDiscovered(discovered: ReadonlySet<string>): readonly string[] {
  const rest = [...discovered].filter((column) => column !== ID_COLUMN).sort();
  return discovered.has(ID_COLUMN) ? [ID_COLUMN, ...rest] : rest;
}

/**
 * La clase de cada columna. Se mira **primero lo local**, que es el dato con su tipo de verdad; lo
 * remoto solo decide en columnas que aquí no existen todavía, donde lo único que hay es lo que Sheets
 * haya devuelto.
 */
function kindsOf(
  columns: readonly string[],
  local: readonly Cells[],
  remote: readonly Cells[],
): Record<string, FieldKind> {
  const kinds: Record<string, FieldKind> = {};

  for (const column of columns) {
    if (column === ID_COLUMN) {
      kinds[column] = 'code';
      continue;
    }
    if (column.endsWith(ARRAY_SUFFIX)) {
      // Una lista viaja como JSON: se compara como texto, carácter a carácter. El orden de las claves
      // ya lo normalizó `row-shape`.
      kinds[column] = 'text';
      continue;
    }
    kinds[column] = kindFromValue(firstDefined(column, local) ?? firstDefined(column, remote));
  }
  return kinds;
}

function firstDefined(column: string, rows: readonly Cells[]): RawValue {
  for (const cells of rows) {
    const value = cells[column];
    if (value !== null && value !== undefined && canonicalText(value).length > 0) {
      return value;
    }
  }
  return undefined;
}

function kindFromValue(value: RawValue): FieldKind {
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'flag';
  }
  return 'text';
}

/** Una celda que no se puede canonizar, con la columna culpable. */
export interface UnreadableColumn {
  readonly column: string;
  readonly value: RawValue;
}

/**
 * Los valores canónicos de una fila, columna a columna y en el orden de la pestaña — lo que se hashea
 * para saber si el contenido cambió.
 *
 * Devuelve `{ unreadable }` en vez de lanzar cuando una celda que debería ser un número no lo es: una
 * excepción aquí pararía el ciclo entero por una celda mal tecleada, y como la celda seguiría en la
 * hoja, lo pararía **para siempre**.
 */
export function canonicalCells(
  shape: TableShape,
  cells: Readonly<Cells>,
): { values: readonly string[] } | { unreadable: UnreadableColumn } {
  const values: string[] = [];

  for (const column of shape.columns) {
    const raw = cells[column];
    const canonical = canonicalValue(shape.kinds[column] ?? 'text', raw);
    if (canonical === null) {
      // `canonicalValue` solo devuelve `null` en un número ilegible. Una celda vacía no lo es: es un
      // campo ausente, y vale cadena vacía.
      if (raw === null || raw === undefined || canonicalText(raw).length === 0) {
        values.push('');
        continue;
      }
      return { unreadable: { column, value: raw } };
    }
    values.push(canonical);
  }
  return { values };
}
