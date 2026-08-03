import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomainEvent, domainEvent } from '@core/_common/eventbus/domain-event';
import { EventBus } from '@core/_common/eventbus/event-bus';
import { provideEventHandlers } from '@core/_common/eventbus/event-bus.providers';
import { QueuedEvent } from '@core/_common/eventbus/event-database';
import { EventDispatcher } from '@core/_common/eventbus/event-dispatcher';
import { EventReader } from '@core/_common/eventbus/event-reader';
import { EventWriter } from '@core/_common/eventbus/event-writer';
import { subscribedEventOf } from '@core/_common/eventbus/on-event';
import { PersistentEventBus } from '@core/_common/eventbus/persistent-event-bus';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { LogContext, Logger } from '@core/_common/logger/logger';
import { EVENT_DRIVEN_USE_CASES } from '../../external-sync.providers';

/**
 * Que los eventos **llegan de verdad** a los casos de uso de este contexto.
 *
 * No se comprueba con un doble del bus: se monta el bus real (`PersistentEventBus` + el repartidor)
 * y se enganchan los casos de uso con `provideEventHandlers`, la misma función que usa
 * `provideExternalSync()`, sobre la **misma lista** que registra en producción. Lo único falso es la
 * cola en disco —IndexedDB no existe en jsdom—, sustituida por un array con el mismo contrato.
 *
 * Así el test cubre los cuatro eslabones que pueden romperse en silencio: el nombre del evento, la
 * anotación `@OnEvent`, el registro en el `provide*()` y el reparto asíncrono posterior al publicado.
 *
 * Hay **un evento por agregado** (`*Saved`): quien publica no distingue el alta de la edición, así
 * que aquí tampoco hay dos casos de uso por agregado.
 */

/** La cola en un array: mismo contrato que `EventWriter`/`EventReader` sobre IndexedDB. */
class FakeQueue {
  readonly records: QueuedEvent[] = [];
  private seq = 0;

  append = async (events: readonly DomainEvent[]): Promise<void> => {
    for (const event of events) {
      const seq = ++this.seq;
      this.records.push({
        id: `${event.name}#${seq}`,
        name: event.name,
        aggregateId: event.aggregateId,
        at: event.occurredOn.getTime(),
        data: { ...event.data },
        seq,
        delivered: [],
        attempts: 0,
      });
    }
  };

  update = async (event: QueuedEvent): Promise<void> => {
    const index = this.records.findIndex((record) => record.id === event.id);
    this.records[index] = { ...event, delivered: [...event.delivered] };
  };

  remove = async (id: string): Promise<void> => {
    this.records.splice(
      this.records.findIndex((record) => record.id === id),
      1,
    );
  };

  next = async (): Promise<QueuedEvent | null> => {
    const [first] = [...this.records].sort((a, b) => a.seq - b.seq);
    return first ? { ...first, delivered: [...first.delivered] } : null;
  };
}

/**
 * El logger de **este** fichero. Los casos de uso que se prueban aquí no hacen nada más que
 * registrar —hoy son el sitio donde entrará el envío remoto—, así que lo que escribieron es el único
 * efecto observable que tienen.
 *
 * Local a propósito: el proyecto **no** tiene un logger que grabe. El de verdad escribe en consola
 * cuando lo llaman y nada más.
 */
class LogSpy extends Logger {
  constructor(
    /** Contexto registrado por cada scope, en orden de llegada. */
    readonly byScope = new Map<string, LogContext[]>(),
    private readonly scope = '',
  ) {
    super();
  }

  debug(_message: string, context?: LogContext): void {
    this.record(context);
  }

  info(_message: string, context?: LogContext): void {
    this.record(context);
  }

  warn(_message: string, _cause?: unknown, context?: LogContext): void {
    this.record(context);
  }

  error(_message: string, _cause?: unknown, context?: LogContext): void {
    this.record(context);
  }

  scoped(scope: string): Logger {
    return new LogSpy(this.byScope, scope);
  }

