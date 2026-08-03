import { inject, Injectable } from '@angular/core';
import { DomainEvent, restoreEvent } from './domain-event';
import { EventBus, EventHandler } from './event-bus';
import { EventDispatcher } from './event-dispatcher';
import { EventReader } from './event-reader';
import { EventWriter } from './event-writer';
import { Logger } from '../logger/logger';

/** Cada cuánto avisa el tick de que puede haber trabajo. */
const TICK_MS = 200;

/**
 * El bus: encadena los cuatro pasos y nada más.
 *
 * ```
 *  1. publish()  →  writer.append()          guardar el evento
 *  2. tick       →  reader.next()            leer el siguiente
 *                   dispatcher.deliver()     enviarlo a todos los suscriptores
 *  3. ¿llegó a todos?  →  writer.remove()    borrarlo
 *  4. ¿alguno falló?   →  writer.update()    anotar y reintentar en el siguiente tick
 * ```
 *
 * Publicar es **guardar**, no repartir: `publish()` vuelve cuando el evento está en disco, así que
 * el caso de uso que guarda no paga el precio de los suscriptores y un cierre a mitad no se traga
 * nada.
 *
 * **NUNCA dos eventos a la vez.** Es la invariante dura de este bus. El tick no reparte: solo *avisa*
 * de que puede haber trabajo. Quien reparte es `pump()`, y `pump()` es de **un solo vuelo**: si ya hay
 * una tanda viva, el aviso se descarta y se devuelve la tanda en curso. Un evento se procesa entero
 * —éxito o error, incluidos todos sus suscriptores— antes de tocar el siguiente:
 *
 * - `drain()` recorre la cola con un `for` que hace `await` de cada evento antes de seguir.
 * - `deliver()` recorre los suscriptores del evento con `await` uno a uno.
 * - `pump()` impide que dos tandas coexistan, **incluso si se para y se rearranca a mitad**: el
 *   candado es la propia promesa en vuelo, no el temporizador, así que sobrevive a `stop()`/`start()`.
 *
 * **El repartidor nunca reparte de forma síncrona.** Ni el tick ni el empujón de `publish()`: los dos
 * pasan por un temporizador. Así el primer reparto cae siempre después del arranque, con los
 * suscriptores ya registrados — de lo contrario un evento podría darse por entregado «a nadie» porque
 * su suscriptor aún no existía.
 */
@Injectable()
export class PersistentEventBus extends EventBus {
  private readonly writer = inject(EventWriter);
  private readonly reader = inject(EventReader);
  private readonly dispatcher = inject(EventDispatcher);
  private readonly log = inject(Logger).scoped('eventbus/bus');

  /** El tick permanente. Su existencia es también el «estoy arrancado». */
  private ticker: ReturnType<typeof setInterval> | null = null;

  /** El empujón inmediato de `publish()`, para no esperar al siguiente tick. */
  private nudge: ReturnType<typeof setTimeout> | null = null;

  /**
   * La tanda en vuelo, o `null` si no hay ninguna. **Es el candado**: mientras no sea `null`, ningún
   * aviso puede arrancar otra. Se guarda la promesa y no un booleano para poder devolverla y que
   * quien avise pueda esperarla si le interesa.
   */
  private running: Promise<void> | null = null;

  subscribe(subscriber: string, eventName: string, handler: EventHandler): void {
    this.dispatcher.subscribe(subscriber, eventName, handler);
  }

  /** Paso 1. */
  async publish(events: readonly DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }
    await this.writer.append(events);
    this.log.debug('encolados', { names: events.map((event) => event.name) });
    this.wake();
  }

  /** Arranca el tick. Lo llama un app-initializer, una sola vez. */
  start(): void {
    if (this.ticker !== null) {
      return;
    }
    this.ticker = setInterval(() => void this.pump(), TICK_MS);
    this.log.debug('arrancado', { tickMs: TICK_MS });
    // Puede haber cola de la sesión anterior: se mira ya, en el siguiente macrotask.
    this.wake();
  }

  /**
   * Para el tick. La cola queda en disco: reanudar es volver a llamar a `start()`.
   *
   * Una tanda ya en vuelo **termina**: no se puede cancelar a mitad sin dejar un evento a medio
   * repartir. Lo que sí garantiza `stop()` es que no empiece ninguna más.
   */
  stop(): void {
    if (this.ticker !== null) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
    if (this.nudge !== null) {
      clearTimeout(this.nudge);
      this.nudge = null;
    }
  }

  /** Avisa cuanto antes sin esperar al tick — pero nunca de forma síncrona. */
  private wake(): void {
    if (this.ticker === null || this.nudge !== null) {
      return;
    }
    this.nudge = setTimeout(() => {
      this.nudge = null;
      void this.pump();
    }, 0);
  }

  /**
   * Recibe un aviso de que puede haber trabajo. **Un solo vuelo**: si ya hay una tanda viva devuelve
   * esa misma y no arranca otra.
   *
   * `??=` es el candado entero. Entre que se evalúa y que se asigna no hay ningún `await`, así que
   * no existe ventana por la que se cuele una segunda tanda.
   */
  private pump(): Promise<void> {
    this.running ??= this.runOnce().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  /** Una tanda. Nunca lanza: un fallo se registra y el siguiente aviso lo reintenta. */
  private async runOnce(): Promise<void> {
    try {
      await this.drain();
    } catch (error) {
      this.log.error('El reparto de eventos ha fallado', error);
    }
  }

  /** Pasos 2, 3 y 4, de uno en uno y en orden de llegada, hasta vaciar la cola. */
  private async drain(): Promise<void> {
    for (;;) {
      const queued = await this.reader.next();
      if (queued === null) {
        return;
      }

      const event = restoreEvent(queued.name, queued.aggregateId, new Date(queued.at), queued.data);
      const delivered = await this.dispatcher.deliver(event, queued.delivered);

      if (delivered === null) {
        await this.writer.remove(queued.id);
        this.log.debug('entregado a todos, fuera de la cola', { id: queued.id });
        continue;
      }

      // Alguno falló: se anota a quién le llegó ya y se deja para la siguiente tanda, que
      // reintentará solo con los que faltan.
      await this.writer.update({ ...queued, delivered, attempts: queued.attempts + 1 });
      this.log.debug('reintentará en la siguiente tanda', {
        id: queued.id,
        delivered,
        attempts: queued.attempts + 1,
      });
      return;
    }
  }
}
