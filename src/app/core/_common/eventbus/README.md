# EventBus (`@core/_common/eventbus`)

Bus de eventos de dominio con **cola durable**. Publicar es **guardar**; el reparto lo hace después
un proceso aparte, con un temporizador, y se garantiza que cada evento llegue a **todos** sus
suscriptores antes de borrarlo.

Es un paquete **autocontenido**: no importa nada del resto del proyecto (solo Angular) y tiene su
**propia base de datos** IndexedDB. Se puede llevar tal cual a otro sitio.

---

## Los cuatro pasos

No hay más lógica que esta:

```
 1. publish()  →  writer.append()        guardar el evento en la base de datos
 2. tick       →  reader.next()          leer el siguiente (el más antiguo)
                  dispatcher.deliver()   enviarlo a todos sus suscriptores
 3. ¿llegó a todos?  →  writer.remove()  borrarlo
 4. ¿alguno falló?   →  writer.update()  anotar a quién le llegó y reintentar en el siguiente tick
```

```
 Caso de uso                                    ┌─► suscriptor A  ✔
     │                                          │
     │ await publish()   ┌───────────┐  tick    │
     └──────────────────►│  cola en  │─────────►├─► suscriptor B  ✘
       (vuelve enseguida)│   disco   │◄─────────┘   (se reintenta solo B)
                         └───────────┘  anotar
```

**Publicar no reparte.** `publish()` vuelve cuando el evento está en disco, no cuando lo han
recibido los suscriptores. Por eso el caso de uso que guarda una receta no paga el precio de sus
suscriptores, y un cierre del navegador entre publicar y repartir no se traga el evento.

---

## Las piezas

| Fichero | Clase | Qué hace | ¿Toca la BD? |
|---|---|---|---|
| `event-bus.ts` | `EventBus` | El **puerto**: lo único que la app conoce | — |
| `domain-event.ts` | — | `DomainEvent`, `domainEvent()`, `restoreEvent()` | — |
| `event-database.ts` | `EventDatabase` | Abre IndexedDB y da acceso al store. Nada más | es la BD |
| `event-writer.ts` | `EventWriter` | Guardar (1), anotar el progreso (4) y borrar (3) | sí |
| `event-reader.ts` | `EventReader` | Leer el siguiente pendiente (2) | sí |
| `event-dispatcher.ts` | `EventDispatcher` | Enviar el evento a todos sus suscriptores (2) | **no** |
| `persistent-event-bus.ts` | `PersistentEventBus` | Encadena los cuatro pasos y lleva el temporizador | no |
| `on-event.ts` | — | El decorador `@OnEvent` y su lectura | no |
| `event-bus.providers.ts` | — | `provideEventBus()` y `provideEventHandlers()` | no |

`EventDispatcher` es la única pieza con lógica de verdad y **no toca la base de datos**: recibe el
evento y quién lo tiene ya, y devuelve quién lo tiene después. Por eso se prueba entera sin
IndexedDB.

**Base de datos propia:** `clapastedyke_events` (store `events`, índice `seq`), aparte de la de la
aplicación. Un cambio en los agregados no obliga a subir la versión de la cola, ni al revés.

---

## Cómo se usa

### 1. Publicar un evento

Desde el **caso de uso**, después de persistir. La factoría del evento vive en el contexto que lo
publica (`core/<ctx>/domain/events/`), y el nombre en el catálogo compartido
(`core/_common/events/integration-events.ts`).

```typescript
@Injectable({ providedIn: 'root' })
export class SaveSupply extends UseCase<SaveSupplyRequest, { id: string }> {
  private readonly supplies = inject(SupplyRepository);
  private readonly bus = inject(EventBus);

  async execute(request: SaveSupplyRequest): Promise<{ id: string }> {
    // …
    await this.supplies.save(supply);
    await this.bus.publish([RecipeBookEvents.supplySaved(supply.id.value, !existing)]);
    return { id: supply.id.value };
  }
}
```

Reglas del evento: **nombre en pasado**, `aggregateId` = el id del agregado que cambió, y `data`
**solo con primitivos** y lo mínimo. Quien reacciona no debe poder reconstruir tu modelo a partir
del evento; si necesita datos, los pide por un contrato de `core/_common/`.

### 2. Reaccionar a un evento — un caso de uso con `@OnEvent`

