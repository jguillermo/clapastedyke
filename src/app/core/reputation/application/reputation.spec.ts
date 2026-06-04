import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEventBus } from '../../_common/application/event-bus';
import { EventBusToken } from '../../_common/core.tokens';
import {
  INFORMAL_ORDER_REPOSITORY,
  POPULARITY_REPOSITORY,
  SOCIAL_POST_REPOSITORY,
} from '../domain/repositories';
import {
  MemoryInformalOrderRepository,
  MemoryPopularityRepository,
  MemorySocialPostRepository,
} from '../infrastructure/memory-repositories';
import { POINTS_PER_POST, PublishProduction } from './publish-production/publish-production';
import { GetPopularity } from './get-popularity/get-popularity';
import { AttendInformalOrder } from './attend-informal-order/attend-informal-order';

describe('Reputation (Fase 2)', () => {
  let bus: InMemoryEventBus;
  let events: string[];

  beforeEach(() => {
    bus = new InMemoryEventBus();
    events = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: POPULARITY_REPOSITORY, useValue: new MemoryPopularityRepository() },
        { provide: SOCIAL_POST_REPOSITORY, useValue: new MemorySocialPostRepository() },
        { provide: INFORMAL_ORDER_REPOSITORY, useValue: new MemoryInformalOrderRepository() },
        { provide: EventBusToken, useValue: bus },
      ],
    });
    for (const name of ['ProductionPublished', 'PopularityUpdated', 'InformalOrderReceived']) {
      bus.subscribe(name, e => void events.push(e.name));
    }
  });

  it('publicar suma popularidad y emite ProductionPublished + PopularityUpdated', async () => {
    const publish = TestBed.inject(PublishProduction);
    const first = await publish.execute({ recipeId: 'RC-0001', recipeName: 'Galletas' });
    expect(first.points).toBe(POINTS_PER_POST);
    expect(events).toContain('ProductionPublished');
    expect(events).toContain('PopularityUpdated');

    const second = await publish.execute({ recipeId: 'RC-0001', recipeName: 'Galletas' });
    expect(second.points).toBe(POINTS_PER_POST * 2);
    expect((await TestBed.inject(GetPopularity).execute()).points).toBe(POINTS_PER_POST * 2);
  });

  it('atender un pedido informal emite InformalOrderReceived', async () => {
    await TestBed.inject(AttendInformalOrder).execute({ recipeName: 'Galletas' });
    expect(events).toContain('InformalOrderReceived');
  });
});
