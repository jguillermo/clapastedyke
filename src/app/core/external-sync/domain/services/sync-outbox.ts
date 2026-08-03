import { Signal } from '@angular/core';
import { SyncItem } from '../value-objects/sync-item';

/**
 * Cola de cambios pendientes de sincronizar.
 *
 * Es **durable**: vive en la base de datos local, así que un refresco, un cierre del navegador o un
 * cuelgue a mitad de un envío no se llevan por delante lo que estaba esperando su turno. Antes vivía
 * en memoria, confiando en que la sincronización completa al conectar la cuenta recogiera los
 * restos — pero eso solo salta al conectar: recargar con la sesión ya abierta perdía los cambios.
 *
 * Es una **cola de trabajo, no un agregado**: FIFO estricta (se envía en el orden en que se pidió) y
 * deduplicada por `SyncItem.key()` — editar tres veces la misma receta deja un solo cambio
 * pendiente, y conserva la posición de la PRIMERA edición.
 *
 * El ciclo de vida de un cambio es tomar → confirmar, nunca «sacar y olvidar»:
 *
 * ```
 *  enqueue()  ──►  en cola  ──take()──►  en vuelo  ──ack()──►  fuera
 *                     ▲                     │
 *                     └──────requeue()──────┘
 *                     └──── (un arranque devuelve a la cola lo que quedó en vuelo)
 * ```
 *
 * **`take()` no borra, marca.** Si el proceso muere mientras el envío está en vuelo, el cambio sigue
 * ahí y el siguiente arranque lo devuelve a la cola. Borrar al tomar reabriría justo el agujero que
 * esta cola existe para tapar.
 */
export abstract class SyncOutbox {
  /**
   * Cuántos cambios esperan turno, sin contar los que están en vuelo. La UI lo muestra; también
   * sirve para no enviar en balde.
   */
  abstract readonly pending: Signal<number>;

  /** Encola un cambio. Si ya estaba, conserva su turno original en lugar de irse al final. */
  abstract enqueue(item: SyncItem): Promise<void>;

  /**
   * Toma los cambios en cola para enviarlos, en orden de llegada. Quedan **en vuelo**: siguen
   * guardados, así que un corte a mitad no los pierde.
   */
  abstract take(): Promise<SyncItem[]>;

  /**
   * Confirma que se enviaron: ahora sí desaparecen.
   *
   * Solo retira lo que siga en vuelo. Un cambio que se reeditó mientras se enviaba ya volvió a la
   * cola por su cuenta, y ese cambio nuevo tiene que salir en el siguiente envío.
   */
  abstract ack(items: readonly SyncItem[]): Promise<void>;

  /** Devuelve a la cola lo que no se pudo enviar, conservando su posición original. */
  abstract requeue(items: readonly SyncItem[]): Promise<void>;

  /**
   * Tira todo, en cola y en vuelo. Se usa al cerrar sesión: lo pendiente no puede acabar en la hoja
   * de otra cuenta.
   */
  abstract clear(): Promise<void>;
}
