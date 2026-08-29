import { Injectable } from '@angular/core';

const DB_NAME = 'clapastedyke_events';
const DB_VERSION = 1;
const STORE = 'events';

/** Índice por orden de llegada: es lo que hace que la cola se lea en FIFO. */
const BY_SEQ = 'seq';

/**
 * Un evento guardado, esperando a que le llegue a todo el mundo.
 *
 * `id` lleva el nombre y el turno (`RecipeSaved#000000000042`) para que una cola abierta se lea de
 * un vistazo y dos eventos del mismo nombre no se pisen. El orden real lo da `seq`.
 */
export interface QueuedEvent {
  id: string;
  name: string;
  aggregateId: string;
  /** Cuándo ocurrió (epoch ms), para poder entregarlo con su hora original. */
  at: number;
  data: Record<string, unknown>;
  /** Turno de llegada, creciente. */
  seq: number;
  /** Suscriptores que YA lo recibieron: lo que evita entregárselo dos veces a nadie. */
  delivered: string[];
  /** Entregas fallidas acumuladas. */
  attempts: number;
}

/**
 * La base de datos del bus.
 *
 * Es **suya, propia y aparte** de la base de datos de la aplicación. Así este paquete no depende de
 * nada del resto del proyecto —ni de su versionado, ni de sus stores— y se puede llevar tal cual a
 * otro sitio. Un cambio en los agregados de la app no obliga a subir la versión de la cola, ni al
 * revés.
 *
 * Solo abre y da acceso al store. No sabe qué es un evento ni qué se hace con él.
 */
@Injectable()
export class EventDatabase {
  private connection: Promise<IDBDatabase> | null = null;

  /** El store de eventos, listo para operar. */
  async store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.open();
    return db.transaction(STORE, mode).objectStore(STORE);
  }

  /** El store recorrido en orden de llegada. */
  async byArrival(mode: IDBTransactionMode): Promise<IDBIndex> {
    return (await this.store(mode)).index(BY_SEQ);
  }

  /**
   * Tira la cola entera: lo pendiente de entregar deja de existir.
   *
   * Solo tiene un uso legítimo —cerrar sesión, que borra todo lo de este navegador— y por eso no se
   * ofrece nada más fino. Un evento a medio repartir de la sesión anterior es justo lo que no puede
   * sobrevivir: hablaría de datos que ya no están.
   */
  async clear(): Promise<void> {
    await ask((await this.store('readwrite')).clear());
  }

  private open(): Promise<IDBDatabase> {
    this.connection ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' }).createIndex(BY_SEQ, BY_SEQ);
        }
      };
      request.onsuccess = () => resolve(request.result);
      // El `DOMException` va como `cause`: aquí se traduce y se relanza, no se registra. Quien
      // decide el resultado visible lo registra una vez, con la cadena entera.
      request.onerror = () =>
        reject(
          new Error(`No se pudo abrir la cola de eventos "${DB_NAME}" v${DB_VERSION}`, {
            cause: request.error,
          }),
        );
    });
    return this.connection;
  }
}

/** Promisifica una petición de IndexedDB. */
export function ask<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error('Falló una operación sobre la cola de eventos', { cause: request.error }));
  });
}