Es la forma normal de que un evento dispare trabajo. El decorador recibe **solo el nombre del
evento**, y el caso de uso recibe **el evento entero**: su `data`, el `aggregateId` de lo que cambió
y la hora en que ocurrió.

```typescript
import { DomainEvent } from '@core/_common/eventbus/domain-event';
import { OnEvent } from '@core/_common/eventbus/on-event';

@OnEvent(IntegrationEventName.RECIPE_SAVED)
@Injectable({ providedIn: 'root' })
export class QueueRecipeForSync extends UseCase<DomainEvent, void> {
  private readonly outbox = inject(SyncOutbox);

  async execute(event: DomainEvent): Promise<void> {
    await this.outbox.enqueue(SyncItem.of('recipe', event.aggregateId));
  }
}
```

Y se declara en el `provide*()` del contexto que lo posee:

```typescript
export function provideRecipeBook(): EnvironmentProviders {
  return makeEnvironmentProviders([
    // …bindings del contexto
    provideEventHandlers(QueueRecipeForSync),
  ]);
}
```

El decorador se puede **apilar** para escuchar varios eventos con el mismo caso de uso:

```typescript
@OnEvent(IntegrationEventName.RECIPE_SAVED)
@OnEvent(IntegrationEventName.SUPPLY_SAVED)
@Injectable({ providedIn: 'root' })
export class RewardTheChef extends UseCase<DomainEvent, void> { … }
```

**El caso de uso se construye cuando llega su primer evento**, no al arrancar. Si el evento no llega
nunca, no se instancia nunca.

### 3. Suscribirse a mano

Para lo que **no es un caso de uso**: adaptadores con estado propio, agrupación (debounce) o que
reaccionan a varios eventos con lógica distinta. Hoy lo usan
`external-sync/infrastructure/recipe-book-changed.subscriber.ts` y `auth-changed.subscriber.ts`.

```typescript
@Injectable({ providedIn: 'root' })
export class RecipeBookChangedSubscriber {
  private readonly bus = inject(EventBus);

  register(): void {
    this.bus.subscribe(SUBSCRIBER, IntegrationEventName.RECIPE_SAVED, (event) =>
      this.queue('recipe', event.aggregateId),
    );
  }
}

// en el *.providers.ts del contexto
provideAppInitializer(() => inject(RecipeBookChangedSubscriber).register()),
```

---

## Qué garantiza

| Garantía | Cómo |
|---|---|
| **Nada se pierde** entre publicar y repartir | El evento está en disco antes de que `publish()` devuelva el control |
| **Llega a cada suscriptor**, aunque falle | Se anota `delivered[]`; el reintento va solo a los que faltan |
| **A nadie dos veces** en el mismo evento | Quien ya está en `delivered[]` se salta |
| **Todos reciben el mismo objeto** | Se reconstruye una vez por reparto y se entrega **congelado** |
| **Con su hora original** | `restoreEvent()` no re-sella `occurredOn` |
| **En orden de llegada** | El índice `seq` de la cola |
| **Un suscriptor roto no arrastra a los demás** | Cada entrega va aislada en su `try` |

**Entrega «al menos una vez».** Un evento puede repartirse después de una recarga si el proceso
murió a medias, y un reintento puede repetir una entrega que en realidad sí llegó. **Los manejadores
tienen que ser idempotentes.**

---

## Reglas que muerden

**La identidad de un manejador es el nombre de su clase.** Es la clave con la que el bus anota quién
ha recibido ya cada evento. No hay que hacer nada para que sean únicas: el bundler obliga a que los
identificadores de nivel superior lo sean dentro de un bundle, así que dos clases que en el fuente se
llamen igual acaban con nombres distintos. Consecuencia práctica: **renombrar la clase** de un
manejador equivale a estrenar suscriptor — un evento que estuviera a medias de repartirse se le
volvería a entregar. Es el mismo «al menos una vez» de siempre.

**El decorador solo anota; no suscribe al importarse.** Un caso de uso que nadie inyecta lo elimina
el bundler y no se engancharía nunca. Por eso hay que listarlo en `provideEventHandlers(...)`.

**NUNCA dos eventos a la vez.** Es la invariante dura. El tick (200 ms) **no reparte: solo avisa** de
que puede haber trabajo. Quien reparte es `pump()`, que es de **un solo vuelo**: si ya hay una tanda
viva, el aviso se descarta. Tres candados encadenados:

