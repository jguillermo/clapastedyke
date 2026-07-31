import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EventBus } from '../../../_common/eventbus/event-bus';
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

  async execute(): Promise<void> {
    const { account, credential } = this.session.snapshot();
    if (!account) {
      return;
    }

    let failure: string | null = null;
    if (credential) {
      try {
        await this.authenticator.revoke(credential);
      } catch (error) {
        failure = error instanceof Error ? error.message : 'Motivo desconocido.';
      }
    }

    this.session.close();
    const { epoch } = this.session.snapshot();

    await this.bus.publish([
      failure === null
        ? AuthEvents.signOutSucceeded(account.id.value, epoch)
        : AuthEvents.signOutFailed(account.id.value, epoch, failure),
    ]);
  }
}
