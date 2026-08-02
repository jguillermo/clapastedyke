import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EventBus } from '../../../_common/eventbus/event-bus';
import { Logger } from '../../../_common/logger/logger';
import { AuthEvents } from '../../domain/events/auth-events';
import { AuthSettingsRepository } from '../../domain/repositories/auth-settings.repository';
import { Authenticator } from '../../domain/services/authenticator';
import { Session } from '../../domain/services/session';

export interface SignInResult {
  email: string;
  displayName: string;
}

/**
 * Inicia sesión.
 *
 * Orquesta tres pasos y ninguna regla propia: leer el `clientId` configurado, pedir la
 * autenticación al proveedor y abrir la sesión. Publique lo que publique, **siempre sale un
 * evento**: `AuthenticationSucceeded` o `AuthenticationFailed`.
 *
 * El error se relanza además del evento, porque quien pulsó el botón necesita ver el motivo.
 */
@Injectable({ providedIn: 'root' })
export class SignIn extends UseCase<void, SignInResult> {
  private readonly authenticator = inject(Authenticator);
  private readonly session = inject(Session);
  private readonly settings = inject(AuthSettingsRepository);
  private readonly bus = inject(EventBus);
  private readonly log = inject(Logger).scoped('auth/sign-in');

  async execute(): Promise<SignInResult> {
    this.log.debug('ejecutando');
    try {
      const clientId = await this.settings.clientId();
      if (!clientId) {
        this.log.debug('sin identificador de cliente configurado, no se puede autenticar');
        throw new Error(
          'Falta el identificador de cliente. Pégalo en esta pantalla (ver appscript.md, paso 4).',
        );
      }

      this.log.debug('pidiendo autenticación al proveedor');
      const { account, credential } = await this.authenticator.authenticate(clientId);
      this.session.open(account, credential);

      const { epoch } = this.session.snapshot();
      await this.bus.publish([
        AuthEvents.authenticationSucceeded(account.id.value, account.email, epoch),
      ]);

      // El id, nunca el correo: el correo es un dato personal y no va a un registro.
      this.log.debug('sesión abierta', { accountId: account.id.value, epoch });
      return { email: account.email, displayName: account.displayName };
    } catch (error) {
      // No se registra como fallo: se relanza, y quien decide qué ve el usuario lo registra una
      // sola vez con la cadena entera. Aquí solo queda constancia de que se tomó esta rama.
      this.log.debug('autenticación fallida, se publica el evento y se relanza');
      await this.bus.publish([AuthEvents.authenticationFailed(reasonOf(error))]);
      throw error;
    }
  }
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Motivo desconocido.';
}
