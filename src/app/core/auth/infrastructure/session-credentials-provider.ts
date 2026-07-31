import { inject, Injectable } from '@angular/core';
import {
  CredentialsProvider,
  UserCredentials,
} from '@core/_common/credentials/credentials-provider';
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

  async current(): Promise<UserCredentials | null> {
    const { account, credential, epoch } = this.session.snapshot();
    if (!account || !credential || credential.isExpired(Date.now())) {
      return null;
    }
    return { token: credential.token, epoch, accountEmail: account.email };
  }
}
