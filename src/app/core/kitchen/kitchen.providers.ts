import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { IdGeneratorToken } from '../_common/core.tokens';
import { PRODUCTION_REPOSITORY } from './domain/production/production-repository';
import { IndexedDbProductionRepository } from './infrastructure/indexeddb-production-repository';

export function provideKitchen(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PRODUCTION_REPOSITORY, useFactory: () => new IndexedDbProductionRepository(inject(IdGeneratorToken)) },
  ]);
}
