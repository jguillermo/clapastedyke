import { DomainEvent } from './domain-event';

/**
 * Aggregate root: protects its invariants and records the domain events it
 * produces. The use case pulls and publishes them after persisting.
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
