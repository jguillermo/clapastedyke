import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
import { SyncGateway } from '../domain/services/sync.gateway';
import {
  CredentialRequest,
  MarkDeletedRequest,
  MigrateRequest,
  ProbeOutcome,
  ProbeRequest,
  PurgeRequest,
  SyncError,
  SyncOutcome,
  SyncRequest,
  TargetRequest,
} from '../domain/services/sync.gateway.types';
import { SyncTarget } from '../domain/value-objects/sync-target';
import { googleFetch } from './google-api';
import { schemaMigrationFor } from './schema-migration';
import { FLAG_TRUE } from './sheet-canonical';
import { mergeByKey, replaceByParent, toRow } from './sheet-merge';
import {
  ALL_TABS,
  columnLetter,
  INITIAL_ROWS,
  META_TAB,
  PROBE_KEY,
  PROBE_ROW,
  rangeOf,
  SCHEMA_VERSION,
  SHEET_TABLES,
  SPREADSHEET_NAME,
  SheetTable,
} from './sheet-schema';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

/**
 * Todo lo que se escribe va en crudo. Sin esto, Sheets interpreta las cadenas como si las tecleara
 * una persona: un insumo llamado «12/03» se convertiría en fecha y uno que empiece por `=`, en
 * **fórmula**.
 */
const RAW = 'RAW';

interface SheetProperties {
  sheetId: number;
  title: string;
  gridProperties?: { rowCount?: number };
}

interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheets?: { properties: SheetProperties }[];
}

interface ValueRange {
  range?: string;
  values?: string[][];
}

/** Lo que hace falta saber de una pestaña antes de escribirla. */
interface TabState {
  table: SheetTable;
  sheetId: number | null;
  rowCount: number;
  existing: string[][];
}

/**
 * Escribe la copia del usuario **directamente en su hoja de Google**, con las APIs de Sheets y
 * Drive y su propio token.
 *
 * Este fichero es el único del contexto que sabe que el destino es una hoja de cálculo. Cambiar de
 * destino es escribir otro `SyncGateway` y tocar una línea de `external-sync.providers.ts`.
 *
 * ## Por qué no hay nada instalado en la cuenta del usuario
 *
 * La app crea la hoja y la escribe ella misma. No hay script que desplegar, ni interruptor que
 * encender, ni secreto que custodiar: **una sola casilla de permiso** (`drive.file`) y ya. Y ese
 * permiso es el más estrecho que existe — alcanza *solo los ficheros que esta app ha creado*, así que
 * la hoja recién creada entra y el resto del Drive del usuario no.
 *
 * ## Lo que hay que saber antes de tocar esto
 *
 * **Fusionar es leer, mezclar y reescribir el bloque entero.** El resultado no depende del estado
 * previo, y eso es justo lo que hace la operación idempotente: mandar dos veces el mismo lote deja la
 * hoja igual. Con decenas o cientos de filas sobra; con miles habría que paginar.
 *
 * **Sheets no crece sola.** Escribir fuera de la cuadrícula no la amplía: falla. Por eso se mira
 * cuántas filas tiene cada pestaña antes de escribir y se amplía en la misma llamada estructural que
 * crea las pestañas que falten.
 *
 * **Todo va en `RAW`.** Ver la constante: es lo que impide que un nombre se vuelva fecha o fórmula.
 *
 * Lo único que se pierde frente a un script alojado en Google es el bloqueo entre pestañas del mismo
 * usuario escribiendo a la vez. La convergencia del upsert lo hace inofensivo: la última en escribir
 * deja la hoja consistente, no a medias.
 */
@Injectable()
export class GoogleSheetsGateway extends SyncGateway {
  private readonly log = inject(Logger).scoped('external-sync/google-sheets');

  /** Crea la hoja con todas sus pestañas, cabeceras y cabecera congelada, de una sola llamada. */
  async create({ credential }: CredentialRequest): Promise<SyncTarget> {
    this.log.debug('creando la hoja del usuario ▶');
    const created = await googleFetch<SpreadsheetMetadata>(credential, 'POST', SHEETS_API, {
      properties: { title: SPREADSHEET_NAME },
      sheets: ALL_TABS.map((tab, index) => ({
        properties: {
          title: tab.title,
          index,
          gridProperties: { rowCount: INITIAL_ROWS, frozenRowCount: 1 },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [{ values: tab.headers.map((header) => cell(header)) }],
          },
        ],
      })),
    });

