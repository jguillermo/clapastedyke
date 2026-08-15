/**
 * Todo lo que un ciclo escribe en la hoja, junto, y convertido en **las menos peticiones posibles**.
 *
 * ## Por qué existe una pieza con nombre para esto
 *
 * El motor anterior escribía en cinco viajes: el bloque de cada pestaña, la migración de cabeceras, las
 * lápidas, la purga y los estampados, cada uno con su llamada. Cinco viajes es cinco veces la latencia,
 * cinco entradas en la cuota de 60 escrituras por minuto que da Google, y —lo peor— **cinco momentos
 * distintos en los que el proceso puede morir dejando la hoja a medias**.
 *
 * Aquí se acumula todo y se descarga en tres como mucho:
 *
 * 1. una `spreadsheets:batchUpdate` estructural (crear pestaña, ampliar la cuadrícula, borrar filas),
 * 2. una `values:batchUpdate` con **todos** los rangos de valores,
 * 3. una `values:batchClear` de las colas que encogieron.
 *
 * ## Los tres problemas que resuelve, y que son la razón de que no sea un array de rangos
 *
 * **Solapamientos.** Un estampado cae dentro de un bloque que también se reescribe. Mandar los dos
 * rangos en la misma petición es una carrera contra el orden en que Google los aplique: a veces gana
 * uno y a veces el otro. Aquí el estampado **se aplica sobre el bloque en memoria** y sale un solo
 * rango. Nunca se emiten dos rangos que toquen la misma celda.
 *
 * **Tamaño.** Una petición tiene tope. Un recetario grande no cabe, así que se trocea por número de
 * celdas — y **se registra al hacerlo**, porque un lote partido en silencio parece atómico y no lo es:
 * si el segundo trozo falla, el primero ya está escrito.
 *
 * **Contenido y huella juntos.** Van siempre en el mismo rango de la misma petición. Es lo único que
 * hace cierta la regla «la huella no cuadra ⇒ lo tocó una persona»: si se escribieran por separado y
 * el proceso muriera en medio, la fila quedaría con contenido nuevo y huella vieja, y el ciclo
 * siguiente la daría por editada a mano.
 */

import { columnLetter, rangeOf } from '../sheet-schema';

/** Un rango de valores tal y como lo espera `values:batchUpdate`. */
export interface ValueRange {
  readonly range: string;
  /** Las celdas **con su tipo**: un número va como número, o el destino lo guardaría como texto. */
  readonly values: readonly (readonly unknown[])[];
}

/** Lo que hay que mandar, ya troceado. Cada elemento de `values` es UNA petición. */
export interface SheetWriteRequests {
  readonly structural: readonly unknown[];
  readonly values: readonly (readonly ValueRange[])[];
  readonly clears: readonly string[];
}

/**
 * Cuántas celdas caben en una petición de valores.
 *
 * No es el tope de Google —que es de tamaño, no de celdas— sino un tope propio y holgado por debajo de
 * él: contar celdas es determinista y contar bytes obligaría a serializar dos veces. Con filas de una
 * veintena de columnas, son unas dos mil filas por petición, que es más de lo que tiene un recetario.
 */
export const MAX_CELLS_PER_REQUEST = 40_000;

/** Cuántos rangos caben en una petición. Los estampados son de una celda y podrían ser muchos. */
export const MAX_RANGES_PER_REQUEST = 200;

/** La primera fila de datos: la 1 es la cabecera. */
const FIRST_DATA_ROW = 2;

interface TabWrites {
  readonly title: string;
  readonly headers: readonly string[];
  /** El bloque de datos completo, desde la fila 2. */
  block: unknown[][] | null;
  /** Estampados sueltos, por número de fila real de la hoja. */
  readonly cells: Map<number, Record<string, string>>;
  /** Desde qué fila hay que limpiar la cola. */
  clearFrom: number | null;
}

export class SheetWriteBatch {
  private readonly tabs = new Map<string, TabWrites>();
  private readonly structural: unknown[] = [];

  /**
   * El bloque de datos entero de una pestaña, cabecera incluida.
   *
   * Se escribe entero y no fila a fila a propósito: es lo que lo hace **idempotente** —mandar dos veces
   * el mismo bloque deja la hoja igual— y lo que conserva el orden de filas que tenga el usuario, que
   * viene decidido por quien construyó `rows`.
   */
  block(title: string, headers: readonly string[], rows: readonly (readonly unknown[])[]): void {
    const tab = this.tabFor(title, headers);
    tab.block = rows.map((row) => [...row]);
  }

  /**
   * Escribir **algunas celdas** de una fila que ya existe, dejando el resto como está.
   *
   * Es lo que hace falta para corregir la hoja sin tocar lo que escribió una persona: ponerle el id a
   * una fila que se añadió a mano, o devolverle el suyo a una a la que se lo cambiaron. Reescribir la
   * fila entera no serviría —el contenido es del usuario— y reescribir el bloque la movería de sitio.
   */
  cells(
    title: string,
    headers: readonly string[],
    row: number,
    cells: Record<string, string>,
  ): void {
    const tab = this.tabFor(title, headers);
    tab.cells.set(row, { ...(tab.cells.get(row) ?? {}), ...cells });
  }

  /** Limpiar desde una fila hasta el final: la pestaña tiene ahora menos filas que antes. */
  clearFrom(title: string, headers: readonly string[], row: number): void {
    this.tabFor(title, headers).clearFrom = row;
  }

