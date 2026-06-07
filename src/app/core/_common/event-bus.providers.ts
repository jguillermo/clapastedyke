import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { EventBus } from './event-bus';
import { InMemoryEventBus } from './in-memory-event-bus';

/** Binds the shared EventBus port to its in-process implementation. */
export function provideEventBus(): EnvironmentProviders {
    return makeEnvironmentProviders([{ provide: EventBus, useClass: InMemoryEventBus }]);
}
