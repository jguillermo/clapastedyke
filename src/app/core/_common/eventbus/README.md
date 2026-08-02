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

**Lo graba el agregado** al armarse en su `create(...)`; el caso de uso solo lo saca con
`pullEvents()` después de persistir y lo publica. La factoría del evento vive en el contexto que lo
publica (`core/<ctx>/domain/events/`), y el nombre en el catálogo compartido
(`core/_common/events/integration-events.ts`).

```typescript
// domain/entities/supply.ts — el agregado cuenta lo que le pasó, con su estado completo
const supply = new Supply({ id, name, baseUnit, usage, purchasePrice });
supply.recordEvent(RecipeBookEvents.supplySaved(id.value, supply.snapshot()));

// application/use-cases/save-supply.use-case.ts — el caso de uso solo saca y publica
await this.supplies.save(supply);
await this.bus.publish(supply.pullEvents());
```

Reglas del evento: **nombre en pasado**, `aggregateId` = el id del agregado que cambió (no se repite
dentro del payload), y `data` **solo con primitivos**, con el **estado completo** del agregado. Eso
convierte al payload en contrato público: quitar o cambiar un campo rompe a quien lo consuma. Si un
consumidor necesita algo que el evento no lleva, lo pide por un contrato de `core/_common/`; el
evento no crece para casos particulares.

La contrapartida es que la **rehidratación no graba**: todo agregado expone un `restore(data)` mudo,
y es el que usan mapeadores, seed y builders de test. Leer no es guardar — si el mapeador pasara por
`create`, cada lectura encolaría un evento falso aquí dentro.

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

**Un evento y solo uno por caso de uso.** El decorador **no se apila**: decorar dos veces lanza al
cargar el módulo. Un caso de uso es *una* intención, y escuchar dos hechos distintos con el mismo
código obliga a ramificar por `event.name` dentro — justo el `switch` que un caso de uso por evento
evita. Si dos eventos deben provocar lo mismo, se escriben dos casos de uso que llamen a lo mismo.

```typescript
@OnEvent(IntegrationEventName.RECIPE_SAVED)
@OnEvent(IntegrationEventName.SUPPLY_SAVED) // ← Error: RewardTheChef ya escucha "RecipeSaved"
@Injectable({ providedIn: 'root' })
export class RewardTheChef extends UseCase<DomainEvent, void> { … }
```

**El caso de uso se construye cuando llega su primer evento**, no al arrancar. Si el evento no llega
nunca, no se instancia nunca.

### 3. Suscribirse a mano

Para lo que **no es un caso de uso**: adaptadores con estado propio, agrupación (debounce) o que
reaccionan a **varios** eventos —que es justo lo que `@OnEvent` no permite—. Hoy lo usan
`external-sync/infrastructure/recipe-book-changed.subscriber.ts`, `auth-changed.subscriber.ts` y el
trazador (`provideEventTracing()`, ver abajo).

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

### 4. Ver qué eventos están ocurriendo (modo depuración)

Un evento sin suscriptor es **invisible**: se publica, se encola y se entrega a nadie, así que desde
fuera «no se publicó» y «no lo escucha nadie» se ven igual.

`provideEventTracing()` (ya está en `app.config.ts`) engancha `TraceEvents`, que registra **todos**
los nombres del catálogo según se reparten. Registra en nivel **`debug`**, así que se ve con
`"debug": true` en `public/config.json` (como viene en el repo).

Usando la app:

```
[events] SupplySaved                                { aggregateId: 'ing-manjar', occurredOn: '…', data: { … } }
[eventbus/dispatcher] SupplySaved → external-sync   { aggregateId: 'ing-manjar' }
[events] RecipeSaved                                { aggregateId: 'rec-bano-manjar', occurredOn: '…', data: { … } }
[eventbus/dispatcher] RecipeSaved no lo escucha nadie
```

**Son dos mitades y hay que mirar las dos**: `[events]` dice que se publicó; `[eventbus/dispatcher]`
dice a quién le llegó — o que no le llegó a nadie, que es justo el caso que antes era invisible.

Cómo leerlo:

| Lo que ves | Lo que significa |
|---|---|
| El evento **no** aparece en `[events]` | No se publicó: el caso de uso no llegó a guardar, o guardó otra cosa |
| Aparece, y después `no lo escucha nadie` | Se publicó pero falta el `@OnEvent` (o el suscriptor a mano) |
| Aparece un `→ suscriptor` y no pasa nada más | Le llegó: el problema está dentro del handler |
| Aparece un `error` de `[eventbus/dispatcher]` | El handler lanzó; el bus reintentará solo con los que faltan |

`TraceEvents` se suscribe sobre `Object.values(IntegrationEventName)` —un nombre nuevo queda trazado
solo— y por eso va a mano y no por `@OnEvent`, que solo admite un evento. Para apagarlo del todo,
quita `provideEventTracing()` de `app.config.ts`; en el build publicado ya está callado, porque
`debug` no se emite.

> El resto del registro va por la misma llave. Cómo funciona el puerto:
> [`../logger/README.md`](../logger/README.md). Qué hay que registrar y qué no:
> [`logging-conventions.md`](../../../../../.claude/rules/logging-conventions.md).

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

Tres specs, dentro del propio paquete:

- `persistent-event-bus.spec.ts` — los cuatro pasos, el orden, el objeto compartido, los reintentos
  por suscriptor y la supervivencia a un reinicio. Corre contra una **cola falsa declarada en el
  propio fichero**, no contra IndexedDB: lo que se verifica es el reparto, y eso no depende de dónde
  esté guardada la cola.
- `on-event.spec.ts` — el decorador: qué anota, que dispara el caso de uso, que **apilarlo lanza**,
  que una subclase no hereda la suscripción y que una excepción sube al bus.
- `trace-events.use-case.spec.ts` — que el trazador cubre el catálogo **entero** (si alguien lo
  cambia por una lista escrita a mano, falla) y qué deja en consola.

`EventDatabase`, `EventWriter` y `EventReader` no tienen test unitario: son CRUD de IndexedDB sin
lógica, y se ejercitan desde los E2E (ver
[`unit-tests-conventions.md`](../../../../../.claude/rules/unit-tests-conventions.md)).

---

## Añadir un evento nuevo

1. Añade el nombre a `core/_common/events/integration-events.ts` **si cruza la frontera** de un
   bounded context. Si es interno, déjalo en el `domain/events/` de su contexto.
2. Añade la factoría en `core/<ctx>/domain/events/<ctx>-events.ts`.
3. **Grábalo en el agregado**, en su `create(...)`; el caso de uso lo saca con `pullEvents()`
   **después** de persistir y lo publica.
4. Si alguien reacciona: `@OnEvent(nombre)` en un caso de uso +
   `provideEventHandlers(...)` en el `provide*()` de su contexto.
5. Compruébalo: usa la app con `ng serve` — si el nombre está en el catálogo del shared kernel, el
   trazador lo muestra **sin tocar nada más**.

> Los contextos **no se conocen entre sí**: quien reacciona toma el nombre del evento del shared
> kernel, nunca del contexto que lo publica. Regla completa en
> [`core-conventions.md`](../../../../../.claude/rules/core-conventions.md) → «Los contextos no se
> conocen entre sí».
