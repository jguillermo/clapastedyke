import { inject, Injectable } from '@angular/core';
import { AccountHistory } from '@core/_common/credentials/account-history';
import { Logger } from '@core/_common/logger/logger';
import { SessionHintRepository } from '../domain/repositories/session-hint.repository';

/**
 * Contesta «¿hubo cuenta aquí?» con la **pista de sesión**, que es justo el rastro que queda de eso: se
 * escribe al entrar y se borra al cerrar sesión.
 *
 * No hace ninguna llamada de red y no le importa si hay cobertura: la pista está en IndexedDB. Y no
 * expone el correo ni nada de la cuenta — solo si hay algo.
 */
@Injectable()
export class SessionHintAccountHistory extends AccountHistory {
  private readonly hints = inject(SessionHintRepository);
  private readonly log = inject(Logger).scoped('auth/account-history');

  async everConnected(): Promise<boolean> {
    try {
      const connected = (await this.hints.read()) !== null;
      this.log.debug('historial de cuenta consultado', { connected });
      return connected;
    } catch (error) {
      // Si la pista no se puede leer, se contesta que **sí** hubo cuenta. Es la respuesta prudente: en
      // la duda, no sembrar. Sembrar de más mete datos de ejemplo en el catálogo de alguien —y de ahí a
      // su hoja—; no sembrar solo deja la app vacía, que se arregla usándola.
      this.log.warn('no se pudo leer el historial de cuenta; se asume que hubo una', error);
      return true;
    }
  }
}
