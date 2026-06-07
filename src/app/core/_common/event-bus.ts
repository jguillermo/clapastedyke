import { DomainEvent } from './domain-event';

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

/**
 * Port for publishing domain events to interested subscribers (in this or
 * other bounded contexts). The abstract contract lives in the shared kernel;
 * concrete transports are bound via providers.
 */
export abstract class EventBus {
    abstract publish(events: readonly DomainEvent[]): Promise<void>;
    abstract subscribe(eventName: string, handler: EventHandler): void;
}
