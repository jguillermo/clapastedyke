import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { PROGRESS_REPOSITORY } from './domain/progress-repository';
import { IndexedDbProgressRepository } from './infrastructure/indexeddb-progress-repository';

export function provideProgression(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PROGRESS_REPOSITORY, useClass: IndexedDbProgressRepository },
  ]);
}
