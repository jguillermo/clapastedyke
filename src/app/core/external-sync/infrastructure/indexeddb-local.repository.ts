import { inject, Injectable } from '@angular/core';
import { StoreName } from '@core/_common/infrastructure/indexeddb/database';
import { IndexedDbStore } from '@core/_common/infrastructure/indexeddb/store';
import { Logger } from '@core/_common/logger/logger';
import { LocalRepository, TableRow } from '../domain/repositories/local.repository';

/**
 * Las tablas de aquí son **object stores de IndexedDB**, leídos y escritos en crudo.
 *
 * ## Por qué en crudo, y no por los repositorios de cada contexto
 *
 * Porque copiar no es guardar. Un repositorio de dominio construye agregados, valida invariantes y
 * rechaza lo que no encaja — que es exactamente lo que hay que hacer cuando alguien usa la app, y
 * exactamente lo que **no** hay que hacer cuando se está trayendo una copia de otro sitio: una fila
 * que el modelo de hoy rechazaría (porque la escribió una versión anterior o la tecleó una persona en
 * la hoja) tiene que llegar igual y quedarse ahí hasta que alguien la arregle. Descartarla la perdería
 * en los dos sitios, porque el ciclo siguiente la daría por inexistente aquí.
 *
 * Los repositorios de cada contexto ya toleran documentos que no entienden —los filtran al leer—, así
 * que un documento de más nunca rompe nada; un documento de menos sí.
 *
 * ## El nombre de la tabla es el del store, y eso se comprueba en compilación
 *
 * `StoreName` es la unión de literales que declara `_common/infrastructure/indexeddb/database.ts`, o
 * sea el shared kernel: una errata en la lista de tablas a replicar no compila. El nombre llega aquí
 * como `string` porque el puerto es agnóstico, así que se valida en el borde.
 */
@Injectable()
export class IndexedDbLocalRepository extends LocalRepository {
  private readonly log = inject(Logger).scoped('external-sync/local-repo');
  private readonly stores = new Map<string, IndexedDbStore<TableRow>>();

  async all(table: string): Promise<TableRow[]> {
    const rows = await this.store(table).all();
    this.log.debug('tabla leída', { table, count: rows.length });
    return rows;
  }

  async putAll(table: string, rows: readonly TableRow[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    await this.store(table).putAll(rows);
    this.log.debug('tabla escrita en bloque', { table, count: rows.length });
  }

  /**
   * El store de una tabla, memoizado.
   *
   * `IndexedDbStore` no guarda estado —cada operación abre su propia transacción—, así que memoizarlo
   * es solo por no construir el mismo objeto en cada ciclo.
   */
  private store(table: string): IndexedDbStore<TableRow> {
    const existing = this.stores.get(table);
    if (existing) {
      return existing;
    }
    const store = new IndexedDbStore<TableRow>(table as StoreName);
    this.stores.set(table, store);
    return store;
  }
}