  /** Apunta el contexto bajo el scope de este logger. El nivel no importa: lo que se juzga es quién. */
  private record(context?: LogContext): void {
    const previous = this.byScope.get(this.scope) ?? [];
    this.byScope.set(this.scope, [...previous, context ?? {}]);
  }
}

describe('Casos de uso dirigidos por evento de external-sync', () => {
  let bus: PersistentEventBus;
  let queue: FakeQueue;
  let log: LogSpy;

  /** Deja correr al repartidor: agota temporizadores y las promesas que encadenan. */
  async function deliver(): Promise<void> {
    for (let round = 0; round < 20; round++) {
      await vi.advanceTimersByTimeAsync(200);
    }
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    queue = new FakeQueue();
    log = new LogSpy();
    TestBed.configureTestingModule({
      providers: [
        { provide: Logger, useValue: log },
        EventDispatcher,
        PersistentEventBus,
        { provide: EventBus, useExisting: PersistentEventBus },
        { provide: EventWriter, useValue: queue as unknown as EventWriter },
        { provide: EventReader, useValue: queue as unknown as EventReader },
        // La MISMA llamada y la MISMA lista que `provideExternalSync()`.
        provideEventHandlers(...EVENT_DRIVEN_USE_CASES),
      ],
    });
    // Los app-initializers son los que registran las suscripciones; sin esto no hay nadie escuchando.
    await TestBed.inject(ApplicationInitStatus).donePromise;

    bus = TestBed.inject(PersistentEventBus);
    bus.start();
  });

  afterEach(() => {
    bus.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /**
   * El contexto que registró un caso de uso, o `undefined` si el evento no le llegó.
   *
   * Se busca por **scope**, no por el texto del mensaje: lo que este test comprueba es a QUIÉN llegó
   * el evento, y el scope es quién. Así reescribir la prosa de un registro no rompe el test.
   */
  function traceFor(useCase: string): unknown {
    return log.byScope.get(`external-sync/${useCase}`)?.[0];
  }

  it('todos los casos de uso declaran su evento con @OnEvent', () => {
    // El decorador es la mitad del enganche: sin anotación, `provideEventHandlers` no suscribe nada
    // y el fallo sería mudo (ningún error, simplemente no pasa nada).
    for (const useCase of EVENT_DRIVEN_USE_CASES) {
      expect(subscribedEventOf(useCase)).toBeTruthy();
    }
  });

  it('RecipeSaved → llega a NotifyRecipeSaved con el id y la categoría', async () => {
    await bus.publish([
      domainEvent(IntegrationEventName.RECIPE_SAVED, 'RE-1', { categoryId: 'CAT-1' }),
    ]);
    await deliver();

    expect(traceFor('notify-recipe-saved')).toMatchObject({
      recipeId: 'RE-1',
      categoryId: 'CAT-1',
    });
    // Entregado a todos sus suscriptores → el bus lo borra de la cola.
    expect(queue.records).toHaveLength(0);
  });

  it('SupplySaved → llega a NotifySupplySaved con el nombre del insumo', async () => {
    await bus.publish([domainEvent(IntegrationEventName.SUPPLY_SAVED, 'SU-1', { name: 'Harina' })]);
    await deliver();

    expect(traceFor('notify-supply-saved')).toMatchObject({ supplyId: 'SU-1', name: 'Harina' });
    expect(traceFor('notify-recipe-saved')).toBeUndefined();
  });

  it('un evento sin caso de uso aquí no atasca la cola', async () => {
    // `RecipeCategorySaved` solo lo escucha el suscriptor de la cola de sincronización, que este test
    // no monta: se reparte a nadie y se borra igual, sin bloquear a los siguientes.
    await bus.publish([
      domainEvent(IntegrationEventName.RECIPE_CATEGORY_SAVED, 'CAT-1'),
      domainEvent(IntegrationEventName.SUPPLY_SAVED, 'SU-1', { name: 'Harina' }),
    ]);
    await deliver();

    expect(traceFor('notify-supply-saved')).toBeDefined();
    expect(queue.records).toHaveLength(0);
  });
});
