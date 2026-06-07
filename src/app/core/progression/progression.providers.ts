import { EnvironmentProviders, makeEnvironmentProviders, provideAppInitializer, inject } from '@angular/core';
import { ProgressRepository } from './domain/repositories/progress.repository';
import { IndexedDbProgressRepository } from './infrastructure/indexeddb-progress.repository';
import { CakeComposedProgressSubscriber } from './infrastructure/cake-composed-progress.subscriber';

/**
 * Binds the progress repository to its IndexedDB implementation and registers
 * the downstream subscription to recipe-book's `CakeComposed` event at startup.
 */
export function provideProgression(): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: ProgressRepository, useClass: IndexedDbProgressRepository },
        provideAppInitializer(() => inject(CakeComposedProgressSubscriber).register()),
    ]);
}