| Nivel | Qué garantiza |
|---|---|
| `pump()` | Una sola tanda a la vez, incluso si se hace `stop()`/`start()` a mitad — el candado es la promesa en vuelo, no el temporizador |
| `drain()` | Un evento entero (éxito o error) antes de tocar el siguiente |
| `deliver()` | Un suscriptor tras otro, esperando a cada uno |

Un manejador lento no se «adelanta»: la tanda tarda lo que tarde y los ticks que caigan mientras se
descartan.

**El repartidor nunca reparte de forma síncrona.** Ni la tanda programada ni el empujón de `publish()`
—que pasa por un `setTimeout(0)`—. Así el primer reparto cae siempre después del arranque, con todos
los suscriptores registrados; si no, un evento podría darse por entregado «a nadie» porque su
suscriptor aún no existía.

**Un evento puede llegar tras una recarga.** El bus reparte, no interpreta. Un suscriptor cuya
reacción solo tenga sentido dentro de la sesión que publicó el evento debe comprobarlo él mismo:
`AuthChangedSubscriber` descarta los eventos anteriores a su propio registro, porque vaciar la cola
de sincronización por un inicio de sesión viejo se llevaría cambios reales por delante.

**Un suscriptor que falla siempre detiene la cola.** Los reintentos no tienen tope y el evento a
medias se queda a la cabeza, así que nadie lo adelanta. Es lo correcto para el orden, pero significa
que un manejador roto bloquea todo el reparto. Se arregla con un campo más (`parked`: saltarlo tras
N intentos, sin borrarlo) el día que haga falta.

---

## Qué hay en disco

Un registro por evento pendiente, en el store `events`:

| Campo | Ejemplo | Para qué |
|---|---|---|
| `id` | `RecipeSaved#000000000042` | Clave: nombre + turno, para que dos del mismo nombre no se pisen |
| `name` | `RecipeSaved` | A qué suscriptores toca entregarlo |
| `aggregateId` | `R-7` | Qué cambió |
| `at` | `1753934112000` | Cuándo ocurrió (epoch ms). Se entrega con su hora original |
| `data` | `{ isNew: true }` | Payload de primitivos |
| `seq` | `42` | **El índice del store.** Es lo que ordena la cola |
| `delivered` | `["recipe-book:queue-recipe"]` | Quién lo tiene ya. La garantía vive aquí |
| `attempts` | `2` | Entregas fallidas acumuladas |

La cola está vacía casi siempre: se llena en ráfagas de unos pocos eventos y se vacía en el
siguiente tick. Si ves registros acumulados, hay un suscriptor fallando.

---

## Tests

Dos specs, dentro del propio paquete:

- `persistent-event-bus.spec.ts` — los cuatro pasos, el orden, el objeto compartido, los reintentos
  por suscriptor y la supervivencia a un reinicio. Corre contra una **cola falsa declarada en el
  propio fichero**, no contra IndexedDB: lo que se verifica es el reparto, y eso no depende de dónde
  esté guardada la cola.
- `on-event.spec.ts` — el decorador: qué anota, que dispara el caso de uso, que se puede apilar, que
  una subclase no hereda suscripciones y que una excepción sube al bus.

`EventDatabase`, `EventWriter` y `EventReader` no tienen test unitario: son CRUD de IndexedDB sin
lógica, y se ejercitan desde los E2E (ver
[`unit-tests-conventions.md`](../../../../../.claude/rules/unit-tests-conventions.md)).

---

## Añadir un evento nuevo

1. Añade el nombre a `core/_common/events/integration-events.ts` **si cruza la frontera** de un
   bounded context. Si es interno, déjalo en el `domain/events/` de su contexto.
2. Añade la factoría en `core/<ctx>/domain/events/<ctx>-events.ts`.
3. Publícalo desde el caso de uso, **después** de persistir.
4. Si alguien reacciona: `@OnEvent(nombre)` en un caso de uso +
   `provideEventHandlers(...)` en el `provide*()` de su contexto.

> Los contextos **no se conocen entre sí**: quien reacciona toma el nombre del evento del shared
> kernel, nunca del contexto que lo publica. Regla completa en
> [`core-conventions.md`](../../../../../.claude/rules/core-conventions.md) → «Los contextos no se
> conocen entre sí».
