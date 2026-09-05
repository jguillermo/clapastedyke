import { computed, inject, Injectable, Signal } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { phaseOf, Session, SessionPhase } from '../../domain/services/session';

export interface SessionView {
  phase: SessionPhase;
  email: string;
  displayName: string;
  pictureUrl: string | null;
}

/**
 * Una sesión sin conexión dice que la hay, y **no dice de quién**.
 *
 * Lo que se guarda en este navegador para poder reanudar es una pista, no un perfil: nombre y avatar
 * vienen del servicio de sesión, así que sin conexión no existen. Enseñar el correo a medias —lo
 * único que sí está guardado— sería peor que no enseñar nada: parecería la sesión completa.
 */
const ANONYMOUS = { email: '', displayName: '', pictureUrl: null } as const;

/**
 * Proyecta la sesión para la UI.
 *
 * Además de `execute()` expone `state`, una **signal** que la vista lee en su plantilla. Es lo que
 * permite que una feature siga inyectando solo casos de uso —nunca la sesión, que es un servicio de
 * dominio— y aun así ser reactiva. La credencial no sale por aquí: para eso está el proveedor de
 * credenciales del shared kernel.
 *
 * Devuelve la **fase**, no un booleano de «conectado», porque las tres situaciones piden cosas
 * distintas de la pantalla: sin sesión se ofrece conectar, sin conexión se explica que hay que
 * esperar, y con sesión se opera.
 */
@Injectable({ providedIn: 'root' })
export class WatchSession extends UseCase<void, SessionView> {
  private readonly session = inject(Session);

  readonly state: Signal<SessionView> = computed(() => {
    const snapshot = this.session.snapshot();
    const phase = phaseOf(snapshot);
    const account = snapshot.account;

    if (phase !== 'active' || !account) {
      return { phase, ...ANONYMOUS };
    }
    return {
      phase,
      email: account.email,
      displayName: account.displayName,
      pictureUrl: account.pictureUrl,
    };
  });

  async execute(): Promise<SessionView> {
    return this.state();
  }
}
