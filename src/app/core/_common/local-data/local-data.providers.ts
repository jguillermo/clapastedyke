import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { IndexedDbLocalData } from '../infrastructure/indexeddb/indexeddb-local-data';
import { LocalData } from './local-data';

/**
 * Enlaza el borrado local con su adaptador de IndexedDB.
 *
 * Va **después de `provideEventBus()`** en `app.config.ts`: el adaptador necesita la base de datos
 * del bus para vaciar también la cola de eventos.
 */
export function provideLocalData(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: LocalData, useClass: IndexedDbLocalData }]);
}
