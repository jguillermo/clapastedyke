import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
import {
  ReadRequest,
  RemoteRepository,
  RemoteRow,
  RemoteSnapshot,
  RemoteTable,
  UnreadableRemoteRow,
  WriteOutcome,
  WriteRequest,
} from '../../domain/repositories/remote.repository';
import { SyncTarget } from '../../domain/value-objects/sync-target';
import { googleFetch } from '../google-api';
import { canonicalText, isTombstone } from '../sheet-canonical';
import {
  columnLetter,
  DATA_COLUMN,
  ID_COLUMN,
  META_TAB,
  rangeOf,
  SCHEMA_VERSION,
  SHEET_HEADERS,
} from '../sheet-schema';
import { parsePayload } from './record-json';
import { SheetWriteBatch } from './sheet-write-batch';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Sin formatear, siempre.
 *
 * Con el valor formateado, Sheets aplica el formato de la celda **y la configuración regional de la
 * hoja**: un precio volvería como `2,50` en una hoja en español y como `2.50` en una en inglés, así
 * que la huella de una fila dependería del idioma del usuario y todo parecería editado a mano.
 */
const UNFORMATTED = 'UNFORMATTED_VALUE';

/**
 * Las fechas, como texto. Sin esto vuelven como número de serie de Sheets (los días desde 1899), y un
 * `updatedAt` que la app escribió en ISO volvería convertido en `45874`.
 */
const FORMATTED_DATES = 'FORMATTED_STRING';

/** La primera fila de datos: la 1 es la cabecera. */
const FIRST_DATA_ROW = 2;

/**
 * Cuántas filas se le piden a una pestaña al crearla. Sheets no crece sola cuando se escribe fuera de
 * la cuadrícula: o cabe, o la petición falla.
 */
const INITIAL_ROWS = 2000;

/** Holgura al ampliar, para no repetir la llamada en cada ciclo. */
const GROWTH_SLACK = 200;

interface ValueRange {
  range?: string;
  values?: unknown[][];
}

interface TabProperties {
  readonly title: string;
  readonly sheetId: number;
  readonly rowCount: number;
}

/**
 * El destino es una hoja de cálculo de Google, y **una pestaña por tabla**.
 *
 * ## Qué sabe y qué no
 *
 * Sabe de rangos, cabeceras, posiciones de fila y cuota. No sabe qué es un insumo, ni qué gana un
 * conflicto, ni cuándo hay que sincronizar. Recibe filas con id y metadatos y las escribe; devuelve
 * filas con id y metadatos y no las juzga.
 *
 * ## Leer: dos peticiones, siempre
 *
 * Una para saber **qué pestañas existen** —sin eso, «no está» y «está vacía» se confunden, y
 * confundirlos borraría la tabla entera en todos los dispositivos— y una `values:batchGet` con todas
 * las pestañas de una vez. Importa por la cuota: son 60 peticiones por minuto y por usuario, y el
 * ciclo se dispara también al recuperar el foco.
 *
 * ## Escribir: tres como mucho, y todas juntas
 *
 * Todo lo que un ciclo escribe pasa por un único {@link SheetWriteBatch}, que resuelve solapamientos y
 * trocea lo que no quepa. Ver su fichero para el porqué.
 */
@Injectable()
export class GoogleSheetsRemoteRepository extends RemoteRepository {
  private readonly log = inject(Logger).scoped('external-sync/sheets-repo');

  async read({ credential, target, tables }: ReadRequest): Promise<RemoteSnapshot> {
    const tabs = await this.properties(credential, target);
    const titles = new Set(tabs.map((tab) => tab.title));

    const present = tables.filter((table) => titles.has(table));
    // Desde la fila 1 —la cabecera— hasta la última columna de un esquema que ahora es **fijo**: seis
    // columnas, siempre las mismas. Antes había que pedir un ancho holgado porque las columnas se
    // deducían de los datos; ya no hay nada que deducir.
    //
    // La pestaña de servicio **no se lee**: la versión del esquema se escribe para que quede dicha en
    // la hoja, pero hoy no hay ninguna decisión que dependa de ella. Leerla sería un rango más en cada
    // ciclo a cambio de un dato que nadie mira.
    const last = columnLetter(SHEET_HEADERS.length);
    const read = await this.fetchRanges(
      credential,
      target,
      present.map((table) => rangeOf(table, `A1:${last}`)),
    );

    const readByTable = new Map(present.map((table, index) => [table, read[index]?.values ?? []]));
    const remoteTables: RemoteTable[] = tables.map((table) =>
      titles.has(table)
        ? tableFrom(table, readByTable.get(table) ?? [])
        : { table, present: false, header: [], rows: [], unreadable: [], raw: [] },
    );

    this.log.debug('destino leído', {
      tablas: Object.fromEntries(
        remoteTables.map((table) => [table.table, table.present ? table.rows.length : 'ausente']),
      ),
    });
    return { tables: remoteTables };
  }

