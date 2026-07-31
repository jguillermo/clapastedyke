import { inject, Injectable } from '@angular/core';
import { ask, EventDatabase, QueuedEvent } from './event-database';

/**
 * Leer: el **paso 2**, sacar de la cola el evento que toca.
 *
 * Toca siempre el más antiguo, por el índice de llegada. Se lee la cola entera y se coge el primero
 * porque la cola está vacía casi siempre —se llena en ráfagas de unos pocos eventos y se vacía en el
 * siguiente tick—, así que es más simple y más robusto que pasear un cursor entre `await`s.
 */
@Injectable()
export class EventReader {
  private readonly db = inject(EventDatabase);

  /** El más antiguo pendiente de entregar, o `null` si no hay trabajo. */
  async next(): Promise<QueuedEvent | null> {
    const ordered = await ask<QueuedEvent[]>((await this.db.byArrival('readonly')).getAll());
    return ordered[0] ?? null;
  }
}
