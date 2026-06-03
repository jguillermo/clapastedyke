import { DomainEvent } from '../domain/domain-event';

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

/**
 * Domain event bus port. Use cases publish the events they pull from
 * aggregates AFTER persisting them.
 */
export interface EventBus {
  publish(events: DomainEvent[]): Promise<void>;
  subscribe(eventName: string, handler: EventHandler): void;
}

/**
 * Synchronous in-memory bus — enough for a single process (the browser).
 * A failing handler does not break the others: the error is logged.
 */
export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  subscribe(eventName: string, handler: EventHandler): void {
    const list = this.handlers.get(eventName) ?? [];
    list.push(handler);
    this.handlers.set(eventName, list);
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      for (const handler of this.handlers.get(event.name) ?? []) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Handler for ${event.name} failed:`, error);
        }
      }
    }
  }
}
