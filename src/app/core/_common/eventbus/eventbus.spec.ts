import { ApplicationInitStatus, Injectable, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomainEvent, domainEvent, restoreEvent } from '../eventbus/domain-event';
import { EventBus } from '../eventbus/event-bus';
import {
  provideEventBus,
  provideEventHandlers,
  provideEventTracing,
} from '../eventbus/event-bus.providers';
import { EventDatabase, QueuedEvent, ask } from '../eventbus/event-database';
import { EventDispatcher } from '../eventbus/event-dispatcher';
import { EventReader } from '../eventbus/event-reader';
import { EventWriter } from '../eventbus/event-writer';
import { EventDrivenUseCase, OnEvent, subscribedEventOf } from '../eventbus/on-event';
import { PersistentEventBus } from '../eventbus/persistent-event-bus';
import { TraceEvents } from '../eventbus/trace-events.use-case';
import { IntegrationEventName } from '../events/integration-events';
import { LogContext, Logger, LogLevel } from '../logger/logger';

/**
 * **El test del paquete `eventbus`, entero y en un solo fichero.**
 *
 * Cubre las siete piezas —`domain-event`, `event-database`, `event-writer`, `event-reader`,
 * `event-dispatcher`, `persistent-event-bus`, `on-event` y sus `provide*()`— con dos énfasis:
 *
 * 1. **Que el evento llegue.** Publicar → encolar → repartir a todos sus suscriptores → borrar, con
 *    su orden, su hora original, el mismo objeto congelado para todos, y el reintento por suscriptor
 *    cuando alguno revienta.
 * 2. **Que quede registrado.** Un evento sin suscriptor es invisible, así que el rastro *es* parte
 *    del contrato: se afirma línea por línea qué escribe el bus (`[eventbus/bus]`), qué escribe el
 *    repartidor (`[eventbus/dispatcher]`, incluido el «no lo escucha nadie») y qué escribe el
 *    trazador (`[events]`), con el error en **su propia ranura** — no anidado en el contexto.
 *
 * Los dos dobles que necesita viven aquí y no en un fichero compartido, porque solo los usa este
 * test: un `LogSpy` (el `Logger` de verdad escribe y ya está: no guarda, no acumula, no se consulta)
 * y un IndexedDB de mentira. Con ese IndexedDB falso, **todo lo demás es el código de producción**:
 * el bus corre sobre su `EventWriter` y su `EventReader` reales.
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// Doble 1 · el logger que sí se puede consultar
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Una línea, tal cual se pidió registrarla. */
interface Line {
  scope: string;
  level: LogLevel;
  message: string;
  cause?: unknown;
  context?: LogContext;
}

/**
 * El `Logger` de este fichero. Es local a propósito: el proyecto **no** tiene un logger que grabe, y
 * no se añade uno — el adaptador real escribe en consola cuando lo llaman y nada más.
 *
 * Guarda el `scope` aparte del mensaje para poder juzgar a cada pieza por separado (`from('events')`
 * no ve lo que escribió el repartidor).
 */
class LogSpy extends Logger {
  constructor(
    readonly lines: Line[] = [],
    private readonly scope = '',
  ) {
    super();
  }

  debug(message: string, context?: LogContext): void {
    this.push('debug', message, undefined, context);
  }

  info(message: string, context?: LogContext): void {
    this.push('info', message, undefined, context);
  }

  warn(message: string, cause?: unknown, context?: LogContext): void {
    this.push('warn', message, cause, context);
  }

  error(message: string, cause?: unknown, context?: LogContext): void {
    this.push('error', message, cause, context);
  }

  /** Comparte el array con el padre: cambia el scope, no el sitio donde se apunta. */
  scoped(scope: string): Logger {
    return new LogSpy(this.lines, this.scope === '' ? scope : `${this.scope}[${scope}]`);
  }

  /** Todo lo escrito bajo un scope. */
  from(scope: string): Line[] {
    return this.lines.filter((line) => line.scope === scope);
  }

  /** Solo los mensajes de un scope, para comparar listas de un vistazo. */
  messages(scope: string): string[] {
    return this.from(scope).map((line) => line.message);
  }

  private push(level: LogLevel, message: string, cause?: unknown, context?: LogContext): void {
    const line: Line = { scope: this.scope, level, message };
    if (cause !== undefined) {
      line.cause = cause;
    }
    if (context !== undefined) {
      line.context = context;
    }
    this.lines.push(line);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// Doble 2 · IndexedDB de mentira (el writer y el reader de VERDAD corren encima)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Una petición de IndexedDB falsa: resuelve en un microtask, como la de verdad. */
function fakeRequest<T>(run: () => T): IDBRequest<T> {
  const request = {
    result: undefined,
    error: null,
    onsuccess: null,
    onerror: null,
  } as unknown as IDBRequest<T>;

  void Promise.resolve().then(() => {
    try {
      (request as { result: T }).result = run();
      request.onsuccess?.call(request, new Event('success'));
    } catch (error) {
      (request as { error: DOMException | null }).error = error as DOMException;
      request.onerror?.call(request, new Event('error'));
    }
  });

  return request;
}

/** IndexedDB guarda **clones estructurados**: lo que sale no es el objeto que entró. */
function clone(row: QueuedEvent): QueuedEvent {
  return { ...row, data: { ...row.data }, delivered: [...row.delivered] };
}

/** Una operación tal como la pidió el código de producción. */
interface Op {
  op: 'put' | 'delete' | 'getAll';
  mode: IDBTransactionMode;
  /** ¿Se pidió por el índice de llegada (`seq`) o por el store a pelo? */
  ordered: boolean;
}

/**
 * La cola en memoria, con la forma de IndexedDB: transacciones con modo, un store por clave y un
 * índice `seq` que devuelve en orden de llegada. Es lo único falso de los tests del bus.
 */
class FakeEventDatabase {
  readonly rows = new Map<string, QueuedEvent>();
  readonly ops: Op[] = [];

  /** Hace fallar el siguiente `getAll`, para probar el camino de error de verdad. */
  failNextRead: DOMException | null = null;

  store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    return Promise.resolve(this.fakeStore(mode));
  }

  async byArrival(mode: IDBTransactionMode): Promise<IDBIndex> {
    const store = (await this.store(mode)) as unknown as { index(name: string): IDBIndex };
    return store.index('seq');
  }

  /** Lo que hay guardado, en orden de llegada. */
  ordered(): QueuedEvent[] {
    return [...this.rows.values()].sort((a, b) => a.seq - b.seq).map(clone);
  }

  private fakeStore(mode: IDBTransactionMode): IDBObjectStore {
    const write = (op: 'put' | 'delete', apply: () => void) =>
      fakeRequest(() => {
        this.ops.push({ op, mode, ordered: false });
        if (mode === 'readonly') {
          throw new DOMException('transacción de solo lectura', 'ReadOnlyError');
        }
        apply();
        return undefined;
      });

    const read = (ordered: boolean): IDBRequest<QueuedEvent[]> =>
      fakeRequest(() => {
        this.ops.push({ op: 'getAll', mode, ordered });
        const failure = this.failNextRead;
        if (failure !== null) {
          this.failNextRead = null;
          throw failure;
        }
        const rows = this.ordered();
        // El store a pelo devuelve por clave; el índice, por `seq`.
        return ordered ? rows : [...rows].sort((a, b) => a.id.localeCompare(b.id));
      });

    return {
      put: (row: QueuedEvent) => write('put', () => void this.rows.set(row.id, clone(row))),
      delete: (id: string) => write('delete', () => void this.rows.delete(id)),
      getAll: () => read(false),
      index: (name: string) => ({ name, getAll: () => read(true) }) as unknown as IDBIndex,
    } as unknown as IDBObjectStore;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// Montajes
// ═══════════════════════════════════════════════════════════════════════════════════════════════

interface Wired {
  bus: PersistentEventBus;
  db: FakeEventDatabase;
  log: LogSpy;
  dispatcher: EventDispatcher;
}

/** El bus real, con su writer y su reader reales, sobre la cola falsa. */
function wireBus(db = new FakeEventDatabase(), log = new LogSpy()): Wired {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: Logger, useValue: log },
      { provide: EventDatabase, useValue: db as unknown as EventDatabase },
      EventWriter,
      EventReader,
      EventDispatcher,
      PersistentEventBus,
      { provide: EventBus, useExisting: PersistentEventBus },
    ],
  });
  return {
    bus: TestBed.inject(PersistentEventBus),
    dispatcher: TestBed.inject(EventDispatcher),
    db,
    log,
  };
}