    this.log.debug('hoja creada', { targetId: created.spreadsheetId });
    return SyncTarget.of(created.spreadsheetId, created.spreadsheetUrl);
  }

  /**
   * Se lo pregunta a **Drive**, no a Sheets, porque es Drive quien sabe de papeleras: una hoja en la
   * papelera sigue respondiendo a Sheets, y escribir en ella sería tirar los datos a un sitio que el
   * usuario ya dio por borrado.
   */
  async exists({ credential, target }: TargetRequest): Promise<boolean> {
    const url = `${DRIVE_API}/${encodeURIComponent(target.id)}?fields=id,trashed`;
    const file = await googleFetch<{ trashed?: boolean } | null>(
      credential,
      'GET',
      url,
      undefined,
      {
        tolerate: [404],
      },
    );
    const alive = file !== null && file.trashed !== true;
    this.log.debug('comprobado el destino en Drive', { targetId: target.id, alive });
    return alive;
  }

  async send({ credential, target, batch }: SyncRequest): Promise<SyncOutcome> {
    const payload = batch.payload() as Record<string, Record<string, unknown>[]>;
    const pending = SHEET_TABLES.filter((table) => (payload[table.name] ?? []).length > 0);

    // El límite exterior: qué sale y qué vuelve. NUNCA el contenido de las filas.
    this.log.debug('escribiendo en la hoja ▶', {
      requestId: batch.requestId,
      filas: batch.total,
      tablas: pending.map((table) => table.name),
    });

    if (pending.length === 0) {
      return { applied: {} };
    }

    const tabs = await this.readTabs(credential, target, pending);

    const writes: ValueRange[] = [];
    const clears: string[] = [];
    const applied: Record<string, number> = {};

    for (const tab of tabs) {
      const incoming = (payload[tab.table.name] ?? []).map((row) => toRow(tab.table, row));
      const merged = tab.table.parentKey
        ? replaceByParent(tab.table, tab.existing, incoming)
        : mergeByKey(tab.table, tab.existing, incoming);

      applied[tab.table.name] = incoming.length;

      const width = columnLetter(tab.table.fields.length);
      if (merged.length > 0) {
        writes.push({
          range: rangeOf(tab.table.title, `A2:${width}${merged.length + 1}`),
          values: merged,
        });
      }
      // Si la tabla se ha encogido, el sobrante de la anterior tiene que desaparecer: si no,
      // quedarían filas huérfanas que el usuario leería como datos suyos.
      if (tab.existing.length > merged.length) {
        clears.push(
          rangeOf(tab.table.title, `A${merged.length + 2}:${width}${tab.existing.length + 1}`),
        );
      }
    }

    writes.push({
      range: rangeOf(META_TAB, 'A1:B4'),
      values: [
        ['Clave', 'Valor'],
        ['schemaVersion', String(SCHEMA_VERSION)],
        ['lastSyncAt', batch.syncedAt],
        ['generadoPor', 'Clapastedyke · sincronización automática'],
      ],
    });

    await this.grow(credential, target, tabs, writes);
    await this.write(credential, target, writes);
    if (clears.length > 0) {
      await googleFetch(credential, 'POST', `${sheet(target)}/values:batchClear`, {
        ranges: clears,
      });
    }

    this.log.debug('escrito en la hoja ✔', { requestId: batch.requestId, aplicadas: applied });
    return { applied };
  }

  async probe({ credential, target, probe }: ProbeRequest): Promise<ProbeOutcome> {
    const range = rangeOf(META_TAB, `A${PROBE_ROW}:C${PROBE_ROW}`);
    this.log.debug('prueba de ida y vuelta ▶');

    await this.write(credential, target, [
      { range, values: [[PROBE_KEY, probe.value, new Date().toISOString()]] },
    ]);

    // Se relee de la hoja en lugar de devolver lo que se mandó: un eco del propio parámetro no
    // demostraría nada — pasaría igual con la hoja borrada o sin permiso de escritura.
    const read = await googleFetch<ValueRange>(
      credential,
      'GET',
      `${sheet(target)}/values/${encodeURIComponent(range)}?majorDimension=ROWS`,
    );
    const echo = read.values?.[0]?.[1] ?? '';

    this.log.debug('prueba de ida y vuelta ✔', { conEco: echo.length > 0 });
    return { echo };
  }

  /** Metadatos + contenido actual de las pestañas que se van a tocar, en dos llamadas. */
  private async readTabs(
    credential: string,
    target: SyncTarget,
    tables: readonly SheetTable[],
  ): Promise<TabState[]> {
    const metadata = await googleFetch<SpreadsheetMetadata>(
      credential,
      'GET',
      `${sheet(target)}?fields=sheets(properties(sheetId,title,gridProperties/rowCount))`,
    );
    const known = new Map(
      (metadata.sheets ?? []).map((entry) => [entry.properties.title, entry.properties]),
    );

    const present = tables.filter((table) => known.has(table.title));
    const ranges = present.map((table) =>
      rangeOf(table.title, `A2:${columnLetter(table.fields.length)}`),
    );

    const read =
      ranges.length === 0
        ? { valueRanges: [] as ValueRange[] }
        : await googleFetch<{ valueRanges?: ValueRange[] }>(
            credential,
            'GET',
            `${sheet(target)}/values:batchGet?majorDimension=ROWS&` +
              ranges.map((range) => `ranges=${encodeURIComponent(range)}`).join('&'),
          );

    const byTitle = new Map(
      present.map((table, index) => [table.title, read.valueRanges?.[index]?.values ?? []]),
    );

    return tables.map((table) => {
      const properties = known.get(table.title);
      return {
        table,
        sheetId: properties?.sheetId ?? null,
        rowCount: properties?.gridProperties?.rowCount ?? 0,
        // Una fila entera en blanco no es un dato: es el hueco que deja una tabla que se encogió.
        existing: (byTitle.get(table.title) ?? []).filter((row) =>
          row.some((value) => String(value).trim() !== ''),
        ),
      };
    });
  }

  /**
   * Una sola llamada estructural para las dos cosas que hay que hacer antes de escribir: crear las
   * pestañas que falten (alguien pudo borrarlas, o la hoja es de una versión anterior del esquema) y
   * ampliar la cuadrícula de las que se quedan cortas.
   */
  private async grow(
    credential: string,
    target: SyncTarget,
    tabs: readonly TabState[],
    writes: readonly ValueRange[],
  ): Promise<void> {
    const requests: unknown[] = [];

    for (const tab of tabs) {
      if (tab.sheetId === null) {
        requests.push({
          addSheet: {
            properties: {
              title: tab.table.title,
              gridProperties: { rowCount: INITIAL_ROWS, frozenRowCount: 1 },
            },
          },
        });
        continue;
      }
      const needed = rowsNeededFor(tab.table.title, writes);
      if (needed > tab.rowCount) {
        requests.push({
          appendDimension: {
            sheetId: tab.sheetId,
            dimension: 'ROWS',
            // Con holgura, para no repetir esta llamada en cada sincronización.
            length: needed - tab.rowCount + 200,
          },
        });
      }
    }

    if (requests.length === 0) {
      return;
    }

    this.log.debug('ajustando la hoja antes de escribir', { operaciones: requests.length });
    await googleFetch(credential, 'POST', `${sheet(target)}:batchUpdate`, { requests });

    // Una pestaña recién creada nace vacía: hay que ponerle sus cabeceras.
    const created = tabs.filter((tab) => tab.sheetId === null);
    if (created.length > 0) {
      await this.write(
        credential,
        target,
        created.map((tab) => ({
          range: rangeOf(tab.table.title, 'A1'),
          values: [[...tab.table.headers]],
        })),
      );
    }
  }

  /**
   * Pone al día las cabeceras de la hoja. Nada más: los datos no se tocan.
   *
   * Adoptar las filas de una hoja antigua **no se hace aquí** — lo decide `reconcile` por la ausencia de
   * huella, que es una señal mejor porque vale igual para una hoja de la v3 y para una fila que alguien
   * añadió a mano ayer. Ver `schema-migration.ts`.
   */
  async migrate({ credential, target, snapshot }: MigrateRequest): Promise<void> {
    const migration = schemaMigrationFor(snapshot);
    if (migration.writes.length === 0) {
      return;
    }

    this.log.debug('poniendo al día la forma de la hoja', {
      desde: migration.from,
      hasta: SCHEMA_VERSION,
      pestañas: migration.writes.length,
    });
    await this.write(
      credential,
      target,
      migration.writes.map((header) => ({ range: header.range, values: [[...header.headers]] })),
    );
  }

  /**
   * Escribe la marca de borrado y la versión **en las celdas de esas dos columnas**, sin tocar el resto
   * de la fila. Dos rangos por fila, todos en una sola petición.
   */
  async markDeleted({ credential, target, rows }: MarkDeletedRequest): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const data: ValueRange[] = [];
    for (const row of rows) {
      const table = SHEET_TABLES.find((candidate) => candidate.name === row.table);
      if (!table) {
        continue;
      }
      const version = table.fields.indexOf('version');
      const deleted = table.fields.indexOf('borrado');
      if (version < 0 || deleted < 0) {
        // Un destino que aún no tiene las columnas de servicio: `migrate()` las pone antes de llegar
        // aquí, así que esto solo pasaría con un esquema a medias. Mejor no escribir que escribir mal.
        continue;
      }
      data.push(
        { range: cellRange(table.title, version, row.index), values: [[row.version]] },
        { range: cellRange(table.title, deleted, row.index), values: [[FLAG_TRUE]] },
      );
    }

    this.log.debug('marcando filas como borradas en la hoja', { filas: rows.length });
    await this.write(credential, target, data);
  }

  /**
   * Quita filas de la hoja con `deleteDimension`, **de abajo arriba**.
   *
   * El orden es obligatorio, no una optimización: borrar una fila desplaza hacia arriba todas las de
   * debajo, así que hacerlo de arriba abajo dejaría todos los índices siguientes apuntando una fila más
   * abajo de lo que toca — y se borrarían filas ajenas.
   */
  async purge({ credential, target, rows }: PurgeRequest): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const metadata = await googleFetch<SpreadsheetMetadata>(
      credential,
      'GET',
      `${sheet(target)}?fields=sheets(properties(sheetId,title))`,
    );
    const sheetIdOf = new Map(
      (metadata.sheets ?? []).map((entry) => [entry.properties.title, entry.properties.sheetId]),
    );

    const requests = [...rows]
      .sort((a, b) => b.index - a.index)
      .flatMap((row) => {
        const title = SHEET_TABLES.find((candidate) => candidate.name === row.table)?.title;
        const sheetId = title === undefined ? undefined : sheetIdOf.get(title);
        if (sheetId === undefined) {
          return [];
        }
        return [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                // La API cuenta desde 0 y las filas de la hoja desde 1.
                startIndex: row.index - 1,
                endIndex: row.index,
              },
            },
          },
        ];
      });

    if (requests.length === 0) {
      return;
    }
    this.log.debug('tirando lápidas viejas de la hoja', { filas: requests.length });
    await googleFetch(credential, 'POST', `${sheet(target)}:batchUpdate`, { requests });
  }

  private write(
    credential: string,
    target: SyncTarget,
    data: readonly ValueRange[],
  ): Promise<void> {
    if (data.length === 0) {
      return Promise.resolve();
    }
    return googleFetch(credential, 'POST', `${sheet(target)}/values:batchUpdate`, {
      valueInputOption: RAW,
      data,
    }).then(() => undefined);
  }
}

/** `'Insumos'!J7` — una celda sola, por su columna (desde 0) y su fila (desde 1). */
function cellRange(title: string, column: number, row: number): string {
  return rangeOf(title, `${columnLetter(column + 1)}${row}`);
}

function sheet(target: SyncTarget): string {
  return `${SHEETS_API}/${encodeURIComponent(target.id)}`;
}

function cell(value: string): { userEnteredValue: { stringValue: string } } {
  return { userEnteredValue: { stringValue: value } };
}

/** La última fila que va a ocupar una pestaña, según lo que se va a escribir en ella. */
function rowsNeededFor(title: string, writes: readonly ValueRange[]): number {
  const prefix = rangeOf(title, '');
  return writes
    .filter((write) => (write.range ?? '').startsWith(prefix))
    .reduce((max, write) => Math.max(max, (write.values?.length ?? 0) + 1), 0);
}

/** Se re-exporta para que el resto del contexto no importe el transporte por su cuenta. */
export { SyncError };