  /** Una operación estructural: crear una pestaña, ampliarla, borrar filas. */
  structuralRequest(request: unknown): void {
    this.structural.push(request);
  }

  /**
   * Borrar filas de una pestaña. Se ordenan **descendente** porque borrar una fila desplaza a todas las
   * de abajo: de arriba abajo, cada borrado dejaría mal los índices de los siguientes.
   */
  dropRows(sheetId: number, rows: readonly number[]): void {
    for (const row of [...rows].sort((a, b) => b - a)) {
      this.structural.push({
        deleteDimension: {
          range: { sheetId, dimension: 'ROWS', startIndex: row - 1, endIndex: row },
        },
      });
    }
  }

  get isEmpty(): boolean {
    return this.structural.length === 0 && this.tabs.size === 0;
  }

  /** Lo que hay que mandar, con los solapamientos resueltos y ya troceado. */
  requests(): SheetWriteRequests {
    const ranges: ValueRange[] = [];
    const clears: string[] = [];

    for (const tab of this.tabs.values()) {
      ranges.push(...this.rangesFor(tab));
      if (tab.clearFrom !== null) {
        clears.push(tailRange(tab, tab.clearFrom));
      }
    }

    return { structural: this.structural, values: chunk(ranges), clears };
  }

  private rangesFor(tab: TabWrites): ValueRange[] {
    const pending = new Map(tab.cells);
    const ranges: ValueRange[] = [];

    if (tab.block !== null) {
      const block = [[...tab.headers], ...tab.block];
      // Los estampados que caen DENTRO del bloque se aplican aquí, no se mandan aparte: dos rangos
      // sobre la misma celda en la misma petición dependerían del orden en que Google los aplique.
      for (const [row, cells] of tab.cells) {
        const offset = row - 1;
        if (offset < 0 || offset >= block.length) {
          continue;
        }
        for (const [column, value] of Object.entries(cells)) {
          const index = tab.headers.indexOf(column);
          if (index >= 0) {
            block[offset][index] = value;
          }
        }
        pending.delete(row);
      }
      ranges.push(...blockRanges(tab, block));
    }

    for (const [row, cells] of pending) {
      ranges.push(...cellRanges(tab, row, cells));
    }
    return ranges;
  }

  private tabFor(title: string, headers: readonly string[]): TabWrites {
    const existing = this.tabs.get(title);
    if (existing) {
      return existing;
    }
    const tab: TabWrites = { title, headers, block: null, cells: new Map(), clearFrom: null };
    this.tabs.set(title, tab);
    return tab;
  }
}

/**
 * El bloque, partido en rangos que quepan.
 *
 * Se parte **por filas y en orden**, así que cada trozo es un rango contiguo que se puede escribir por
 * su cuenta. Una fila nunca se parte por la mitad: media fila escrita es una fila corrupta.
 */
function blockRanges(tab: TabWrites, block: readonly (readonly unknown[])[]): ValueRange[] {
  const width = Math.max(tab.headers.length, 1);
  const rowsPerChunk = Math.max(1, Math.floor(MAX_CELLS_PER_REQUEST / width));
  const ranges: ValueRange[] = [];

  for (let start = 0; start < block.length; start += rowsPerChunk) {
    const rows = block.slice(start, start + rowsPerChunk);
    const from = start + 1;
    const to = start + rows.length;
    ranges.push({
      range: rangeOf(tab.title, `A${from}:${columnLetter(width)}${to}`),
      values: rows,
    });
  }
  return ranges;
}

/**
 * Las celdas sueltas de una fila, **cada una en su propio rango**.
 *
 * Se emiten por separado y no como un tramo continuo porque las columnas que se estampan no tienen por
 * qué ser contiguas: un rango que las abarcara todas escribiría también las de en medio, que son del
 * usuario.
 */
function cellRanges(tab: TabWrites, row: number, cells: Record<string, string>): ValueRange[] {
  const ranges: ValueRange[] = [];

  for (const [column, value] of Object.entries(cells)) {
    const index = tab.headers.indexOf(column);
    if (index < 0) {
      // Una columna que la pestaña no tiene: no hay dónde escribirla. Se calla en vez de inventar una
      // posición, que escribiría encima de la columna de al lado.
      continue;
    }
    const letter = columnLetter(index + 1);
    ranges.push({ range: rangeOf(tab.title, `${letter}${row}`), values: [[value]] });
  }
  return ranges;
}

function tailRange(tab: TabWrites, from: number): string {
  const width = Math.max(tab.headers.length, 1);
  return rangeOf(tab.title, `A${Math.max(from, FIRST_DATA_ROW)}:${columnLetter(width)}`);
}

/**
 * Los rangos repartidos en peticiones que quepan, por celdas y por número de rangos.
 *
 * El reparto conserva el orden: si hay que trocear, los trozos se mandan en serie, así que lo que iba
 * primero se escribe primero.
 */
function chunk(ranges: readonly ValueRange[]): ValueRange[][] {
  if (ranges.length === 0) {
    return [];
  }

  const chunks: ValueRange[][] = [];
  let current: ValueRange[] = [];
  let cells = 0;

  for (const range of ranges) {
    const size = range.values.reduce((total, row) => total + row.length, 0);
    const wouldOverflow =
      cells + size > MAX_CELLS_PER_REQUEST || current.length >= MAX_RANGES_PER_REQUEST;

    if (current.length > 0 && wouldOverflow) {
      chunks.push(current);
      current = [];
      cells = 0;
    }
    current.push(range);
    cells += size;
  }

  chunks.push(current);
  return chunks;
}
