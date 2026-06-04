import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { IdGeneratorToken } from '../_common/core.tokens';
import {
  INFORMAL_ORDER_REPOSITORY,
  POPULARITY_REPOSITORY,
  SOCIAL_POST_REPOSITORY,
} from './domain/repositories';
import {
  IndexedDbInformalOrderRepository,
  IndexedDbPopularityRepository,
  IndexedDbSocialPostRepository,
} from './infrastructure/indexeddb-repositories';

export function provideReputation(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: POPULARITY_REPOSITORY, useClass: IndexedDbPopularityRepository },
    { provide: SOCIAL_POST_REPOSITORY, useFactory: () => new IndexedDbSocialPostRepository(inject(IdGeneratorToken)) },
    { provide: INFORMAL_ORDER_REPOSITORY, useFactory: () => new IndexedDbInformalOrderRepository(inject(IdGeneratorToken)) },
  ]);
}