  async write({ credential, target, writes }: WriteRequest): Promise<WriteOutcome> {
    const batch = new SheetWriteBatch();
    const applied: Record<string, number> = {};
    const tabs = await this.properties(credential, target);
    const byTitle = new Map(tabs.map((tab) => [tab.title, tab]));

    for (const write of writes) {
      if (write.kind === 'upsert') {
        batch.block(write.table, write.columns, write.rows);
        applied[write.table] = write.rows.length;
        this.grow(batch, byTitle.get(write.table), write.table, write.rows.length);
        // El bloque solo pisa las filas que ocupa. Si ahora hay menos que antes, lo que sobra abajo se
        // quedaría escrito y volvería en la lectura siguiente como ids repetidos, que acaban en
        // cuarentena. `+2` porque la fila 1 es la cabecera y los datos empiezan en la 2.
        if (write.rows.length < write.previousRows) {
          batch.clearFrom(write.table, write.columns, write.rows.length + 2);
        }
        continue;
      }
      if (write.kind === 'stamp') {
        batch.cells(write.table, write.columns, write.index, write.cells);
        continue;
      }
      const tab = byTitle.get(write.table);
      if (tab) {
        batch.dropRows(tab.sheetId, write.indexes);
      }
    }

    batch.block(
      META_TAB,
      ['Clave', 'Valor'],
      [
        ['schemaVersion', String(SCHEMA_VERSION)],
        ['lastSyncAt', new Date().toISOString()],
        ['generadoPor', 'Clapastedyke · sincronización automática'],
      ],
    );
    this.grow(batch, byTitle.get(META_TAB), META_TAB, 3);

    const requests = batch.requests();
    await this.send(credential, target, requests);

    const count = requests.values.length;
    if (count > 1) {
      // Un lote partido NO es atómico: si el segundo trozo falla, el primero ya está escrito. Se deja
      // dicho, porque desde fuera parece una sola escritura.
      this.log.warn('el lote no cupo en una petición y se partió', undefined, {
        peticiones: count,
      });
    }
    this.log.debug('destino escrito ✔', { peticiones: count, aplicadas: applied });
    return { applied, requests: count };
  }

  /** Título, identificador y tamaño de cada pestaña. Hace falta para leer y para escribir. */
  private async properties(credential: string, target: SyncTarget): Promise<TabProperties[]> {
    const metadata = await googleFetch<{
      sheets?: {
        properties: { title: string; sheetId: number; gridProperties?: { rowCount?: number } };
      }[];
    }>(
      credential,
      'GET',
      `${sheet(target)}?fields=sheets(properties(title,sheetId,gridProperties/rowCount))`,
    );

    return (metadata.sheets ?? []).map(({ properties }) => ({
      title: properties.title,
      sheetId: properties.sheetId,
      rowCount: properties.gridProperties?.rowCount ?? 0,
    }));
  }

  /** Un `batchGet` con todos los rangos. Sin rangos no se llama: una hoja recién creada no tiene nada. */
  private async fetchRanges(
    credential: string,
    target: SyncTarget,
    ranges: readonly string[],
  ): Promise<ValueRange[]> {
    if (ranges.length === 0) {
      return [];
    }
    const query = [
      'majorDimension=ROWS',
      `valueRenderOption=${UNFORMATTED}`,
      `dateTimeRenderOption=${FORMATTED_DATES}`,
      ...ranges.map((range) => `ranges=${encodeURIComponent(range)}`),
    ].join('&');

    const read = await googleFetch<{ valueRanges?: ValueRange[] }>(
      credential,
      'GET',
      `${sheet(target)}/values:batchGet?${query}`,
    );
    return read.valueRanges ?? [];
  }

  /**
   * Crea la pestaña si no está y la amplía si lo que se va a escribir no cabe.
   *
   * Sheets **no crece sola**: escribir fuera de la cuadrícula no amplía nada, falla la petición
   * entera. Y como esto va en la parte estructural del lote, se ejecuta antes que los valores.
   */
  private grow(
    batch: SheetWriteBatch,
    tab: TabProperties | undefined,
    title: string,
    rows: number,
  ): void {
    const needed = rows + 1;
    if (!tab) {
      batch.structuralRequest({
        addSheet: {
          properties: {
            title,
            gridProperties: { rowCount: Math.max(INITIAL_ROWS, needed), frozenRowCount: 1 },
          },
        },
      });
      return;
    }
    if (needed > tab.rowCount) {
      batch.structuralRequest({
        appendDimension: {
          sheetId: tab.sheetId,
          dimension: 'ROWS',
          length: needed - tab.rowCount + GROWTH_SLACK,
        },
      });
    }
  }

