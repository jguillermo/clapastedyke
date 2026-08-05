import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
import { SyncReader } from '../domain/services/sync-reader';
import { RemoteCellRow, RemoteSnapshot, RemoteTable } from '../domain/services/sync-reader.types';
import { TargetRequest } from '../domain/services/sync.gateway.types';
import { SyncTarget } from '../domain/value-objects/sync-target';
import { googleFetch } from './google-api';
import { columnLetter, META_TAB, rangeOf, SHEET_TABLES } from './sheet-schema';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Sin formatear, siempre.
 *
 * Con el valor formateado, Sheets aplica el formato de la celda **y la configuración regional de la
 * hoja**: un precio volvería como `2,50` en una hoja en español y como `2.50` en una en inglés, así que
 * la huella de una fila dependería del idioma del usuario y todo parecería editado a mano. Con este
 * modo, un número vuelve como número y un texto como texto.
 */
const UNFORMATTED = 'UNFORMATTED_VALUE';

/**
 * Las fechas, como texto.
 *
 * Sin esto vuelven como número de serie de Sheets (los días desde 1899), y una fecha que la app escribió
 * como ISO volvería convertida en `45874`. No hay ninguna columna de fecha autoritativa hoy, pero
 * `syncedAt` sí es fecha, y el día que una lo sea el fallo no se vería venir.
 */
const FORMATTED_DATES = 'FORMATTED_STRING';

interface ValueRange {
  range?: string;
  values?: unknown[][];
}

/** La primera fila de datos: la 1 es la cabecera. */
const FIRST_DATA_ROW = 2;

function sheet(target: SyncTarget): string {
  return `${SHEETS_API}/${encodeURIComponent(target.id)}`;
}

/**
 * Lee la hoja del usuario entera: el contenido de cada pestaña, **su cabecera** y la versión de
 * esquema con la que se escribió.
 *
 * ## Todo en una sola llamada
 *
 * Un `values:batchGet` admite tantos rangos como se le pidan, así que las seis pestañas, sus seis
 * cabeceras y la pestaña de servicio caben en **una** petición. Importa por la cuota: son 60 peticiones
 * por minuto y por usuario, y el ciclo se dispara también al recuperar el foco.
 *
 * ## Por qué se piden las cabeceras
 *
 * Porque son la prueba de que las columnas están donde el código cree. Si alguien inserta una columna a
 * mano, todo lo que venga detrás está corrido un sitio, y sin comprobarlo se leería el precio en la
 * columna de la moneda. Cuesta un rango más, que es gratis.
 *
 * ## Lo que este adaptador NO hace
 *
 * **No descarta filas en blanco.** El escritor de antes sí lo hacía —una fila vacía es el hueco de una
 * tabla que se encogió— pero eso destruye la correspondencia entre fila y posición, y sin ella no se
 * puede volver a escribir una fila concreta. Aquí las filas llegan con su índice real y quien
 * reconcilia decide qué hacer con las vacías.
 *
 * **No interpreta nada.** Ni recorta, ni convierte, ni valida. Una celda ilegible es un dato del
 * diagnóstico y tiene que llegar entera.
 */
@Injectable()
export class GoogleSheetsReader extends SyncReader {
  private readonly log = inject(Logger).scoped('external-sync/sheets-reader');

  async read({ credential, target }: TargetRequest): Promise<RemoteSnapshot> {
    // Metadatos primero: sin saber qué pestañas existen no se puede distinguir «no está» de «está
    // vacía», y confundirlos borraría la tabla entera en todos los dispositivos.
    const metadata = await googleFetch<{ sheets?: { properties: { title: string } }[] }>(
      credential,
      'GET',
      `${sheet(target)}?fields=sheets(properties(title))`,
    );
    const titles = new Set((metadata.sheets ?? []).map((entry) => entry.properties.title));

    const present = SHEET_TABLES.filter((table) => titles.has(table.title));
    const ranges = [
      ...present.map((table) => rangeOf(table.title, `A1:${columnLetter(table.fields.length)}1`)),
      ...present.map((table) => rangeOf(table.title, `A2:${columnLetter(table.fields.length)}`)),
      ...(titles.has(META_TAB) ? [rangeOf(META_TAB, 'A1:B10')] : []),
    ];

    const read = await this.fetchRanges(credential, target, ranges);

    const headersOf = new Map(
      present.map((table, index) => [table.name, cellsOf(read[index]?.values?.[0])]),
    );
    const rowsOf = new Map(
      present.map((table, index) => [table.name, rowsFrom(read[present.length + index]?.values)]),
    );
    const meta = titles.has(META_TAB) ? read[present.length * 2] : undefined;

    const tables: RemoteTable[] = SHEET_TABLES.map((table) => ({
      name: table.name,
      present: titles.has(table.title),
      headers: headersOf.get(table.name) ?? [],
      rows: rowsOf.get(table.name) ?? [],
    }));

    const schemaVersion = schemaVersionOf(meta?.values);
    this.log.debug('destino leído', {
      schemaVersion,
      tablas: Object.fromEntries(
        tables.map((table) => [table.name, table.present ? table.rows.length : 'ausente']),
      ),
    });
    return { tables, schemaVersion };
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
}

/**
 * Las filas con su índice real.
 *
 * Sheets **recorta por la derecha y por abajo**: una fila cuyas últimas celdas están vacías vuelve
 * corta, y las filas finales vacías no vuelven. Lo primero lo absorbe quien lee campo a campo (una
 * celda que no está es una celda vacía); lo segundo no importa, porque una fila que no existe no
 * puede haber cambiado. Lo que **sí** se conserva son los huecos de en medio, que vuelven como
 * `[]` y mantienen alineados los índices de todo lo que hay debajo.
 */
function rowsFrom(values: unknown[][] | undefined): RemoteCellRow[] {
  return (values ?? []).map((cells, offset) => ({
    index: FIRST_DATA_ROW + offset,
    cells: cells ?? [],
  }));
}

function cellsOf(row: unknown[] | undefined): string[] {
  return (row ?? []).map((cell) => (cell === null || cell === undefined ? '' : String(cell)));
}

/**
 * La versión de esquema apuntada en la pestaña de servicio, que es una lista de `clave | valor`.
 *
 * `null` si no está o no es un número: es el caso de una hoja escrita antes de que se apuntara, y lo
 * que toca entonces es adoptar lo que haya, no fallar.
 */
function schemaVersionOf(values: unknown[][] | undefined): number | null {
  for (const row of values ?? []) {
    if (String(row?.[0] ?? '').trim() === 'schemaVersion') {
      const version = Number(String(row?.[1] ?? '').trim());
      return Number.isFinite(version) ? version : null;
    }
  }
  return null;
}
