import { Injectable } from '@angular/core';
import { DomainEvent } from './domain-event';
import { EventBus, EventHandler } from './event-bus';

/**
 * In-process event bus: synchronous publish/subscribe within the renderer.
 * A failing handler is isolated so it never blocks the others.
 */
@Injectable()
export class InMemoryEventBus extends EventBus {
    private readonly handlers = new Map<string, EventHandler[]>();

    subscribe(eventName: string, handler: EventHandler): void {
        const list = this.handlers.get(eventName) ?? [];
        list.push(handler);
        this.handlers.set(eventName, list);
    }

    async publish(events: readonly DomainEvent[]): Promise<void> {
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
