import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EventBus } from '../../../_common/eventbus/event-bus';
import { Logger } from '../../../_common/logger/logger';
import { AuthEvents } from '../../domain/events/auth-events';
import { Authenticator } from '../../domain/services/authenticator';
import { Session } from '../../domain/services/session';

/**
 * Cierra la sesión y deja la app como si nunca hubiera habido cuenta.
 *
 * **La sesión local se cierra pase lo que pase.** Si falla retirar la autorización en el proveedor
 * (típicamente, sin red), no se deja al usuario atrapado en su cuenta: se cierra igual y se publica
 * `SignOutFailed` en vez de `SignOutSucceeded`. Por eso quien limpie estado al salir tiene que
 * escuchar los dos eventos.
 */
@Injectable({ providedIn: 'root' })
export class SignOut extends UseCase<void, void> {
  private readonly authenticator = inject(Authenticator);
  private readonly session = inject(Session);
  private readonly bus = inject(EventBus);
  private readonly log = inject(Logger).scoped('auth/sign-out');

  async execute(): Promise<void> {
    const { account, credential } = this.session.snapshot();
    if (!account) {
      this.log.debug('no había sesión abierta, no se hace nada');
      return;
    }
    this.log.debug('cerrando sesión', { accountId: account.id.value, conCredencial: !!credential });

    let failure: string | null = null;
    if (credential) {
      try {
        await this.authenticator.revoke(credential);
        this.log.debug('autorización retirada en el proveedor');
      } catch (error) {
        failure = error instanceof Error ? error.message : 'Motivo desconocido.';
        // Nadie más va a contar esto: no se relanza (la sesión local se cierra igual) y el usuario
        // se cree desconectado del todo cuando el proveedor aún tiene la autorización.
        this.log.warn(
          'no se pudo retirar la autorización: la sesión local se cierra igual',
          error,
          {
            accountId: account.id.value,
          },
        );
      }
    }

    this.session.close();
    const { epoch } = this.session.snapshot();
    this.log.debug('sesión cerrada', { accountId: account.id.value, epoch, revocada: !failure });

    await this.bus.publish([
      failure === null
        ? AuthEvents.signOutSucceeded(account.id.value, epoch)
        : AuthEvents.signOutFailed(account.id.value, epoch, failure),
    ]);
  }
}
