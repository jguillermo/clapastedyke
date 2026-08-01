import { Injectable, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomainEvent, domainEvent } from './domain-event';
import { EventDispatcher } from './event-dispatcher';
import { EventDrivenUseCase, OnEvent, subscribedEventOf } from './on-event';
import { provideTestLogger } from '../testing/logger-test-doubles';

const recibidos: string[] = [];

@OnEvent('RecipeSaved')
@Injectable()
class QueueRecipe implements EventDrivenUseCase {
  async execute(event: DomainEvent): Promise<void> {
    recibidos.push(`queue:${event.aggregateId}:${String(event.data['isNew'])}`);
  }
}

@OnEvent('RecipeSaved')
@Injectable()
class TouchCatalog implements EventDrivenUseCase {
  async execute(event: DomainEvent): Promise<void> {
    recibidos.push(`touch:${event.name}`);
  }
}

@Injectable()
class SinDecorar implements EventDrivenUseCase {
  async execute(): Promise<void> {
    // nunca debería llegar aquí
  }
}

describe('@OnEvent', () => {
  let dispatcher: EventDispatcher;

  /** Engancha los casos de uso igual que hace `provideEventHandlers`. */
  function wire(...useCases: Type<EventDrivenUseCase>[]): void {
    recibidos.length = 0;
    TestBed.configureTestingModule({
      providers: [...provideTestLogger(), EventDispatcher, ...useCases],
    });
    dispatcher = TestBed.inject(EventDispatcher);

    for (const useCase of useCases) {
      const eventName = subscribedEventOf(useCase);
      if (!eventName) {
        continue;
      }
      dispatcher.subscribe(useCase.name, eventName, async (event) => {
        await TestBed.inject(useCase).execute(event);
      });
    }
  }

  it('el decorador anota el evento en la clase', () => {
    expect(subscribedEventOf(QueueRecipe)).toBe('RecipeSaved');
  });

  it('un caso de uso decorado se ejecuta cuando llega su evento, con su data', async () => {
    wire(QueueRecipe);

    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1', { isNew: true }), []);

    expect(recibidos).toEqual(['queue:R-1:true']);
  });

  it('no se ejecuta con un evento que no declaró', async () => {
    wire(QueueRecipe);

    await dispatcher.deliver(domainEvent('SupplySaved', 'S-1'), []);

    expect(recibidos).toEqual([]);
  });

  it('un evento y solo uno: apilar el decorador es un error, no una suscripción de más', () => {
    // En silencio, el segundo pisaría al primero y una suscripción desaparecería sin ruido. Un caso
    // de uso es UNA intención; si dos eventos deben provocar lo mismo, son dos casos de uso.
    expect(() => {
      @OnEvent('SupplySaved')
      @OnEvent('RecipeSaved')
      @Injectable()
      class DosEventos implements EventDrivenUseCase {
        async execute(): Promise<void> {
          throw new Error('no debería llegar a ejecutarse');
        }
      }
      return DosEventos;
    }).toThrow(/solo admite un evento/);
  });

  it('varios casos de uso sobre el mismo evento se ejecutan todos, en secuencia', async () => {
    wire(QueueRecipe, TouchCatalog);

    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), []);

    expect(recibidos).toEqual(['queue:R-1:undefined', 'touch:RecipeSaved']);
  });

  it('cada caso de uso cuenta como un suscriptor distinto', async () => {
    wire(QueueRecipe, TouchCatalog);

    // `deliver` devuelve `null` solo si llegó a TODOS: con los dos enganchados, ambos corrieron.
    expect(await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), [])).toBeNull();
    expect(recibidos).toHaveLength(2);
  });

  it('a quien ya lo recibió no se le vuelve a entregar', async () => {
    wire(QueueRecipe, TouchCatalog);

    // `.name` y no el literal 'QueueRecipe': Angular renombra la clase al aplicarle un decorador
    // propio, y el id de suscriptor es el nombre REAL en tiempo de ejecución.
    await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), [QueueRecipe.name]);

    expect(recibidos).toEqual(['touch:RecipeSaved']);
  });

  it('un caso de uso sin decorar no declara ningún evento', () => {
    expect(subscribedEventOf(SinDecorar)).toBeNull();
  });

  it('una subclase no hereda la suscripción de su padre', () => {
    class HijaSinDecorar extends QueueRecipe {}

    expect(subscribedEventOf(HijaSinDecorar)).toBeNull();
  });

  it('si el caso de uso lanza, el fallo llega al bus como entrega pendiente', async () => {
    @OnEvent('RecipeSaved')
    @Injectable()
    class Roto implements EventDrivenUseCase {
      async execute(): Promise<void> {
        throw new Error('reventó');
      }
    }
    wire(Roto);

    // `deliver` devuelve quiénes lo tienen ya (nadie) en vez de `null`: el evento no se borra.
    expect(await dispatcher.deliver(domainEvent('RecipeSaved', 'R-1'), [])).toEqual([]);
  });
});
