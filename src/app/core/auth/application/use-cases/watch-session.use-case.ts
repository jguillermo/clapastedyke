import { computed, inject, Injectable, Signal } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { Session } from '../../domain/services/session';

export interface SessionView {
  connected: boolean;
  email: string;
  displayName: string;
  pictureUrl: string | null;
}

const DISCONNECTED: SessionView = {
  connected: false,
  email: '',
  displayName: '',
  pictureUrl: null,
};

/**
 * Proyecta la sesión para la UI.
 *
 * Además de `execute()` expone `state`, una **signal** que la vista lee en su plantilla. Es lo que
 * permite que una feature siga inyectando solo casos de uso —nunca la sesión, que es un servicio de
 * dominio— y aun así ser reactiva. La credencial no sale por aquí: para eso está `GetCredentials`.
 */
@Injectable({ providedIn: 'root' })
export class WatchSession extends UseCase<void, SessionView> {
  private readonly session = inject(Session);

  readonly state: Signal<SessionView> = computed(() => {
    const account = this.session.snapshot().account;
    if (!account) {
      return DISCONNECTED;
    }
    return {
      connected: true,
      email: account.email,
      displayName: account.displayName,
      pictureUrl: account.pictureUrl,
    };
  });

  async execute(): Promise<SessionView> {
    return this.state();
  }
}
