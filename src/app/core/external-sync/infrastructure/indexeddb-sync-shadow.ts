import { inject, Injectable } from '@angular/core';
import { openDatabase, ask } from '@core/_common/infrastructure/indexeddb/database';
import { Logger } from '@core/_common/logger/logger';
import { ShadowRow, SyncShadow } from '../domain/services/sync-shadow';

const STORE = 'sync_shadow';

/**
 * Documento plano. La clave es `tabla:id`, que es lo que hace la identidad única entre tablas: dos
 * tablas pueden usar el mismo id sin pisarse (y de hecho lo hacen, porque los ids vienen del contexto
 * de origen, no de aquí).
 */
interface ShadowRecord {
  id: string;
  table?: string;
  rowId?: string;
  fingerprint?: string;
  version?: string;
  deleted?: boolean;
  rejected?: string;
  values?: Record<string, unknown>;
}

function keyOf(table: string, rowId: string): string {
  return `${table}:${rowId}`;
}

/**
 * La base de la fusión, en IndexedDB.
 *
 * ## Por qué no usa `IndexedDbStore`
 *
 * Porque `clear()` no está en su superficie (solo `get`/`all`/`put`/`delete`), y vaciar la base al
 * cambiar de cuenta borrando de una en una sería una transacción por fila. Lo demás es idéntico, así que
 * se va a `openDatabase()` + `ask()` igual que hace la cola, que necesitó lo mismo.
 *
 * ## Legado: un registro incompleto se ignora
 *
 * Un documento sin `rowId` o sin `fingerprint` es de una versión anterior de este store y **no se
 * arregla, se ignora**: la consecuencia de olvidar una fila de la base es que su comparación siguiente
 * la tome por nueva, que es prudente. Inventar una huella la haría pasar por «no ha cambiado» y se
 * perdería un cambio de verdad.
 */
@Injectable()
export class IndexedDbSyncShadow extends SyncShadow {
  private readonly log = inject(Logger).scoped('external-sync/shadow');

  async all(): Promise<ShadowRow[]> {
    const records = await ask<ShadowRecord[]>((await this.store('readonly')).getAll());
    const rows = records.filter(isComplete).map(toRow);

    this.log.debug('base leída', { filas: rows.length, ignorados: records.length - rows.length });
    return rows;
  }

  async put(row: ShadowRow): Promise<void> {
    await ask((await this.store('readwrite')).put(toRecord(row)));
  }

  async putAll(rows: readonly ShadowRow[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    const store = await this.store('readwrite');
    // Todas las peticiones sobre la MISMA transacción, esperadas juntas: un `await` por fila la
    // dejaría morir entre una y otra (IndexedDB la cierra en cuanto se queda sin peticiones vivas).
    await Promise.all(rows.map((row) => ask(store.put(toRecord(row)))));
    this.log.debug('base actualizada en bloque', { filas: rows.length });
  }

  async remove(table: string, rowId: string): Promise<void> {
    await ask((await this.store('readwrite')).delete(keyOf(table, rowId)));
  }

  async clear(): Promise<void> {
    await ask((await this.store('readwrite')).clear());
    this.log.debug('base vaciada');
  }

  private async store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await openDatabase();
    return db.transaction(STORE, mode).objectStore(STORE);
  }
}

/** Sin id de fila o sin huella no sirve de base: no se puede comparar contra nada. */
function isComplete(record: ShadowRecord): boolean {
  return (
    typeof record.table === 'string' &&
    record.table.length > 0 &&
    typeof record.rowId === 'string' &&
    record.rowId.length > 0 &&
    typeof record.fingerprint === 'string'
  );
}

function toRow(record: ShadowRecord): ShadowRow {
  return {
    table: record.table ?? '',
    rowId: record.rowId ?? '',
    fingerprint: record.fingerprint ?? '',
    version: record.version ?? '',
    deleted: record.deleted === true,
    ...(record.rejected === undefined ? {} : { rejected: record.rejected }),
    ...(record.values === undefined ? {} : { values: record.values }),
  };
}

function toRecord(row: ShadowRow): ShadowRecord {
  return {
    id: keyOf(row.table, row.rowId),
    table: row.table,
    rowId: row.rowId,
    fingerprint: row.fingerprint,
    version: row.version,
    deleted: row.deleted,
    ...(row.rejected === undefined ? {} : { rejected: row.rejected }),
    ...(row.values === undefined ? {} : { values: row.values }),
  };
}
