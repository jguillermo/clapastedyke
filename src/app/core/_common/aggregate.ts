import { DomainEvent } from './eventbus/domain-event';

/**
 * Aggregate root that records the domain events it produces. The event belongs to the aggregate —
 * "this recipe was saved" is its own fact — so the aggregate records it in its `create(...)` factory
 * and the use case only pulls the queue with `pullEvents()` after persisting, and publishes it.
 *
 * The counterpart is mandatory: every aggregate also exposes a `restore(data)` that rebuilds it
 * **without** recording anything. Mappers, the seed and test builders go through `restore` — reading
 * is not saving, and going through `create` would queue a spurious event on every read.
 */
export abstract class AggregateRoot {
  private events: DomainEvent[] = [];

  protected recordEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  /** Returns pending events and clears the queue (published exactly once). */
  pullEvents(): DomainEvent[] {
    const pending = this.events;
    this.events = [];
    return pending;
  }
}
