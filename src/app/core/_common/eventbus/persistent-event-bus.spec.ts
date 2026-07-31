import { TestBed } from '@angular/core/testing';
import { domainEvent } from './domain-event';
import { QueuedEvent } from './event-database';
import { EventDispatcher } from './event-dispatcher';
import { EventReader } from './event-reader';
import { EventWriter } from './event-writer';
import { PersistentEventBus } from './persistent-event-bus';

/**
 * La cola de mentira: lo mismo que hacen `EventWriter` y `EventReader` sobre IndexedDB, pero en un
 * array. Vive aquí y no en un fichero aparte porque solo la usa este test — el paquete no lleva más
 * clases de las que necesita para funcionar.
 */
class FakeQueue {
  readonly records: QueuedEvent[] = [];
  private seq = 0;

  append = async (events: readonly ReturnType<typeof domainEvent>[]): Promise<void> => {
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

describe('PersistentEventBus', () => {
  let bus: PersistentEventBus;
  let queue: FakeQueue;

  /** Deja correr al repartidor: agota temporizadores y las promesas que encadenan. */
  async function deliver(): Promise<void> {
    for (let round = 0; round < 20; round++) {
      await vi.advanceTimersByTimeAsync(200);
    }
  }

  function build(): void {
    queue = new FakeQueue();
    TestBed.configureTestingModule({
      providers: [
        EventDispatcher,
        PersistentEventBus,
        { provide: EventWriter, useValue: queue as unknown as EventWriter },
        { provide: EventReader, useValue: queue as unknown as EventReader },
      ],
    });
    bus = TestBed.inject(PersistentEventBus);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    build();
  });

  afterEach(() => {
    bus.stop();
    vi.useRealTimers();
  });

  // ── Paso 1: guardar ────────────────────────────────────────────────────────────

  it('publicar guarda el evento y NO lo reparte todavía', async () => {
    const recibidos: string[] = [];
    bus.subscribe('a', 'RecipeSaved', (event) => void recibidos.push(event.aggregateId));

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);

    expect(queue.records).toHaveLength(1);
    expect(recibidos).toEqual([]);
  });

  // ── Paso 2: leer y entregar a todos ────────────────────────────────────────────

  it('el evento llega a todos los suscriptores de ese nombre, y solo a ellos', async () => {
    const recibidos: string[] = [];
    bus.subscribe('a', 'RecipeSaved', () => void recibidos.push('a'));
    bus.subscribe('b', 'RecipeSaved', () => void recibidos.push('b'));
    bus.subscribe('c', 'SupplySaved', () => void recibidos.push('c'));

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await deliver();

    expect(recibidos.sort()).toEqual(['a', 'b']);
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
    await deliver();

    expect(recibidos).toEqual(['R-1', 'R-2', 'R-3']);
  });

  it('todos reciben el MISMO objeto, y nadie puede alterarlo para el siguiente', async () => {
    const vistos: unknown[] = [];
    bus.subscribe('a', 'RecipeSaved', (event) => {
      expect(() => {
        (event.data as Record<string, unknown>)['isNew'] = 'manipulado';
      }).toThrow();
      vistos.push(event);
    });
    bus.subscribe('b', 'RecipeSaved', (event) => void vistos.push(event));

    await bus.publish([domainEvent('RecipeSaved', 'R-1', { isNew: true })]);
    bus.start();
    await deliver();

    expect(vistos[0]).toBe(vistos[1]);
    expect((vistos[0] as { data: Record<string, unknown> }).data['isNew']).toBe(true);
  });

  it('el evento llega con su hora original, no con la del reparto', async () => {
    const event = domainEvent('RecipeSaved', 'R-1');
    let recibido: Date | null = null;
    bus.subscribe('a', 'RecipeSaved', (each) => void (recibido = each.occurredOn));

    await bus.publish([event]);
    bus.start();
    await deliver();

    expect(recibido).toEqual(event.occurredOn);
  });

  // ── Paso 3: borrar cuando llegó a todos ────────────────────────────────────────

  it('cuando llega a todos, el evento se borra de la cola', async () => {
    bus.subscribe('a', 'RecipeSaved', () => undefined);
    bus.subscribe('b', 'RecipeSaved', () => undefined);

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await deliver();

    expect(queue.records).toEqual([]);
  });

  it('un evento sin suscriptores se da por hecho y se borra', async () => {
    await bus.publish([domainEvent('NadieEscucha', 'X-1')]);
    bus.start();
    await deliver();

    expect(queue.records).toEqual([]);
  });

  // ── Paso 4: reintentos ─────────────────────────────────────────────────────────

  it('si un suscriptor falla, se reintenta SOLO él: al que ya le llegó no se le repite', async () => {
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
    await deliver();

    expect(intentos).toBe(3);
    expect(bien).toEqual([1]);
    expect(queue.records).toEqual([]);
  });

  it('mientras no llegue a todos, el evento sigue en la cola y cuenta el intento', async () => {
    bus.subscribe('roto', 'RecipeSaved', () => {
      throw new Error('falla');
    });

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await vi.advanceTimersByTimeAsync(200);

    expect(queue.records).toHaveLength(1);
    expect(queue.records[0].attempts).toBeGreaterThan(0);
  });

  it('un evento a medias no adelanta a los que vienen detrás', async () => {
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

    expect(recibidos).toEqual([]);

    fallar = false;
    await deliver();
    expect(recibidos).toEqual(['R-1', 'R-2']);
  });

  // ── La invariante: nunca dos a la vez ──────────────────────────────────────────

  it('nunca procesa dos eventos en paralelo: cada uno termina antes de empezar el siguiente', async () => {
    const traza: string[] = [];
    let enVuelo = 0;

    bus.subscribe('lento', 'RecipeSaved', async (event) => {
      enVuelo++;
      expect(enVuelo).toBe(1); // ← si alguna vez hay dos, revienta aquí
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
    await deliver();

    expect(traza).toEqual([
      'inicio:R-1',
      'fin:R-1',
      'inicio:R-2',
      'fin:R-2',
      'inicio:R-3',
      'fin:R-3',
    ]);
  });

  it('los ticks que llegan durante una tanda se descartan, no abren otra', async () => {
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
    await deliver();

    expect(maximoSimultaneo).toBe(1);
    expect(queue.records).toEqual([]);
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
    bus.start(); // ← el candado es la promesa en vuelo, no el temporizador

    await deliver();

    expect(maximoSimultaneo).toBe(1);
    expect(queue.records).toEqual([]);
  });

  // ── Durabilidad ────────────────────────────────────────────────────────────────

  it('lo que quedó a medias sobrevive: otro bus sobre la misma cola lo termina', async () => {
    bus.subscribe('a', 'RecipeSaved', () => {
      throw new Error('esta sesión no puede');
    });
    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await vi.advanceTimersByTimeAsync(200);
    bus.stop();

    expect(queue.records).toHaveLength(1);

    // Nueva sesión: la misma cola (como el disco tras recargar) y un bus nuevo que sí funciona.
    const survivingQueue = queue;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        EventDispatcher,
        PersistentEventBus,
        { provide: EventWriter, useValue: survivingQueue as unknown as EventWriter },
        { provide: EventReader, useValue: survivingQueue as unknown as EventReader },
      ],
    });
    const reborn = TestBed.inject(PersistentEventBus);
    const recibidos: string[] = [];
    reborn.subscribe('a', 'RecipeSaved', (event) => void recibidos.push(event.aggregateId));
    reborn.start();
    await deliver();
    reborn.stop();

    expect(recibidos).toEqual(['R-1']);
    expect(survivingQueue.records).toEqual([]);
  });

  // ── Suscripción ────────────────────────────────────────────────────────────────

  it('dos suscripciones con el mismo id al mismo evento son una: la última gana', async () => {
    const recibidos: string[] = [];
    bus.subscribe('a', 'RecipeSaved', () => void recibidos.push('vieja'));
    bus.subscribe('a', 'RecipeSaved', () => void recibidos.push('nueva'));

    await bus.publish([domainEvent('RecipeSaved', 'R-1')]);
    bus.start();
    await deliver();

    expect(recibidos).toEqual(['nueva']);
  });
});
