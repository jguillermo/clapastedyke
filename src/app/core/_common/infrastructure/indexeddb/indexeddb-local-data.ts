import { inject, Injectable } from '@angular/core';
import { EventDatabase } from '../../eventbus/event-database';
import { Logger } from '../../logger/logger';
import { LocalData } from '../../local-data/local-data';
import { clearAllStores } from './database';

/**
 * El borrado local sobre IndexedDB: las **dos** bases de datos del navegador.
 *
 * Son dos y no una porque el bus de eventos tiene la suya propia (ver {@link EventDatabase}), y las
 * dos guardan cosas de la persona que estaba usando la app: la de la aplicación, sus datos; la del
 * bus, hechos suyos todavía sin repartir. Dejar una de las dos sería dejar el rastro entero de la
 * mitad del sistema.
 *
 * Se vacían los stores en vez de borrar las bases: `deleteDatabase()` se bloquea mientras la propia
 * pestaña tenga la conexión abierta. El detalle está en {@link clearAllStores}.
 */
@Injectable()
export class IndexedDbLocalData extends LocalData {
  private readonly events = inject(EventDatabase);
  private readonly log = inject(Logger).scoped('local-data/indexeddb');

  async wipe(): Promise<void> {
    await clearAllStores();
    await this.events.clear();
    this.log.debug('almacenamiento local vaciado (datos y cola de eventos)');
  }
}
