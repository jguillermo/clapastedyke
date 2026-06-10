import { DomainEvent } from './domain-event';

/**
 * Aggregate root that records the domain events it produces during its own
 * state transitions. The use case pulls and publishes them after persisting.
 * Use this base only for aggregates whose events emerge from internal logic
 * (e.g. PlayerProgress reconciling levels); aggregates whose events are simple
 * outcomes can let the use case build the event directly.
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
