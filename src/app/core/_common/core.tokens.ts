import { InjectionToken } from '@angular/core';
import { InMemoryEventBus } from './application/event-bus';
import { IndexedDbIdGenerator } from './infrastructure/indexeddb/indexeddb-id-generator';

export const EventBusToken = new InjectionToken<InMemoryEventBus>('EventBus', {
  providedIn: 'root',
  factory: () => new InMemoryEventBus(),
});

export const IdGeneratorToken = new InjectionToken<IndexedDbIdGenerator>('IdGenerator', {
  providedIn: 'root',
  factory: () => new IndexedDbIdGenerator(),
});
