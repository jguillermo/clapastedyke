import { inject, Injectable } from '@angular/core';
import { EventBus } from '@core/_common/eventbus/event-bus';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { Logger } from '@core/_common/logger/logger';
import { Synchronize } from '../application/use-cases/synchronize.use-case';
import { SyncOutbox } from '../domain/services/sync-outbox';
import { SyncStatus } from '../domain/services/sync-status';
import { SyncItem } from '../domain/value-objects/sync-item';

/**
 * Espera antes de enviar. Agrupa la ráfaga de eventos que produce un solo guardado (el formulario de
 * receta asegura sus insumos uno por uno y luego guarda la receta) en un único envío.
 */
const DEBOUNCE_MS = 400;

/**
 * Identidad de este suscriptor ante el bus. Es la clave con la que el bus anota que ya recibió un
 * evento, así que **no se renombra a la ligera**: cambiarla hace que los eventos a medio repartir
 * vuelvan a entregarse aquí (inofensivo —encolar es idempotente— pero conviene saberlo).
 */
const SUBSCRIBER = 'external-sync:recipe-book-changed';

/**
 * Qué evento de integración corresponde a qué agregado.
 *
 * Los nombres de agregado son los que declara quien publica los datos, y viajan tal cual al origen
 * cuando toca exportarlos. Aquí se escriben como literales a propósito: **este contexto no importa
 * nada del que publica**, solo se engancha al Published Language del shared kernel.
 */
const SUBSCRIPTIONS: readonly [string, string][] = [
  [IntegrationEventName.SUPPLY_SAVED, 'supply'],
  [IntegrationEventName.RECIPE_SAVED, 'recipe'],
  [IntegrationEventName.RECIPE_CATEGORY_SAVED, 'category'],
  [IntegrationEventName.FLAVOR_SAVED, 'flavor'],
  [IntegrationEventName.RECIPE_CAPACITY_SAVED, 'capacity'],
];

/**
 * Adaptador de entrada: traduce «se ha guardado algo ahí fuera» al idioma de este contexto, un
 * cambio pendiente en la cola. El único acoplamiento es el **nombre del evento**, que vive en el
 * shared kernel; nada del modelo de quien lo publica.
 *
 * **CRÍTICO — el handler espera a la cola, nunca a la red.** `InMemoryEventBus.publish()` hace
 * `await` de cada suscriptor, y publica *dentro* del caso de uso que acaba de guardar. Si aquí se
 * esperara la llamada remota, guardar una receta tardaría lo que tarde internet.
 *
 * Lo que sí se espera es la escritura en la cola, y es deliberado: son milisegundos contra la base
 * de datos local, y es lo que garantiza que cuando el guardado termina el cambio ya está anotado en
 * disco. Si se dejara al aire (fire-and-forget), un refresco en ese instante lo perdería — que es
 * justo el agujero que la cola durable viene a tapar. El envío en sí queda programado en un
 * temporizador y ocurre después, ya fuera del guardado.
 */
@Injectable({ providedIn: 'root' })
export class RecipeBookChangedSubscriber {
  private readonly bus = inject(EventBus);
  private readonly outbox = inject(SyncOutbox);
  private readonly status = inject(SyncStatus);
  private readonly sync = inject(Synchronize);
  private readonly log = inject(Logger).scoped('external-sync/on-book-changed');

  private timer: ReturnType<typeof setTimeout> | null = null;

  register(): void {
    for (const [eventName, aggregate] of SUBSCRIPTIONS) {
      this.bus.subscribe(SUBSCRIBER, eventName, (event) =>
        this.queue(aggregate, event.aggregateId),
      );
    }
  }

  private async queue(aggregate: string, id: string): Promise<void> {
    // Sin sesión no se encola nada: una cola huérfana podría acabar en el destino de otra cuenta.
    // Lo que se cree mientras no hay cuenta lo recoge la sincronización completa al conectar.
    if (this.status.snapshot().phase === 'disconnected') {
      // Sin esta línea, «guardé algo y no se sincronizó» no tiene explicación visible.
      this.log.debug('sin cuenta conectada, no se encola', { aggregate, id });
      return;
    }
    await this.outbox.enqueue(SyncItem.of(aggregate, id));
    this.log.debug('encolado para sincronizar', { aggregate, id });
    this.schedule();
  }

  private schedule(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      this.log.debug('se acabó la espera, se sincroniza lo pendiente');
      this.sync
        .execute({ scope: 'pending' })
        .catch((error: unknown) => this.log.error('Sincronización pendiente fallida', error));
    }, DEBOUNCE_MS);
  }
}
