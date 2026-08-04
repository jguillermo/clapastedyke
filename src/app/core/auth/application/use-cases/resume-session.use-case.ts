import { inject, Injectable } from '@angular/core';
import { EventBus } from '@core/_common/eventbus/event-bus';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { AuthEvents } from '../../domain/events/auth-events';
import { AuthSettingsRepository } from '../../domain/repositories/auth-settings.repository';
import { SessionHintRepository } from '../../domain/repositories/session-hint.repository';
import { Authentication, Authenticator } from '../../domain/services/authenticator';
import { Session } from '../../domain/services/session';

export interface ResumeSessionResult {
  /** `true` si al terminar hay una sesión utilizable, se acabe de recuperar o ya la hubiera. */
  active: boolean;
}

/**
 * Se asegura de que haya una sesión utilizable, **sin pedirle nada al usuario**.
 *
 * ## Por qué existe
 *
 * La credencial vive solo en memoria, y eso no se negocia: un token en disco lo puede leer cualquier
 * XSS mientras dure. Pero las dos consecuencias eran inaceptables —recargar te echaba, y a la hora te
 * echaba otra vez— y guardar el token solo habría tapado la primera: **caduca en una hora igual**, y
 * un cliente de navegador no puede tener refresh token.
 *
 * La salida es no guardar el token sino **volver a pedirlo**. Si esa persona ya dio su consentimiento
 * y sigue con su sesión abierta en el proveedor, este emite uno nuevo sin enseñar nada.
 *
 * ## Dos situaciones, un solo camino
 *
 * | Al empezar | Qué hace | Publica |
 * |---|---|---|
 * | No hay sesión (se recargó la página) | abre una | `SessionResumed` |
 * | Hay sesión pero su credencial caduca | **la renueva sin tocar el `epoch`** | nada |
 * | Hay sesión y su credencial vale | nada | nada |
 *
 * **Renovar no publica nada, y es deliberado.** Para todo lo que hay fuera no ha cambiado nada: la
 * misma persona, la misma sesión, el mismo número de sesión. Un evento ahí solo conseguiría disparar
 * sincronizaciones cada hora sin motivo. Volver, en cambio, sí es un hecho — y ni siquiera es
 * `AuthenticationSucceeded`: ver la factoría del evento.
 *
 * **Nunca lanza.** No poder reanudar es el estado normal de quien entra por primera vez.
 */
@Injectable({ providedIn: 'root' })
export class ResumeSession extends UseCase<void, ResumeSessionResult> {
  private readonly authenticator = inject(Authenticator);
  private readonly session = inject(Session);
  private readonly settings = inject(AuthSettingsRepository);
  private readonly hints = inject(SessionHintRepository);
  private readonly bus = inject(EventBus);
  private readonly log = inject(Logger).scoped('auth/resume-session');

  /** El intento en curso, mientras dura. Ver `execute`. */
  private attempt: Promise<ResumeSessionResult> | null = null;

  /**
   * **Un intento a la vez.** Cuando un token caduca, todo lo que estuviera usándolo lo descubre a la
   * vez: la sincronización, la pantalla, el envío pendiente. Sin esto, cada uno le pediría su propio
   * token al proveedor — varias peticiones invisibles compitiendo, y credenciales tiradas a la
   * basura. Quien llega mientras hay uno en marcha comparte su resultado.
   */
  execute(): Promise<ResumeSessionResult> {
    const running = this.attempt;
    if (running) {
      return running;
    }

    const attempt = this.perform();
    this.attempt = attempt;
    // Las dos ramas, para que este `then` no deje nunca un rechazo sin dueño. (`perform` no puede
    // rechazar —absorbe todo—, pero eso es una garantía suya, no de este método.)
    void attempt.then(
      () => this.forget(attempt),
      () => this.forget(attempt),
    );
    return attempt;
  }

  private forget(attempt: Promise<ResumeSessionResult>): void {
    if (this.attempt === attempt) {
      this.attempt = null;
    }
  }

  private async perform(): Promise<ResumeSessionResult> {
    try {
      const { account, credential } = this.session.snapshot();
      const renewing = account !== null;

      if (credential && !credential.isExpired(Date.now())) {
        return { active: true };
      }
      this.log.debug(renewing ? 'la credencial caduca, se renueva' : 'no hay sesión, se reanuda');

      const authentication = await this.silently();
      if (!authentication) {
        return { active: false };
      }

      if (renewing) {
        // Misma persona, mismo `epoch`: nada de lo que hay en vuelo debe enterarse.
        this.session.renew(authentication.credential);
        this.log.debug('credencial renovada', { accountId: authentication.account.id.value });
        return { active: true };
      }

      this.session.open(authentication.account, authentication.credential);
      const { epoch } = this.session.snapshot();
      await this.bus.publish([AuthEvents.sessionResumed(authentication.account.id.value, epoch)]);

      this.log.debug('sesión reanudada', { accountId: authentication.account.id.value, epoch });
      return { active: true };
    } catch (error) {
      // Corre al arrancar la app y en mitad de otras operaciones, y nadie espera que pueda romper
      // nada: si no se absorbiera aquí, sería un rechazo suelto y la app se quedaría sin sesión sin
      // decir por qué.
      this.log.warn('no se pudo recuperar la sesión, hará falta conectar a mano', error);
      return { active: false };
    }
  }

  /** El intento silencioso: sin pista o sin configuración, ni se molesta al proveedor. */
  private async silently(): Promise<Authentication | null> {
    const hint = await this.hints.read();
    if (!hint) {
      this.log.debug('no hay pista: nadie había entrado en este navegador');
      return null;
    }

    const clientId = await this.settings.clientId();
    if (!clientId) {
      this.log.debug('sin identificador de cliente configurado, no se puede reanudar');
      return null;
    }

    const authentication = await this.authenticator.resume(clientId, hint.email);
    if (!authentication) {
      this.log.debug('el proveedor no ha reanudado: hará falta conectar a mano');
    }
    return authentication;
  }
}