/** Deja correr al repartidor: agota temporizadores y las promesas que encadenan. */
async function letItDeliver(): Promise<void> {
  for (let round = 0; round < 25; round++) {
    await vi.advanceTimersByTimeAsync(200);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 1 · El evento: `domainEvent()` y `restoreEvent()`
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('DomainEvent', () => {
  it('sella la hora al crearse y guarda nombre, agregado y payload', () => {
    const antes = Date.now();
    const event = domainEvent('RecipeSaved', 'R-1', { name: 'Bizcocho' });

    expect(event.name).toBe('RecipeSaved');
    expect(event.aggregateId).toBe('R-1');
    expect(event.data).toEqual({ name: 'Bizcocho' });
    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(antes);
  });

  it('sin payload, `data` es un objeto vacío (nunca undefined)', () => {
    expect(domainEvent('RecipeSaved', 'R-1').data).toEqual({});
  });

  it('el evento y su payload son inmutables: nadie puede reescribirlos', () => {
    const event = domainEvent('RecipeSaved', 'R-1', { name: 'Bizcocho' });

    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.data)).toBe(true);
    expect(() => {
      (event as { aggregateId: string }).aggregateId = 'otro';
    }).toThrow();
    expect(() => {
      (event.data as Record<string, unknown>)['name'] = 'otro';
    }).toThrow();
  });

  it('copia el payload: tocar el objeto original después no cambia el evento', () => {
    const payload = { name: 'Bizcocho' };
    const event = domainEvent('RecipeSaved', 'R-1', payload);

    payload.name = 'otro';

    expect(event.data['name']).toBe('Bizcocho');
  });

  it('`restoreEvent` NO re-sella la hora: un evento repartido tras recargar es indistinguible', () => {
    const ocurrio = new Date('2026-01-15T10:30:00.000Z');

    const event = restoreEvent('RecipeSaved', 'R-1', ocurrio, { name: 'Bizcocho' });

    expect(event.occurredOn).toEqual(ocurrio);
    expect(event.name).toBe('RecipeSaved');
    expect(event.aggregateId).toBe('R-1');
    expect(event.data).toEqual({ name: 'Bizcocho' });
  });

  it('`restoreEvent` congela: el mismo objeto se entrega a TODOS los suscriptores', () => {
    const event = restoreEvent('RecipeSaved', 'R-1', new Date(), { name: 'Bizcocho' });

    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.data)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 2 · `EventDispatcher`: la propagación, sin base de datos
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('EventDispatcher · propagación', () => {
  let dispatcher: EventDispatcher;
  let log: LogSpy;

  beforeEach(() => {
    log = new LogSpy();
    TestBed.configureTestingModule({
      providers: [{ provide: Logger, useValue: log }, EventDispatcher],
    });
    dispatcher = TestBed.inject(EventDispatcher);
  });

  it('entrega a todos los suscriptores de ese nombre, en el orden en que se suscribieron', async () => {
    const recibidos: string[] = [];
    dispatcher.subscribe('a', 'RecipeSaved', () => void recibidos.push('a'));
    dispatcher.subscribe('b', 'RecipeSaved', () => void recibidos.push('b'));
    dispatcher.subscribe('c', 'RecipeSaved', () => void recibidos.push('c'));

    const pendientes = await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), []);

    expect(recibidos).toEqual(['a', 'b', 'c']);
    // `null` = le llegó a todos, el evento ya se puede borrar.
    expect(pendientes).toBeNull();
  });

  it('no entrega a quien escucha OTRO evento', async () => {
    const recibidos: string[] = [];
    dispatcher.subscribe('a', 'RecipeSaved', () => void recibidos.push('a'));
    dispatcher.subscribe('b', 'SupplySaved', () => void recibidos.push('b'));

    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), []);

    expect(recibidos).toEqual(['a']);
  });

  it('el suscriptor recibe el evento entero: nombre, agregado, hora y payload', async () => {
    const event = domainEvent('RecipeSaved', 'R-1', { name: 'Bizcocho', lines: 3 });
    const recibidos: DomainEvent[] = [];
    dispatcher.subscribe('a', 'RecipeSaved', (each) => void recibidos.push(each));

    await dispatcher.deliver(event, []);

    expect(recibidos).toEqual([event]);
  });

  it('espera a cada suscriptor antes de tocar el siguiente: nunca dos a la vez', async () => {
    const orden: string[] = [];
    const lento = (id: string) => async () => {
      orden.push(`inicio:${id}`);
      await Promise.resolve();
      orden.push(`fin:${id}`);
    };
    dispatcher.subscribe('a', 'RecipeSaved', lento('a'));
    dispatcher.subscribe('b', 'RecipeSaved', lento('b'));

    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), []);

    expect(orden).toEqual(['inicio:a', 'fin:a', 'inicio:b', 'fin:b']);
  });

  it('a quien ya lo recibió NO se le entrega otra vez', async () => {
    const recibidos: string[] = [];
    dispatcher.subscribe('a', 'RecipeSaved', () => void recibidos.push('a'));
    dispatcher.subscribe('b', 'RecipeSaved', () => void recibidos.push('b'));

    const pendientes = await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), ['a']);

    expect(recibidos).toEqual(['b']);
    expect(pendientes).toBeNull();
  });

  it('un suscriptor roto NO arrastra a los demás, y solo él queda pendiente', async () => {
    const recibidos: string[] = [];
    dispatcher.subscribe('antes', 'RecipeSaved', () => void recibidos.push('antes'));
    dispatcher.subscribe('roto', 'RecipeSaved', () => {
      throw new Error('reventó');
    });
    dispatcher.subscribe('despues', 'RecipeSaved', () => void recibidos.push('despues'));

    const pendientes = await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), []);

    expect(recibidos).toEqual(['antes', 'despues']);
    // Devuelve quiénes lo tienen YA (los dos buenos): el reintento irá solo a `roto`.
    expect(pendientes).toEqual(['antes', 'despues']);
  });

  it('el reintento solo molesta a los que faltan', async () => {
    const intentos: string[] = [];
    dispatcher.subscribe('bien', 'RecipeSaved', () => void intentos.push('bien'));
    dispatcher.subscribe('roto', 'RecipeSaved', () => void intentos.push('roto'));

    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), ['bien']);

    expect(intentos).toEqual(['roto']);
  });

  it('un suscriptor asíncrono que rechaza cuenta como fallo, no como entregado', async () => {
    dispatcher.subscribe('roto', 'RecipeSaved', async () => {
      await Promise.resolve();
      throw new Error('rechazó');
    });

    expect(await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), [])).toEqual([]);
  });

  it('dos suscripciones con el mismo id al mismo evento son UNA: la última gana', async () => {
    const recibidos: string[] = [];
    dispatcher.subscribe('a', 'RecipeSaved', () => void recibidos.push('vieja'));
    dispatcher.subscribe('a', 'RecipeSaved', () => void recibidos.push('nueva'));

    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), []);

    expect(recibidos).toEqual(['nueva']);
  });

  it('el mismo id en eventos distintos son suscripciones distintas', async () => {
    const recibidos: string[] = [];
    dispatcher.subscribe('a', 'RecipeSaved', () => void recibidos.push('receta'));
    dispatcher.subscribe('a', 'SupplySaved', () => void recibidos.push('insumo'));

    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), []);
    await dispatcher.deliver(domainEvent('SupplySaved', 'S-1'), []);

    expect(recibidos).toEqual(['receta', 'insumo']);
  });

  it('un evento que no escucha nadie se da por entregado (para poder borrarlo)', async () => {
    expect(await dispatcher.deliver(domainEvent('NadieEscucha', 'X-1'), [])).toBeNull();
  });

  // ── El rastro ────────────────────────────────────────────────────────────────────

  it('registra cada suscripción, con quién y a qué', () => {
    dispatcher.subscribe('external-sync', 'RecipeSaved', () => undefined);

    expect(log.from('eventbus/dispatcher')).toEqual([
      {
        scope: 'eventbus/dispatcher',
        level: 'debug',
        message: 'suscrito',
        context: { subscriber: 'external-sync', event: 'RecipeSaved' },
      },
    ]);
  });

  it('registra cada entrega con la flecha `evento → suscriptor`', async () => {
    dispatcher.subscribe('external-sync', 'RecipeSaved', () => undefined);

    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-7'), []);

    expect(log.from('eventbus/dispatcher').at(-1)).toEqual({
      scope: 'eventbus/dispatcher',
      level: 'debug',
      message: 'RecipeSaved → external-sync',
      context: { aggregateId: 'R-7' },
    });
  });

  it('CRITICAL: deja escrito «no lo escucha nadie» — sin eso, «no se publicó» se ve igual', async () => {
    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-7'), []);

    expect(log.from('eventbus/dispatcher')).toEqual([
      {
        scope: 'eventbus/dispatcher',
        level: 'debug',
        message: 'RecipeSaved no lo escucha nadie',
        context: { aggregateId: 'R-7' },
      },
    ]);
  });

  it('un suscriptor que falla se registra como `error`, con la causa en SU ranura', async () => {
    const reventon = new Error('reventó');
    dispatcher.subscribe('external-sync', 'RecipeSaved', () => {
      throw reventon;
    });

    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-7'), []);

    // El error va como argumento propio, NO anidado en el contexto: si se anidara, la consola
    // perdería la pila pinchable y la cadena `cause`.
    expect(log.from('eventbus/dispatcher').at(-1)).toEqual({
      scope: 'eventbus/dispatcher',
      level: 'error',
      message: 'El suscriptor external-sync ha fallado con RecipeSaved',
      cause: reventon,
      context: { aggregateId: 'R-7' },
    });
  });

  it('no registra una entrega que no ocurrió (al que ya lo tenía)', async () => {
    dispatcher.subscribe('a', 'RecipeSaved', () => undefined);
    const antes = log.from('eventbus/dispatcher').length;

    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), ['a']);

    expect(log.from('eventbus/dispatcher')).toHaveLength(antes);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 3 · `EventWriter` + `EventReader`: la cola en disco
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('EventWriter + EventReader · la cola', () => {
  let db: FakeEventDatabase;
  let writer: EventWriter;
  let reader: EventReader;

  /** Una sesión nueva sobre la MISMA cola: como recargar la página. */
  function newSession(): { writer: EventWriter; reader: EventReader } {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Logger, useValue: new LogSpy() },
        { provide: EventDatabase, useValue: db as unknown as EventDatabase },
        EventWriter,
        EventReader,
      ],
    });
    return { writer: TestBed.inject(EventWriter), reader: TestBed.inject(EventReader) };
  }

  beforeEach(() => {
    db = new FakeEventDatabase();
    ({ writer, reader } = newSession());
  });

  it('guarda un registro por evento, con todo lo que hace falta para repartirlo luego', async () => {
    const event = domainEvent('RecipeSaved', 'R-1', { name: 'Bizcocho' });

    await writer.append([event]);

    expect(db.ordered()).toEqual([
      {
        id: 'RecipeSaved#000000000001',
        name: 'RecipeSaved',
        aggregateId: 'R-1',
        at: event.occurredOn.getTime(),
        data: { name: 'Bizcocho' },
        seq: 1,
        delivered: [],
        attempts: 0,
      },
    ]);
  });

  it('el id lleva nombre + turno acolchado, para que dos del mismo nombre no se pisen', async () => {
    await writer.append([domainEvent('RecipeSaved', 'R-1'), domainEvent('RecipeSaved', 'R-2')]);

    expect(db.ordered().map((row) => row.id)).toEqual([
      'RecipeSaved#000000000001',
      'RecipeSaved#000000000002',
    ]);
  });

  it('el turno crece en el orden en que llegan, dentro de la misma llamada', async () => {
    await writer.append([
      domainEvent('RecipeSaved', 'R-1'),
      domainEvent('SupplySaved', 'S-1'),
      domainEvent('RecipeSaved', 'R-2'),
    ]);

    expect(db.ordered().map((row) => [row.seq, row.aggregateId])).toEqual([
      [1, 'R-1'],
      [2, 'S-1'],
      [3, 'R-2'],
    ]);
  });

  it('CRITICAL: el turno sobrevive a la recarga — no se reinicia y no pisa lo pendiente', async () => {
    await writer.append([domainEvent('RecipeSaved', 'R-1'), domainEvent('RecipeSaved', 'R-2')]);

    // Nueva sesión, misma cola: el writer retoma el turno donde lo dejó el anterior.
    const siguiente = newSession();
    await siguiente.writer.append([domainEvent('RecipeSaved', 'R-3')]);

    expect(db.ordered().map((row) => row.id)).toEqual([
      'RecipeSaved#000000000001',
      'RecipeSaved#000000000002',
      'RecipeSaved#000000000003',
    ]);
  });

  it('el turno se retoma UNA sola vez, no en cada guardado', async () => {
    await writer.append([domainEvent('RecipeSaved', 'R-1')]);
    await writer.append([domainEvent('RecipeSaved', 'R-2')]);

    const lecturasDelStore = db.ops.filter((op) => op.op === 'getAll' && !op.ordered);
    expect(lecturasDelStore).toHaveLength(1);
  });

  it('guarda la hora ORIGINAL del evento, no la de escritura', async () => {
    const event = restoreEvent('RecipeSaved', 'R-1', new Date('2026-01-15T10:30:00.000Z'), {});

    await writer.append([event]);

    expect(db.ordered()[0].at).toBe(new Date('2026-01-15T10:30:00.000Z').getTime());
  });

  it('nace sin entregar a nadie y sin intentos', async () => {
    await writer.append([domainEvent('RecipeSaved', 'R-1')]);

    expect(db.ordered()[0].delivered).toEqual([]);
    expect(db.ordered()[0].attempts).toBe(0);
  });

  it('escribe en una transacción de escritura', async () => {
    await writer.append([domainEvent('RecipeSaved', 'R-1')]);

    expect(db.ops.filter((op) => op.op === 'put')).toEqual([
      { op: 'put', mode: 'readwrite', ordered: false },
    ]);
  });

  it('lee el más antiguo pendiente, por el índice de llegada', async () => {
    await writer.append([domainEvent('RecipeSaved', 'R-1'), domainEvent('RecipeSaved', 'R-2')]);

    const siguiente = await reader.next();

    expect(siguiente?.aggregateId).toBe('R-1');
    expect(db.ops.at(-1)).toEqual({ op: 'getAll', mode: 'readonly', ordered: true });
  });

  it('con la cola vacía no hay trabajo: `null`', async () => {
    expect(await reader.next()).toBeNull();
  });

  it('lo leído es una copia: tocarlo no corrompe la cola', async () => {
    await writer.append([domainEvent('RecipeSaved', 'R-1')]);

    const leido = await reader.next();
    leido?.delivered.push('intruso');

    expect((await reader.next())?.delivered).toEqual([]);
  });

  it('`update` anota el progreso sin duplicar el registro', async () => {
    await writer.append([domainEvent('RecipeSaved', 'R-1')]);
    const pendiente = await reader.next();
    if (pendiente === null) {
      throw new Error('la cola debería tener el evento recién guardado');
    }

    await writer.update({ ...pendiente, delivered: ['external-sync'], attempts: 1 });

    expect(db.rows.size).toBe(1);
    expect((await reader.next())?.delivered).toEqual(['external-sync']);
    expect((await reader.next())?.attempts).toBe(1);
  });

  it('`remove` saca el evento de la cola y deja pasar al siguiente', async () => {
    await writer.append([domainEvent('RecipeSaved', 'R-1'), domainEvent('RecipeSaved', 'R-2')]);

    await writer.remove('RecipeSaved#000000000001');

    expect(db.rows.size).toBe(1);
    expect((await reader.next())?.aggregateId).toBe('R-2');
  });

  it('un fallo de IndexedDB sube traducido, con el `DOMException` como causa', async () => {
    const roto = new DOMException('cuota agotada', 'QuotaExceededError');
    db.failNextRead = roto;

    // Traduce y relanza, pero NO registra: el dueño del fallo es quien decide el resultado visible.
    await expect(reader.next()).rejects.toThrow(/Falló una operación sobre la cola de eventos/);
    expect(db.failNextRead).toBeNull();
  });

  it('`ask()` conserva la causa original para que la consola pinte la cadena entera', async () => {
    const roto = new DOMException('cuota agotada', 'QuotaExceededError');

    const fallo = await ask(
      fakeRequest<number>(() => {
        throw roto;
      }),
    ).catch((error: unknown) => error);

    expect((fallo as Error).message).toMatch(/Falló una operación sobre la cola de eventos/);
    expect((fallo as Error).cause).toBe(roto);
  });

  it('`ask()` resuelve con el resultado de la petición', async () => {
    expect(await ask(fakeRequest(() => 42))).toBe(42);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 4 · `EventDatabase`: abrir la base de datos propia del bus
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('EventDatabase · apertura', () => {
  interface Created {
    store: string;
    keyPath: unknown;
    indexes: [string, string][];
  }

  /** El `indexedDB` global, de mentira. */
  class FakeIndexedDb {
    readonly opens: { name: string; version?: number }[] = [];
    readonly created: Created[] = [];
    readonly transactions: { store: string; mode: IDBTransactionMode }[] = [];
    readonly existing = new Set<string>();
    failWith: DOMException | null = null;

    open(name: string, version?: number): IDBOpenDBRequest {
      this.opens.push({ name, version });
      const request = {
        result: this.database(),
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      } as unknown as IDBOpenDBRequest;

      void Promise.resolve().then(() => {
        if (this.failWith !== null) {
          (request as { error: DOMException | null }).error = this.failWith;
          request.onerror?.call(request, new Event('error'));
          return;
        }
        request.onupgradeneeded?.call(
          request,
          new Event('upgradeneeded') as unknown as IDBVersionChangeEvent,
        );
        request.onsuccess?.call(request, new Event('success'));
      });

      return request;
    }

    private database(): IDBDatabase {
      return {
        objectStoreNames: { contains: (name: string) => this.existing.has(name) },
        createObjectStore: (name: string, options?: IDBObjectStoreParameters) => {
          this.existing.add(name);
          const record: Created = { store: name, keyPath: options?.keyPath, indexes: [] };
          this.created.push(record);
          return {
            createIndex: (indexName: string, keyPath: string) =>
              void record.indexes.push([indexName, keyPath]),
          } as unknown as IDBObjectStore;
        },
        transaction: (store: string, mode: IDBTransactionMode) => {
          this.transactions.push({ store, mode });
          return {
            objectStore: (name: string) =>
              ({
                name,
                index: (indexName: string) => ({ name: indexName }) as unknown as IDBIndex,
              }) as unknown as IDBObjectStore,
          } as unknown as IDBTransaction;
        },
      } as unknown as IDBDatabase;
    }
  }

  let idb: FakeIndexedDb;
  let database: EventDatabase;

  beforeEach(() => {
    idb = new FakeIndexedDb();
    vi.stubGlobal('indexedDB', idb);
    TestBed.configureTestingModule({ providers: [EventDatabase] });
    database = TestBed.inject(EventDatabase);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('abre SU base de datos, aparte de la de la aplicación', async () => {
    await database.store('readonly');

    expect(idb.opens).toEqual([{ name: 'clapastedyke_events', version: 1 }]);
  });

  it('crea el store de eventos con su clave y su índice de llegada', async () => {
    await database.store('readonly');

    expect(idb.created).toEqual([{ store: 'events', keyPath: 'id', indexes: [['seq', 'seq']] }]);
  });

  it('si el store ya existe, no lo vuelve a crear', async () => {
    idb.existing.add('events');

    await database.store('readonly');

    expect(idb.created).toEqual([]);
  });

  it('abre la conexión una sola vez y la reutiliza', async () => {
    await database.store('readonly');
    await database.store('readwrite');
    await database.byArrival('readonly');

    expect(idb.opens).toHaveLength(1);
  });

  it('cada operación va en su transacción, con el modo que se pidió', async () => {
    await database.store('readwrite');
    await database.store('readonly');

    expect(idb.transactions).toEqual([
      { store: 'events', mode: 'readwrite' },
      { store: 'events', mode: 'readonly' },
    ]);
  });

  it('`byArrival` devuelve el índice `seq`: es lo que hace que la cola sea FIFO', async () => {
    const index = await database.byArrival('readonly');

    expect(index.name).toBe('seq');
  });

  it('si no se puede abrir, el fallo sube con el `DOMException` como causa', async () => {
    idb.failWith = new DOMException('bloqueada', 'InvalidStateError');

    const fallo = await database.store('readonly').catch((error: unknown) => error);

    expect((fallo as Error).message).toMatch(/No se pudo abrir la cola de eventos/);
    expect((fallo as Error).cause).toBe(idb.failWith);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 5 · `PersistentEventBus`: los cuatro pasos, de punta a punta
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('PersistentEventBus · los cuatro pasos', () => {
  let bus: PersistentEventBus;
  let db: FakeEventDatabase;
  let log: LogSpy;

  beforeEach(() => {
    vi.useFakeTimers();
    ({ bus, db, log } = wireBus());
  });

  afterEach(() => {
    bus.stop();
    vi.useRealTimers();
  });

  // ── Paso 1 · publicar es GUARDAR ─────────────────────────────────────────────────

  it('CRITICAL: publicar guarda el evento y NO lo reparte todavía', async () => {
    const recibidos: string[] = [];
    bus.subscribe('a', 'RecipeSaved', () => void recibidos.push('a'));
    bus.start();

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);

    // `publish()` volvió con el evento en disco; el reparto es cosa de después.
    expect(db.rows.size).toBe(1);
    expect(recibidos).toEqual([]);
  });

  it('publicar una lista vacía no toca la cola', async () => {
    await bus.publish([]);

    expect(db.ops).toEqual([]);
  });

  it('guarda toda la ráfaga de un caso de uso, en orden', async () => {
    await bus.publish([
      domainEvent('SupplySaved', 'S-1'),
      domainEvent('RecipeSaved', 'R-1'),
      domainEvent('RecipeSaved', 'R-2'),
    ]);

    expect(db.ordered().map((row) => row.aggregateId)).toEqual(['S-1', 'R-1', 'R-2']);
  });

  // ── Paso 2 · leer y entregar ─────────────────────────────────────────────────────

  it('el evento llega a todos los suscriptores de ese nombre, y solo a ellos', async () => {
    const recibidos: string[] = [];
    bus.subscribe('a', 'RecipeSaved', () => void recibidos.push('a'));
    bus.subscribe('b', 'RecipeSaved', () => void recibidos.push('b'));
    bus.subscribe('c', 'SupplySaved', () => void recibidos.push('c'));

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await letItDeliver();

    expect(recibidos).toEqual(['a', 'b']);
  });

  it('reparte en orden de llegada', async () => {
    const recibidos: string[] = [];
    bus.subscribe('a', 'RecipeSaved', (event) => void recibidos.push(event.aggregateId));

    await bus.publish([
      domainEvent('RecipeSaved', 'R-1'),
      domainEvent('RecipeSaved', 'R-2'),
      domainEvent('RecipeSaved', 'R-3'),
    ]);
    bus.start();
    await letItDeliver();

    expect(recibidos).toEqual(['R-1', 'R-2', 'R-3']);
  });

  it('reparte también lo publicado con el reparto ya en marcha', async () => {
    const recibidos: string[] = [];
    bus.subscribe('a', 'RecipeSaved', (event) => void recibidos.push(event.aggregateId));
    bus.start();
    await letItDeliver();

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    await letItDeliver();

    expect(recibidos).toEqual(['R-1']);
    expect(db.rows.size).toBe(0);
  });

  it('el payload llega entero al suscriptor', async () => {
    const recibidos: DomainEvent[] = [];
    bus.subscribe('a', 'RecipeSaved', (event) => void recibidos.push(event));

    await bus.publish([domainEvent('RecipeSaved', 'R-1', { name: 'Bizcocho', lines: 3 })]);
    bus.start();
    await letItDeliver();

    expect(recibidos).toHaveLength(1);
    expect(recibidos[0].name).toBe('RecipeSaved');
    expect(recibidos[0].aggregateId).toBe('R-1');
    expect(recibidos[0].data).toEqual({ name: 'Bizcocho', lines: 3 });
  });

  it('todos reciben el MISMO objeto, y nadie puede alterarlo para el siguiente', async () => {
    const vistos: DomainEvent[] = [];
    bus.subscribe('a', 'RecipeSaved', (event) => {
      expect(() => {
        (event.data as Record<string, unknown>)['name'] = 'manipulado';
      }).toThrow();
      vistos.push(event);
    });
    bus.subscribe('b', 'RecipeSaved', (event) => void vistos.push(event));

    await bus.publish([domainEvent('RecipeSaved', 'R-1', { name: 'Bizcocho' })]);
    bus.start();
    await letItDeliver();

    expect(vistos[0]).toBe(vistos[1]);
    expect(vistos[0].data['name']).toBe('Bizcocho');
  });

  it('el evento llega con su hora original, no con la del reparto', async () => {
    const event = domainEvent('RecipeSaved', 'R-1');
    const horas: Date[] = [];
    bus.subscribe('a', 'RecipeSaved', (each) => void horas.push(each.occurredOn));

    await bus.publish([event]);
    bus.start();
    await vi.advanceTimersByTimeAsync(5000); // el reloj avanza; la hora del evento no
    await letItDeliver();

    expect(horas).toEqual([event.occurredOn]);
  });

  it('CRITICAL: nunca reparte de forma síncrona — el primer reparto cae tras el arranque', async () => {
    // Si repartiera al vuelo, un evento podría darse por entregado «a nadie» porque su suscriptor
    // todavía no se había registrado.
    bus.start();
    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);

    const recibidos: string[] = [];
    bus.subscribe('tarde', 'RecipeSaved', () => void recibidos.push('tarde'));
    await letItDeliver();

    expect(recibidos).toEqual(['tarde']);
  });

  it('parado, no reparte nada: la cola se queda esperando', async () => {
    const recibidos: string[] = [];
    bus.subscribe('a', 'RecipeSaved', () => void recibidos.push('a'));

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    await letItDeliver();

    expect(recibidos).toEqual([]);
    expect(db.rows.size).toBe(1);
  });

  it('`stop()` corta el reparto y lo pendiente sigue en la cola', async () => {
    bus.subscribe('a', 'RecipeSaved', () => undefined);
    bus.start();
    bus.stop();

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    await letItDeliver();

    expect(db.rows.size).toBe(1);
  });

  it('arrancar dos veces no duplica el reparto', async () => {
    const recibidos: string[] = [];
    bus.subscribe('a', 'RecipeSaved', () => void recibidos.push('a'));

    bus.start();
    bus.start();
    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    await letItDeliver();

    expect(recibidos).toEqual(['a']);
  });

  // ── Paso 3 · borrar cuando llegó a todos ─────────────────────────────────────────

  it('cuando llega a todos, el evento sale de la cola', async () => {
    bus.subscribe('a', 'RecipeSaved', () => undefined);
    bus.subscribe('b', 'RecipeSaved', () => undefined);

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await letItDeliver();

    expect(db.rows.size).toBe(0);
  });

  it('un evento que no escucha nadie se da por hecho y se borra (no atasca la cola)', async () => {
    const recibidos: string[] = [];
    bus.subscribe('a', 'RecipeSaved', () => void recibidos.push('a'));

    await bus.publish([domainEvent('NadieEscucha', 'X-1'), domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await letItDeliver();

    expect(db.rows.size).toBe(0);
    expect(recibidos).toEqual(['a']);
  });

  // ── Paso 4 · reintentar solo con los que faltan ──────────────────────────────────

  it('CRITICAL: si un suscriptor falla, se reintenta SOLO él', async () => {
    const bien: number[] = [];
    let intentos = 0;
    bus.subscribe('bien', 'RecipeSaved', () => void bien.push(1));
    bus.subscribe('mal', 'RecipeSaved', () => {
      intentos++;
      if (intentos < 3) {
        throw new Error('todavía no');
      }
    });

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await letItDeliver();

    expect(intentos).toBe(3);
    expect(bien).toEqual([1]); // al que ya le llegó no se le repite
    expect(db.rows.size).toBe(0);
  });

  it('mientras no llegue a todos, el evento sigue en la cola con quién lo tiene y cuántos intentos', async () => {
    bus.subscribe('bien', 'RecipeSaved', () => undefined);
    bus.subscribe('roto', 'RecipeSaved', () => {
      throw new Error('falla');
    });

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await vi.advanceTimersByTimeAsync(200);

    const pendiente = db.ordered()[0];
    expect(pendiente.delivered).toEqual(['bien']);
    expect(pendiente.attempts).toBeGreaterThan(0);
  });

  it('los intentos se acumulan mientras el suscriptor siga roto', async () => {
    bus.subscribe('roto', 'RecipeSaved', () => {
      throw new Error('falla siempre');
    });

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await vi.advanceTimersByTimeAsync(200);
    const primero = db.ordered()[0].attempts;
    await letItDeliver();

    expect(db.ordered()[0].attempts).toBeGreaterThan(primero);
  });

  it('un evento a medias no deja que le adelanten los que vienen detrás', async () => {
    const recibidos: string[] = [];
    let fallar = true;
    bus.subscribe('a', 'RecipeSaved', (event) => {
      if (event.aggregateId === 'R-1' && fallar) {
        throw new Error('atascado');
      }
      recibidos.push(event.aggregateId);
    });

    await bus.publish([domainEvent('RecipeSaved', 'R-1'), domainEvent('RecipeSaved', 'R-2')]);
    bus.start();
    await vi.advanceTimersByTimeAsync(200);

    expect(recibidos).toEqual([]); // R-2 no se cuela

    fallar = false;
    await letItDeliver();
    expect(recibidos).toEqual(['R-1', 'R-2']);
  });

  it('un fallo leyendo la cola no mata el repartidor: lo registra y reintenta al tick siguiente', async () => {
    const recibidos: string[] = [];
    bus.subscribe('a', 'RecipeSaved', () => void recibidos.push('a'));

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    db.failNextRead = new DOMException('lectura rota', 'UnknownError');
    bus.start();
    await letItDeliver();

    expect(log.from('eventbus/bus').filter((line) => line.level === 'error')).toHaveLength(1);
    expect(recibidos).toEqual(['a']); // el siguiente tick lo saca adelante
  });

  // ── La invariante dura: nunca dos a la vez ───────────────────────────────────────

  it('CRITICAL: cada evento termina entero antes de empezar el siguiente', async () => {
    const traza: string[] = [];
    let enVuelo = 0;

    bus.subscribe('lento', 'RecipeSaved', async (event) => {
      enVuelo++;
      expect(enVuelo).toBe(1); // si alguna vez hay dos, revienta aquí
      traza.push(`inicio:${event.aggregateId}`);
      await new Promise((resolve) => setTimeout(resolve, 50));
      traza.push(`fin:${event.aggregateId}`);
      enVuelo--;
    });

    await bus.publish([
      domainEvent('RecipeSaved', 'R-1'),
      domainEvent('RecipeSaved', 'R-2'),
      domainEvent('RecipeSaved', 'R-3'),
    ]);
    bus.start();
    await letItDeliver();

    expect(traza).toEqual([
      'inicio:R-1',
      'fin:R-1',
      'inicio:R-2',
      'fin:R-2',
      'inicio:R-3',
      'fin:R-3',
    ]);
  });

  it('los ticks que caen durante una tanda se descartan, no abren otra', async () => {
    let dentro = 0;
    let maximoSimultaneo = 0;

    bus.subscribe('lento', 'RecipeSaved', async () => {
      dentro++;
      maximoSimultaneo = Math.max(maximoSimultaneo, dentro);
      // Tarda MUCHO más que el tick: mientras corre, varios avisos llegan y se descartan.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      dentro--;
    });

    await bus.publish([domainEvent('RecipeSaved', 'R-1'), domainEvent('RecipeSaved', 'R-2')]);
    bus.start();
    await letItDeliver();

    expect(maximoSimultaneo).toBe(1);
    expect(db.rows.size).toBe(0);
  });

  it('parar y rearrancar a mitad de una tanda no abre una segunda', async () => {
    let dentro = 0;
    let maximoSimultaneo = 0;

    bus.subscribe('lento', 'RecipeSaved', async () => {
      dentro++;
      maximoSimultaneo = Math.max(maximoSimultaneo, dentro);
      await new Promise((resolve) => setTimeout(resolve, 500));
      dentro--;
    });

    await bus.publish([domainEvent('RecipeSaved', 'R-1'), domainEvent('RecipeSaved', 'R-2')]);
    bus.start();
    await vi.advanceTimersByTimeAsync(10); // la tanda ya está dentro del primer suscriptor

    bus.stop();
    bus.start(); // el candado es la promesa en vuelo, no el temporizador

    await letItDeliver();

    expect(maximoSimultaneo).toBe(1);
    expect(db.rows.size).toBe(0);
  });

  it('publicar varias veces seguidas no abre una tanda por publicación', async () => {
    let dentro = 0;
    let maximoSimultaneo = 0;
    bus.subscribe('lento', 'RecipeSaved', async () => {
      dentro++;
      maximoSimultaneo = Math.max(maximoSimultaneo, dentro);
      await new Promise((resolve) => setTimeout(resolve, 300));
      dentro--;
    });

    bus.start();
    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    await bus.publish([domainEvent('RecipeSaved', 'R-2')]);
    await bus.publish([domainEvent('RecipeSaved', 'R-3')]);
    await letItDeliver();

    expect(maximoSimultaneo).toBe(1);
    expect(db.rows.size).toBe(0);
  });

  // ── Durabilidad ──────────────────────────────────────────────────────────────────

  it('CRITICAL: lo que quedó a medias sobrevive a la recarga y otra sesión lo termina', async () => {
    bus.subscribe('a', 'RecipeSaved', () => {
      throw new Error('esta sesión no puede');
    });
    await bus.publish([domainEvent('RecipeSaved', 'R-1', { name: 'Bizcocho' })]);
    bus.start();
    await vi.advanceTimersByTimeAsync(200);
    bus.stop();

    expect(db.rows.size).toBe(1);

    // Nueva sesión: la misma cola (como el disco tras recargar) y un bus nuevo que sí funciona.
    const siguiente = wireBus(db);
    const recibidos: DomainEvent[] = [];
    siguiente.bus.subscribe('a', 'RecipeSaved', (event) => void recibidos.push(event));
    siguiente.bus.start();
    await letItDeliver();
    siguiente.bus.stop();

    expect(recibidos.map((event) => event.aggregateId)).toEqual(['R-1']);
    expect(recibidos[0].data).toEqual({ name: 'Bizcocho' }); // el payload también sobrevive
    expect(db.rows.size).toBe(0);
  });

  it('al suscriptor que ya lo había recibido NO se le repite tras la recarga', async () => {
    bus.subscribe('bien', 'RecipeSaved', () => undefined);
    bus.subscribe('roto', 'RecipeSaved', () => {
      throw new Error('esta sesión no puede');
    });
    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await vi.advanceTimersByTimeAsync(200);
    bus.stop();

    const siguiente = wireBus(db);
    const recibidos: string[] = [];
    siguiente.bus.subscribe('bien', 'RecipeSaved', () => void recibidos.push('bien'));
    siguiente.bus.subscribe('roto', 'RecipeSaved', () => void recibidos.push('roto'));
    siguiente.bus.start();
    await letItDeliver();
    siguiente.bus.stop();

    expect(recibidos).toEqual(['roto']);
  });

  // ── El rastro del bus ────────────────────────────────────────────────────────────

  it('registra qué se encoló, por nombre', async () => {
    await bus.publish([domainEvent('RecipeSaved', 'R-1'), domainEvent('SupplySaved', 'S-1')]);

    expect(log.from('eventbus/bus').at(-1)).toEqual({
      scope: 'eventbus/bus',
      level: 'debug',
      message: 'encolados',
      context: { names: ['RecipeSaved', 'SupplySaved'] },
    });
  });

  it('registra el arranque con su cadencia', () => {
    bus.start();

    expect(log.from('eventbus/bus')).toContainEqual({
      scope: 'eventbus/bus',
      level: 'debug',
      message: 'arrancado',
      context: { tickMs: 200 },
    });
  });

  it('registra que el evento salió de la cola, con su id', async () => {
    bus.subscribe('a', 'RecipeSaved', () => undefined);

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await letItDeliver();

    expect(log.from('eventbus/bus')).toContainEqual({
      scope: 'eventbus/bus',
      level: 'debug',
      message: 'entregado a todos, fuera de la cola',
      context: { id: 'RecipeSaved#000000000001' },
    });
  });

  it('registra el reintento con quién lo tiene ya y cuántos intentos lleva', async () => {
    bus.subscribe('bien', 'RecipeSaved', () => undefined);
    bus.subscribe('roto', 'RecipeSaved', () => {
      throw new Error('falla');
    });

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await vi.advanceTimersByTimeAsync(200);

    expect(log.from('eventbus/bus')).toContainEqual({
      scope: 'eventbus/bus',
      level: 'debug',
      message: 'reintentará en la siguiente tanda',
      context: {
        id: 'RecipeSaved#000000000001',
        delivered: ['bien'],
        attempts: 1,
      },
    });
  });

  it('un fallo del reparto se registra como `error`, con la causa en su ranura', async () => {
    const roto = new DOMException('lectura rota', 'UnknownError');
    // Se rompe DESPUÉS de publicar: la primera lectura de la cola es la del writer al retomar el
    // turno, y lo que se quiere reventar aquí es la del repartidor.
    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    db.failNextRead = roto;

    bus.start();
    await vi.advanceTimersByTimeAsync(200);

    const fallo = log.from('eventbus/bus').find((line) => line.level === 'error');
    expect(fallo?.message).toBe('El reparto de eventos ha fallado');
    expect((fallo?.cause as Error).cause).toBe(roto);
  });

  it('no registra nada al publicar una lista vacía', async () => {
    await bus.publish([]);

    expect(log.from('eventbus/bus')).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 6 · `@OnEvent` + `provideEventHandlers()`
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Lo que fue ejecutándose, en orden. */
const traza: string[] = [];
/** Cuántas veces se ha CONSTRUIDO cada caso de uso (no cuántas se ha ejecutado). */
const construidos: string[] = [];

@OnEvent(IntegrationEventName.RECIPE_SAVED)
@Injectable()
class QueueRecipe implements EventDrivenUseCase {
  constructor() {
    construidos.push('QueueRecipe');
  }

  async execute(event: DomainEvent): Promise<void> {
    traza.push(`queue:${event.aggregateId}:${String(event.data['name'])}`);
  }
}

@OnEvent(IntegrationEventName.RECIPE_SAVED)
@Injectable()
class TouchCatalog implements EventDrivenUseCase {
  async execute(event: DomainEvent): Promise<void> {
    traza.push(`touch:${event.name}`);
  }
}

@OnEvent(IntegrationEventName.SUPPLY_SAVED)
@Injectable()
class QueueSupply implements EventDrivenUseCase {
  async execute(event: DomainEvent): Promise<void> {
    traza.push(`supply:${event.aggregateId}`);
  }
}

@Injectable()
class SinDecorar implements EventDrivenUseCase {
  async execute(): Promise<void> {
    traza.push('sin-decorar'); // no debería llegar nunca
  }
}

@OnEvent(IntegrationEventName.RECIPE_SAVED)
@Injectable()
class Roto implements EventDrivenUseCase {
  async execute(): Promise<void> {
    throw new Error('reventó');
  }
}

describe('@OnEvent · declarar la reacción', () => {
  it('anota el evento en la propia clase', () => {
    expect(subscribedEventOf(QueueRecipe)).toBe(IntegrationEventName.RECIPE_SAVED);
    expect(subscribedEventOf(QueueSupply)).toBe(IntegrationEventName.SUPPLY_SAVED);
  });

  it('un caso de uso sin decorar no declara ningún evento', () => {
    expect(subscribedEventOf(SinDecorar)).toBeNull();
  });

  it('una subclase NO hereda la suscripción de su padre', () => {
    class HijaSinDecorar extends QueueRecipe {}

    expect(subscribedEventOf(HijaSinDecorar)).toBeNull();
  });

  it('CRITICAL: apilar el decorador LANZA, no añade una suscripción de más', () => {
    // En silencio, el segundo pisaría al primero y una suscripción desaparecería sin ruido. Un caso
    // de uso es UNA intención; si dos eventos deben provocar lo mismo, son dos casos de uso.
    expect(() => {
      @OnEvent(IntegrationEventName.SUPPLY_SAVED)
      @OnEvent(IntegrationEventName.RECIPE_SAVED)
      @Injectable()
      class DosEventos implements EventDrivenUseCase {
        async execute(): Promise<void> {
          throw new Error('no debería llegar a ejecutarse');
        }
      }
      return DosEventos;
    }).toThrow(/solo admite un evento/);
  });
});

describe('provideEventHandlers() · engancharla al bus', () => {
  let dispatcher: EventDispatcher;

  /** Monta los casos de uso con el MISMO provider que usa un contexto en su `provide*()`. */
  async function wire(...useCases: Type<EventDrivenUseCase>[]): Promise<void> {
    traza.length = 0;
    construidos.length = 0;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Logger, useValue: new LogSpy() },
        EventDispatcher,
        ...useCases,
        provideEventHandlers(...useCases),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    dispatcher = TestBed.inject(EventDispatcher);
  }

  it('el caso de uso se ejecuta cuando llega SU evento, con el evento entero', async () => {
    await wire(QueueRecipe);

    await dispatcher.deliver(
      domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1', { name: 'Bizcocho' }),
      [],
    );

    expect(traza).toEqual(['queue:R-1:Bizcocho']);
  });

  it('no se ejecuta con un evento que no declaró', async () => {
    await wire(QueueRecipe);

    await dispatcher.deliver(domainEvent(IntegrationEventName.SUPPLY_SAVED, 'S-1'), []);

    expect(traza).toEqual([]);
  });

  it('varios casos de uso sobre el mismo evento se ejecutan todos, en secuencia', async () => {
    await wire(QueueRecipe, TouchCatalog);

    const pendientes = await dispatcher.deliver(
      domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1'),
      [],
    );

    expect(traza).toEqual(['queue:R-1:undefined', 'touch:RecipeSaved']);
    expect(pendientes).toBeNull(); // cada uno cuenta como un suscriptor distinto
  });

  it('cada caso de uso escucha lo suyo, sin pisarse', async () => {
    await wire(QueueRecipe, QueueSupply);

    await dispatcher.deliver(domainEvent(IntegrationEventName.SUPPLY_SAVED, 'S-1'), []);
    await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1'), []);

    expect(traza).toEqual(['supply:S-1', 'queue:R-1:undefined']);
  });

  it('CRITICAL: se construye cuando llega su primer evento, no al arrancar', async () => {
    await wire(QueueRecipe);
    expect(construidos).toEqual([]);

    await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1'), []);
    await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-2'), []);

    expect(construidos).toEqual(['QueueRecipe']); // uno, no dos
  });

  it('la identidad ante el bus es el nombre de la clase', async () => {
    await wire(QueueRecipe, TouchCatalog);

    // `.name` y no el literal: Angular renombra la clase al aplicarle un decorador propio, y el id
    // de suscriptor es el nombre REAL en tiempo de ejecución.
    await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1'), [
      QueueRecipe.name,
    ]);

    expect(traza).toEqual(['touch:RecipeSaved']);
  });

  it('un caso de uso sin `@OnEvent` se ignora sin romper el arranque', async () => {
    await wire(QueueRecipe, SinDecorar);

    await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1'), []);

    expect(traza).toEqual(['queue:R-1:undefined']);
  });

  it('si el caso de uso lanza, el bus lo cuenta como entrega pendiente (se esperó su promesa)', async () => {
    await wire(Roto, TouchCatalog);

    // Descartar la promesa del caso de uso rompería la garantía: el fallo llega hasta aquí.
    expect(
      await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1'), []),
    ).toEqual([TouchCatalog.name]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 7 · `provideEventTracing()` / `TraceEvents`: el rastro de TODO lo que ocurre
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('TraceEvents · el diagnóstico', () => {
  let dispatcher: EventDispatcher;
  let log: LogSpy;

  async function wire(): Promise<void> {
    log = new LogSpy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: Logger, useValue: log }, EventDispatcher, provideEventTracing()],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    dispatcher = TestBed.inject(EventDispatcher);
  }

  it('CRITICAL: traza TODOS los nombres del Published Language, sin dejarse ninguno', async () => {
    // La garantía que importa: añadir un nombre al catálogo lo deja trazado solo. Si alguien lo
    // cambia por una lista escrita a mano, este test lo caza.
    await wire();
    const catalogo = Object.values(IntegrationEventName);
    expect(catalogo.length).toBeGreaterThan(0);

    for (const name of catalogo) {
      await dispatcher.deliver(domainEvent(name, 'A-1'), []);
    }

    expect(log.messages('events')).toEqual([...catalogo]);
  });

  it('cada evento se traza UNA sola vez, aunque escuche el catálogo entero', async () => {
    await wire();

    await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1'), []);

    expect(log.from('events')).toHaveLength(1);
  });

  it('traza en nivel `debug`: se ve con el modo depuración encendido, no siempre', async () => {
    await wire();

    await dispatcher.deliver(domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1'), []);

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
      scope: 'events',
      level: 'debug',
      message: 'RecipeCapacitySaved',
      context: {
        aggregateId: 'RC-1',
        occurredOn: event.occurredOn.toISOString(),
        data: { group: 'portions', label: '33', factor: 33 },
      },
    });
  });

  it('trazar no estorba: el suscriptor de verdad recibe igual', async () => {
    await wire();
    const recibidos: string[] = [];
    dispatcher.subscribe(
      'external-sync',
      IntegrationEventName.RECIPE_SAVED,
      () => void recibidos.push('external-sync'),
    );

    const pendientes = await dispatcher.deliver(
      domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1'),
      [],
    );

    expect(recibidos).toEqual(['external-sync']);
    expect(pendientes).toBeNull();
    expect(log.messages('events')).toEqual(['RecipeSaved']);
  });

  it('un evento que NO está en el catálogo no se traza (no es Published Language)', async () => {
    await wire();

    await dispatcher.deliver(domainEvent('InternoDeUnContexto', 'X-1'), []);

    expect(log.from('events')).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 8 · `provideEventBus()`: el cableado que usa la aplicación
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('provideEventBus() · cableado', () => {
  let db: FakeEventDatabase;
  let log: LogSpy;

  /** El cableado real de `app.config.ts`, con la cola falsa puesta por encima. */
  async function wireApp(...extra: Type<EventDrivenUseCase>[]): Promise<void> {
    traza.length = 0;
    construidos.length = 0;
    db = new FakeEventDatabase();
    log = new LogSpy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Logger, useValue: log },
        provideEventBus(),
        provideEventTracing(),
        ...extra,
        provideEventHandlers(...extra),
        // Va DESPUÉS de `provideEventBus()` a propósito: sustituye su `EventDatabase` real.
        { provide: EventDatabase, useValue: db as unknown as EventDatabase },
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    TestBed.inject(PersistentEventBus).stop();
    vi.useRealTimers();
  });

  it('el puerto `EventBus` resuelve al bus persistente, y es el MISMO objeto', async () => {
    await wireApp();

    expect(TestBed.inject(EventBus)).toBe(TestBed.inject(PersistentEventBus));
  });

  it('el app-initializer arranca el repartidor: publicar basta para que se reparta', async () => {
    await wireApp();
    const recibidos: string[] = [];
    TestBed.inject(EventBus).subscribe(
      'a',
      IntegrationEventName.RECIPE_SAVED,
      () => void recibidos.push('a'),
    );

    // Sin llamar a `start()` a mano en ningún sitio.
    await TestBed.inject(EventBus).publish([domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1')]);
    await letItDeliver();

    expect(recibidos).toEqual(['a']);
    expect(db.rows.size).toBe(0);
  });

  it('CRITICAL: de punta a punta — se publica, se traza, se ejecuta el caso de uso y se borra', async () => {
    await wireApp(QueueRecipe);

    await TestBed.inject(EventBus).publish([
      domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-1', { name: 'Bizcocho' }),
    ]);
    await letItDeliver();

    // 1 · el caso de uso reaccionó
    expect(traza).toEqual(['queue:R-1:Bizcocho']);
    // 2 · el trazador lo dejó escrito
    expect(log.messages('events')).toEqual(['RecipeSaved']);
    // 3 · el repartidor dejó constancia de a quién le llegó
    expect(log.messages('eventbus/dispatcher')).toContain(`RecipeSaved → ${QueueRecipe.name}`);
    // 4 · la cola quedó limpia
    expect(db.rows.size).toBe(0);
  });

  it('la cola de la sesión anterior se reparte al arrancar, sin publicar nada nuevo', async () => {
    await wireApp(QueueRecipe);

    // Se siembra la cola como si la hubiera dejado a medias la sesión previa. El repartidor YA está
    // arrancado, y aun así esto es seguro: nunca reparte de forma síncrona, así que hasta que el
    // reloj no avance no toca la cola.
    await TestBed.inject(EventWriter).append([
      domainEvent(IntegrationEventName.RECIPE_SAVED, 'R-9', { name: 'De ayer' }),
    ]);
    expect(traza).toEqual([]);

    await letItDeliver();

    expect(traza).toEqual(['queue:R-9:De ayer']);
    expect(db.rows.size).toBe(0);
  });
});
