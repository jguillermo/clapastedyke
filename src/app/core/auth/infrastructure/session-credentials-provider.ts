import { inject, Injectable } from '@angular/core';
import {
  CredentialsProvider,
  UserCredentials,
} from '@core/_common/credentials/credentials-provider';
import { Logger } from '@core/_common/logger/logger';
import { Session } from '../domain/services/session';

/**
 * Adaptador de salida de `auth` hacia el contrato `CredentialsProvider` del shared kernel.
 *
 * Es lo que permite que otro contexto actúe en nombre del usuario **sin conocer este**: entrega los
 * primitivos justos (credencial, número de sesión y correo) y nunca la sesión ni sus value objects.
 *
 * Una credencial caducada se trata como «no hay sesión»: quien la fuera a usar solo puede fallar.
 */
@Injectable()
export class SessionCredentialsProvider extends CredentialsProvider {
  private readonly session = inject(Session);
  private readonly log = inject(Logger).scoped('auth/credentials');

  async current(): Promise<UserCredentials | null> {
    const { account, credential, epoch } = this.session.snapshot();
    // Quien pregunta solo ve `null` y lo trata como «desconectado». Distinguir POR QUÉ es la
    // diferencia entre «no ha entrado» y «se le caducó el token», que se arreglan distinto.
    if (!account || !credential) {
      this.log.debug('sin sesión abierta');
      return null;
    }
    if (credential.isExpired(Date.now())) {
      this.log.debug('credencial caducada, se trata como si no hubiera sesión', {
        accountId: account.id.value,
        epoch,
      });
      return null;
    }
    this.log.debug('credencial vigente', { accountId: account.id.value, epoch });
    return { token: credential.token, epoch, accountEmail: account.email };
  }
}
