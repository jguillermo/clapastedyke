import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { domainEvent } from './domain-event';
import { EventDispatcher } from './event-dispatcher';
import { provideEventTracing } from './event-bus.providers';
import { TraceEvents } from './trace-events.use-case';
import { IntegrationEventName } from '../events/integration-events';
import { Logger } from '../logger/logger';
import { provideTestLogger, RecordingLogger } from '../testing/logger-test-doubles';

describe('TraceEvents', () => {
  let dispatcher: EventDispatcher;
  let log: RecordingLogger;

  /** Monta el trazador con el MISMO provider que usa la app. */
  async function wire(): Promise<void> {
    TestBed.configureTestingModule({
      providers: [...provideTestLogger(), EventDispatcher, provideEventTracing()],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    dispatcher = TestBed.inject(EventDispatcher);
    log = TestBed.inject(Logger) as RecordingLogger;
  }

  it('traza TODOS los nombres del Published Language, sin dejarse ninguno', async () => {
    // La garantía que importa: añadir un nombre al catálogo lo deja trazado solo. Si alguien lo
    // cambia por una lista escrita a mano, este test lo caza.
    await wire();
    const catalogo = Object.values(IntegrationEventName);
    expect(catalogo.length).toBeGreaterThan(0);

    for (const name of catalogo) {
      await dispatcher.deliver(domainEvent(name, 'A-1'), []);
    }

    expect(log.messages()).toEqual(catalogo.map((name) => `[events] ${name}`));
  });

  it('cada evento se traza una sola vez, aunque escuche el catálogo entero', async () => {
    await wire();

    await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'RE-1'), []);

    expect(log.entries).toHaveLength(1);
  });

  it('traza en nivel debug: se ve con el modo depuración encendido, no siempre', async () => {
    await wire();

    await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'RE-1'), []);

    expect(log.entries[0].level).toBe('debug');
  });

  it('deja rastro del id, la hora y el payload entero', async () => {
    await wire();
    const event = domainEvent(IntegrationEventName.RECIPE_CAPACITY_SAVED, 'RC-1', {
      group: 'portions',
      label: '33',
      factor: 33,
    });

    await TestBed.inject(TraceEvents).execute(event);

    expect(log.entries[0]).toEqual({
      level: 'debug',
      message: '[events] RecipeCapacitySaved',
      context: {
        aggregateId: 'RC-1',
        occurredOn: event.occurredOn.toISOString(),
        data: { group: 'portions', label: '33', factor: 33 },
      },
    });
  });
});