  private async send(
    credential: string,
    target: SyncTarget,
    requests: ReturnType<SheetWriteBatch['requests']>,
  ): Promise<void> {
    if (requests.structural.length > 0) {
      await googleFetch(credential, 'POST', `${sheet(target)}:batchUpdate`, {
        requests: requests.structural,
      });
    }
    for (const data of requests.values) {
      await googleFetch(credential, 'POST', `${sheet(target)}/values:batchUpdate`, {
        valueInputOption: 'RAW',
        data,
      });
    }
    if (requests.clears.length > 0) {
      await googleFetch(credential, 'POST', `${sheet(target)}/values:batchClear`, {
        ranges: requests.clears,
      });
    }
  }
}

function sheet(target: SyncTarget): string {
  return `${SHEETS_API}/${encodeURIComponent(target.id)}`;
}

/**
 * Una pestaña leída: su cabecera, sus filas con la posición real, y las que no se pudieron leer.
 *
 * Sheets **recorta por la derecha y por abajo**: una fila cuyas últimas celdas están vacías vuelve
 * corta, y las filas finales vacías no vuelven. Lo primero lo absorbe leer por nombre de columna (una
 * celda que no está es una celda vacía); lo segundo no importa, porque una fila que no existe no puede
 * haber cambiado. Los huecos **de en medio** sí se conservan, y con ellos la posición de todo lo que
 * hay debajo.
 *
 * El `id` sale de **su columna**, no del JSON: es lo que ve una persona, lo que empareja las filas y
 * lo que el adaptador sabe corregir cuando alguien lo cambia a mano.
 */
function tableFrom(table: string, values: readonly unknown[][]): RemoteTable {
  const header = (values[0] ?? []).map((cell) => canonicalText(cell));
  const rows: RemoteRow[] = [];
  const unreadable: UnreadableRemoteRow[] = [];
  const data = values.slice(1);

  data.forEach((cells, offset) => {
    const index = FIRST_DATA_ROW + offset;
    const named = cellsOf(header, cells);
    if (isBlank(named)) {
      return;
    }

    const payload = parsePayload(named[DATA_COLUMN]);
    if (payload === null) {
      // Una celda que alguien estropeó: la fila no entra en la decisión y **no se sobrescribe nunca**,
      // porque escribirle nuestro valor encima borraría su intento de corrección.
      unreadable.push({ index, id: idOf(named), column: DATA_COLUMN });
      return;
    }

    rows.push({
      index,
      values: { ...payload, [ID_COLUMN]: idOf(named) ?? payload[ID_COLUMN] },
      meta: metaOf(named),
    });
  });

  return {
    table,
    present: true,
    header,
    rows,
    unreadable,
    /*
     * TODAS las filas, **incluidas las que están en blanco**.
     *
     * Una fila vacía en medio es un hueco que dejó alguien, y quitarla al reescribir compactaría la
     * tabla: todo lo que hubiera debajo subiría un sitio y las posiciones que este mismo ciclo acaba
     * de resolver —dónde estampar el id de una fila tecleada a mano, dónde devolver un id cambiado—
     * apuntarían a la fila del vecino.
     *
     * Interpretarlas sí se salta (`rows`): una fila en blanco no es un dato. Conservarlas aquí es solo
     * no moverle a nadie lo que puso donde lo puso.
     */
    raw: data
      .map((cells) => cellsOf(header, cells))
      .map((named) => ({ id: idOf(named) ?? '', cells: named })),
  };
}

/** Las celdas de una fila, por nombre de columna y **como texto**: en esta hoja todo lo es. */
function cellsOf(header: readonly string[], cells: readonly unknown[]): Record<string, string> {
  const row: Record<string, string> = {};
  header.forEach((column, index) => {
    if (column.length > 0) {
      row[column] = canonicalText(cells[index]);
    }
  });
  return row;
}

/**
 * Una fila **completamente** en blanco es el hueco de una tabla que encogió, no un dato. Se salta, y
 * la posición de las de abajo no se toca: quien escriba una fila concreta sigue acertando.
 */
function isBlank(row: Readonly<Record<string, string>>): boolean {
  return Object.values(row).every((value) => value.length === 0);
}

function idOf(row: Readonly<Record<string, string>>): string | null {
  const id = row[ID_COLUMN] ?? '';
  return id.length > 0 ? id : null;
}

/**
 * Los metadatos de servicio de una fila.
 *
 * La lápida se lee **estricta** (ver `isTombstone`): una celda con algo que no se entiende como un sí
 * ni como un no se trata como **viva**. Al revés —dar por borrado lo que no se entiende— una celda
 * descolocada bastaría para vaciar el catálogo en todos los dispositivos.
 */
function metaOf(row: Readonly<Record<string, string>>): RemoteRow['meta'] {
  return {
    version: row['version'] ?? '',
    origin: row['origen'] ?? '',
    fingerprint: row['huella'] ?? '',
    deleted: isTombstone(row['borrado']),
  };
}
