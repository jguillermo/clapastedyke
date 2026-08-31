import { inject, Injectable } from '@angular/core';
import { IndexedDbStore } from '@core/_common/infrastructure/indexeddb/store';
import { Logger } from '@core/_common/logger/logger';
import { SessionTokenRepository } from '../domain/repositories/session-token.repository';

/** Documento plano. Clave fija: solo hay una sesión por navegador. */
interface SessionTokenRecord {
  id: string;
  token?: string;
}

const RECORD_ID = 'session';

/**
 * El identificador de sesión, en IndexedDB.
 *
 * Va aquí y no en `localStorage` por una razón concreta: `SignOut` borra esta base entera
 * (`LocalData.wipe()`), así que cerrar sesión se lo lleva por delante sin que nadie tenga que
 * acordarse. En `localStorage` un identificador muerto sobreviviría al cierre de sesión.
 *
 * Legado: un registro sin `token` es de una versión anterior y **se ignora** — la app arranca sin
 * sesión reanudable y, si la cookie tampoco llega, el usuario conecta a mano.
 */
@Injectable()
export class IndexedDbSessionTokenRepository extends SessionTokenRepository {
  private readonly store = new IndexedDbStore<SessionTokenRecord>('auth_session_token');
  private readonly log = inject(Logger).scoped('auth/session-token-repo');

  async read(): Promise<string | null> {
    const record = await this.store.get(RECORD_ID);
    const token = record?.token;
    // Un booleano, nunca el valor: es lo que identifica la sesión, y lo que hace falta saber cuando
    // «no reanuda y no sé por qué».
    this.log.debug('identificador de sesión leído', { presente: !!token });
    return token ?? null;
  }

  async save(token: string): Promise<void> {
    await this.store.put({ id: RECORD_ID, token });
    this.log.debug('identificador de sesión guardado');
  }

  async clear(): Promise<void> {
    await this.store.delete(RECORD_ID);
    this.log.debug('identificador de sesión borrado');
  }
}
