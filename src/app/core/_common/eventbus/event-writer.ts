import { inject, Injectable } from '@angular/core';
import { DomainEvent } from './domain-event';
import { ask, EventDatabase, QueuedEvent } from './event-database';

/** Ancho del turno dentro del id, para que ordene bien al leerlo. */
const SEQ_WIDTH = 12;

/**
 * Persistir: el **paso 1** (guardar el evento) y el **paso 3** (borrarlo cuando ya llegó a todos).
 *
 * También anota el progreso de una entrega a medias (`update`), que es lo que permite reintentar sin
 * volver a molestar a quien ya lo recibió.
 */
@Injectable()
export class EventWriter {
  private readonly db = inject(EventDatabase);

  /** Último turno repartido; se retoma de la cola para que el orden sobreviva a la recarga. */
  private seq = 0;
  private ready: Promise<void> | null = null;

  /** Paso 1: guarda los eventos al final de la cola, en el orden en que llegan. */
  async append(events: readonly DomainEvent[]): Promise<void> {
    await this.restoreSeq();
    const store = await this.db.store('readwrite');

    for (const event of events) {
      const seq = ++this.seq;
      await ask(
        store.put({
          id: `${event.name}#${String(seq).padStart(SEQ_WIDTH, '0')}`,
          name: event.name,
          aggregateId: event.aggregateId,
          at: event.occurredOn.getTime(),
          data: { ...event.data },
          seq,
          delivered: [],
          attempts: 0,
        } satisfies QueuedEvent),
      );
    }
  }

  /** Anota una entrega incompleta: a quién le llegó ya y cuántos intentos lleva. */
  async update(event: QueuedEvent): Promise<void> {
    await ask((await this.db.store('readwrite')).put(event));
  }

  /** Paso 3: fuera. Le ha llegado a todos sus suscriptores. */
  async remove(id: string): Promise<void> {
    await ask((await this.db.store('readwrite')).delete(id));
  }

  private restoreSeq(): Promise<void> {
    this.ready ??= (async () => {
      const all = await ask<QueuedEvent[]>((await this.db.store('readonly')).getAll());
      this.seq = all.reduce((max, record) => Math.max(max, record.seq), 0);
    })();
    return this.ready;
  }
}
