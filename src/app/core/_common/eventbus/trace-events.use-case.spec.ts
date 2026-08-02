import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { domainEvent } from './domain-event';
import { EventDispatcher } from './event-dispatcher';
import { provideEventTracing } from './event-bus.providers';
import { TraceEvents } from './trace-events.use-case';
import { IntegrationEventName } from '../events/integration-events';
import { LogContext, Logger, LogLevel } from '../logger/logger';

/** Una línea, tal como se pidió registrarla. */
interface Line {
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * El logger de **este** fichero. El trazador no tiene más efecto que registrar, así que mirar lo que
 * escribió es la única forma de juzgarlo.
 *
 * Es local a propósito: el proyecto **no** tiene un logger que grabe. El `Logger` de verdad escribe
 * en consola cuando lo llaman y nada más — ni guarda, ni acumula, ni se puede consultar.
 */
class LogSpy extends Logger {
  constructor(
    readonly lines: Line[] = [],
    private readonly prefix = '',
  ) {
    super();
  }

  debug(message: string, context?: LogContext): void {
    this.push('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.push('info', message, context);
  }

  warn(message: string, _cause?: unknown, context?: LogContext): void {
    this.push('warn', message, context);
  }

  error(message: string, _cause?: unknown, context?: LogContext): void {
    this.push('error', message, context);
  }

  /** Comparte el array con el padre: el prefijo cambia, el sitio donde se apunta no. */
  scoped(scope: string): Logger {
    return new LogSpy(this.lines, `${this.prefix}[${scope}] `);
  }

  /** Las líneas de un scope, ya sin prefijo en el mensaje. */
  from(scope: string): Line[] {
    const prefix = `[${scope}] `;
    return this.lines
      .filter((line) => line.message.startsWith(prefix))
      .map((line) => ({ ...line, message: line.message.slice(prefix.length) }));
  }

  private push(level: LogLevel, message: string, context?: LogContext): void {
    const line: Line = { level, message: `${this.prefix}${message}` };
    if (context !== undefined) {
      line.context = context;
    }
    this.lines.push(line);
  }
}

describe('TraceEvents', () => {
  let dispatcher: EventDispatcher;
  let log: LogSpy;

  /** Monta el trazador con el MISMO provider que usa la app. */
  async function wire(): Promise<void> {
    log = new LogSpy();
    TestBed.configureTestingModule({
      providers: [{ provide: Logger, useValue: log }, EventDispatcher, provideEventTracing()],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    dispatcher = TestBed.inject(EventDispatcher);
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

    // Se filtra por scope: el dispatcher también registra (suscripciones y entregas) y aquí solo
    // se juzga al trazador.
    expect(log.from('events').map((line) => line.message)).toEqual([...catalogo]);
  });

  it('cada evento se traza una sola vez, aunque escuche el catálogo entero', async () => {
    await wire();

    await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'RE-1'), []);

    expect(log.from('events')).toHaveLength(1);
  });

  it('traza en nivel debug: se ve con el modo depuración encendido, no siempre', async () => {
    await wire();

    await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'RE-1'), []);

    expect(log.from('events')[0].level).toBe('debug');
  });

  it('deja rastro del id, la hora y el payload entero', async () => {
    await wire();
    const event = domainEvent(IntegrationEventName.RECIPE_CAPACITY_SAVED, 'RC-1', {
      group: 'portions',
      label: '33',
      factor: 33,
    });

    await TestBed.inject(TraceEvents).execute(event);

    expect(log.from('events')[0]).toEqual({
      level: 'debug',
      message: 'RecipeCapacitySaved',
      context: {
        aggregateId: 'RC-1',
        occurredOn: event.occurredOn.toISOString(),
        data: { group: 'portions', label: '33', factor: 33 },
      },
    });
  });
});
