import { inject, Injectable, signal, Signal } from '@angular/core';
import { ask, openDatabase } from '@core/_common/infrastructure/indexeddb/database';
import { Logger } from '@core/_common/logger/logger';
import { SyncOutbox } from '../domain/services/sync-outbox';
import { SyncItem } from '../domain/value-objects/sync-item';

const STORE = 'sync_outbox';

/**
 * Un cambio pendiente, tal como se guarda.
 *
 * `id` es la clave de deduplicación (`SyncItem.key()`), NO el orden: por eso hace falta `seq`, que
 * es lo que el índice del store ordena. Guardar el orden aparte de la clave es justo lo que permite
 * que reeditar algo no lo mande al final de la cola.
 */
interface SyncOutboxRecord {
  id: string;
  aggregate: string;
  entityId: string;
  /** Turno: número de llegada, monótono y creciente. El índice `seq` es el que da la FIFO. */
  seq: number;
  /** Cuándo se encoló (epoch ms). No ordena — está para poder mirar una cola atascada. */
  at: number;
  /** `true` mientras un envío lo tiene tomado. Un arranque lo devuelve a la cola. */
  inFlight: boolean;
}

/**
 * La cola de sincronización, persistida en IndexedDB.
 *
 * **Por qué en disco y no en memoria.** Entre que se guarda una receta y que sale su envío pasan
 * 400 ms de agrupación más lo que tarde la red. Un refresco en esa ventana se llevaba el cambio sin
 * dejar rastro. Ahora el cambio se escribe *antes* de que termine el guardado, así que lo peor que
 * puede pasar es que se envíe dos veces — y el envío es idempotente por contrato.
 *
 * **Por qué `take()` no borra.** Marcar en vuelo en lugar de vaciar es lo que cubre el caso feo: el
 * navegador se cierra con la petición en el aire. Al arrancar, todo lo que siga marcado vuelve a la
 * cola, porque un envío en vuelo que sobrevive a un reinicio es un envío que nunca terminó.
 *
 * El contador de pendientes se mantiene en memoria (un `signal`) y se recalcula tras cada operación:
 * la cola es de unos pocos elementos, así que releerla es más barato que llevar la cuenta a mano y
 * arriesgarse a que se desincronice.
 */
@Injectable()
export class IndexeddbSyncOutbox extends SyncOutbox {
  private readonly log = inject(Logger).scoped('external-sync/outbox');

  private readonly count = signal(0);

  readonly pending: Signal<number> = this.count.asReadonly();

  /** Recuperación de arranque: se ejecuta una sola vez, antes de la primera operación. */
  private recovery: Promise<void> | null = null;

  /** Último turno repartido. Lo retoma `recover()` para que la FIFO siga siéndolo entre recargas. */
  private seq = 0;

  async enqueue(item: SyncItem): Promise<void> {
    await this.ready();
    const db = await openDatabase();
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
    const existing = await ask<SyncOutboxRecord | undefined>(store.get(item.key()));

    await ask(
      store.put({
        id: item.key(),
        aggregate: item.aggregate,
        entityId: item.id,
        // Conserva el turno: quien llegó primero sale primero, aunque se reedite mientras espera.
        seq: existing?.seq ?? ++this.seq,
        at: Date.now(),
        // Reeditar algo que está en vuelo lo devuelve a la cola: el envío en curso pudo leer del
        // origen la versión anterior, así que este cambio tiene que volver a salir.
        inFlight: false,
      } satisfies SyncOutboxRecord),
    );
    await this.recount();
  }

  async take(): Promise<SyncItem[]> {
    await this.ready();
    const db = await openDatabase();
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
    // Leer por el índice `seq` es lo que hace que se envíe en el orden en que se pidió.
    const ordered = await ask<SyncOutboxRecord[]>(store.index('seq').getAll());
    const queued = ordered.filter((record) => !record.inFlight);

    for (const record of queued) {
      await ask(store.put({ ...record, inFlight: true }));
    }
    await this.recount();
    return queued.map(toItem);
  }

  async ack(items: readonly SyncItem[]): Promise<void> {
    await this.mark(items, (record, store) =>
      // Solo se retira lo que sigue en vuelo. Si se reeditó durante el envío ya volvió a la cola, y
      // borrarlo aquí tiraría un cambio que todavía no ha salido.
      record.inFlight ? ask(store.delete(record.id)) : Promise.resolve(),
    );
  }

  async requeue(items: readonly SyncItem[]): Promise<void> {
    await this.mark(items, (record, store) =>
      record.inFlight ? ask(store.put({ ...record, inFlight: false })) : Promise.resolve(),
    );
  }

  async clear(): Promise<void> {
    await this.ready();
    const db = await openDatabase();
    await ask(db.transaction(STORE, 'readwrite').objectStore(STORE).clear());
    this.count.set(0);
    this.log.debug('cola vaciada');
  }

  /** Aplica una transición a los registros de `items` que sigan existiendo, en una transacción. */
  private async mark(
    items: readonly SyncItem[],
    apply: (record: SyncOutboxRecord, store: IDBObjectStore) => Promise<unknown>,
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }
    await this.ready();
    const db = await openDatabase();
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE);

    for (const item of items) {
      const record = await ask<SyncOutboxRecord | undefined>(store.get(item.key()));
      if (record) {
        await apply(record, store);
      }
    }
    await this.recount();
  }

  private ready(): Promise<void> {
    this.recovery ??= this.recover();
    return this.recovery;
  }

  /**
   * Arranque. Lo que quedó marcado en vuelo pertenece a un envío que nunca terminó —se recargó la
   * página o se cerró el navegador a mitad—, así que vuelve a la cola. Y el contador de turnos
   * retoma donde lo dejó la sesión anterior, para que el orden sobreviva a la recarga.
   */
  private async recover(): Promise<void> {
    const db = await openDatabase();
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
    const all = await ask<SyncOutboxRecord[]>(store.getAll());

    this.seq = all.reduce((max, record) => Math.max(max, record.seq), 0);
    let rescued = 0;
    for (const record of all) {
      if (record.inFlight) {
        await ask(store.put({ ...record, inFlight: false }));
        rescued++;
      }
    }
    // Tras recuperar no queda nada en vuelo: todo lo guardado está esperando turno.
    this.count.set(all.length);
    // Lo rescatado explica un envío duplicado: salió, no se supo si llegó y se reintenta.
    this.log.debug('cola recuperada del arranque', {
      pendientes: all.length,
      rescatados: rescued,
      ultimoTurno: this.seq,
    });
  }

  private async recount(): Promise<void> {
    const db = await openDatabase();
    const store = db.transaction(STORE, 'readonly').objectStore(STORE);
    const all = await ask<SyncOutboxRecord[]>(store.getAll());
    this.count.set(all.filter((record) => !record.inFlight).length);
  }
}

function toItem(record: SyncOutboxRecord): SyncItem {
  return SyncItem.of(record.aggregate, record.entityId);
}
