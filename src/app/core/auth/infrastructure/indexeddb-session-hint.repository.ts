import { inject, Injectable } from '@angular/core';
import { IndexedDbStore } from '@core/_common/infrastructure/indexeddb/store';
import { Logger } from '@core/_common/logger/logger';
import { SessionHint, SessionHintRepository } from '../domain/repositories/session-hint.repository';

/** Documento plano. Clave fija: solo hay una sesión reanudable por navegador. */
interface SessionHintRecord {
  id: string;
  accountId?: string;
  email?: string;
}

const RECORD_ID = 'session';

/**
 * La pista de sesión, en IndexedDB.
 *
 * Aquí **no hay ninguna credencial**: solo con qué cuenta se estaba. Quien pueda leer este store no
 * gana acceso a nada — para reanudar hace falta la sesión de Google del propio navegador, que no
 * está aquí.
 *
 * Legado: un registro sin `accountId` o sin `email` es de una versión anterior y **se ignora**; la
 * app arranca sin sesión y el usuario conecta a mano, que es exactamente lo que pasaba antes.
 */
@Injectable()
export class IndexedDbSessionHintRepository extends SessionHintRepository {
  private readonly store = new IndexedDbStore<SessionHintRecord>('auth_session_hint');
  private readonly log = inject(Logger).scoped('auth/session-hint-repo');

  async read(): Promise<SessionHint | null> {
    const record = await this.store.get(RECORD_ID);
    if (!record?.accountId || !record.email) {
      return null;
    }
    // El correo NO: es un dato personal. Solo si hay pista y de qué cuenta.
    this.log.debug('pista de sesión leída', { accountId: record.accountId });
    return { accountId: record.accountId, email: record.email };
  }

  async save(hint: SessionHint): Promise<void> {
    await this.store.put({ id: RECORD_ID, accountId: hint.accountId, email: hint.email });
    this.log.debug('pista de sesión guardada', { accountId: hint.accountId });
  }

  async clear(): Promise<void> {
    await this.store.delete(RECORD_ID);
    this.log.debug('pista de sesión borrada');
  }
}
