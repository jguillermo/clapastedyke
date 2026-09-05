import { inject, Injectable } from '@angular/core';
import { EventBus } from '@core/_common/eventbus/event-bus';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { Account } from '../../domain/entities/account';
import { AuthEvents } from '../../domain/events/auth-events';
import {
  SessionHint,
  SessionHintRepository,
} from '../../domain/repositories/session-hint.repository';
import { SessionTokenRepository } from '../../domain/repositories/session-token.repository';
import { Authenticator, ResumeOutcome } from '../../domain/services/authenticator';
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
 * echaba otra vez— y guardar el token solo habría tapado la primera: **caduca en una hora igual**.
 *
 * La salida es no guardar el token sino **volver a pedirlo** al servicio de sesión, que sí custodia
 * el permiso duradero. Ni ventana, ni gesto, ni script de Google.
 *
 * ## Las cinco situaciones
 *
 * | Al empezar | Qué hace | Publica |
 * |---|---|---|
 * | La credencial en memoria todavía vale | nada | — |
 * | No hay pista: nadie entró nunca aquí | nada, **ni una petición de red** | — |
 * | Hay pista y el proveedor responde | abre o renueva la sesión | `SessionResumed`, si pasa a ser usable |
 * | Hay pista y no se puede preguntar | deja la sesión **sin conexión** | — |
 * | El proveedor dice que la sesión ya no vale | la cierra y borra su rastro | — |
 *
 * **La sesión sin conexión se abre ANTES de tocar la red**, en cuanto se lee la pista. Es lo que
 * evita que quien recarga vea «Conectar con Google» durante las décimas que tarda la respuesta —o
 * para siempre, si no hay cobertura— teniendo la sesión perfectamente viva.
 *
 * **Renovar no publica nada, y es deliberado.** Para todo lo que hay fuera no ha cambiado nada: la
 * misma persona, la misma sesión, el mismo número de sesión. Un evento ahí solo conseguiría disparar
 * sincronizaciones cada hora sin motivo. Pasar de sin conexión a conectado sí se publica: hasta ese
 * momento no se podía sincronizar, y quien sincroniza tiene que enterarse.
 *
 * **Que la sesión ya no valga NO publica un evento de cierre**, aunque lo parezca. Quien escucha esos
 * eventos vacía la cola de sincronización, y ahí dentro hay cambios que el usuario nunca llegó a
 * subir: se perderían por una caducidad que él no provocó. Cerrar sesión es una decisión suya, y solo
 * `SignOut` la anuncia.
 *
 * **Nunca lanza.** No poder reanudar es el estado normal de quien entra por primera vez.
 */
@Injectable({ providedIn: 'root' })
export class ResumeSession extends UseCase<void, ResumeSessionResult> {
  private readonly authenticator = inject(Authenticator);
  private readonly session = inject(Session);
  private readonly hints = inject(SessionHintRepository);
  private readonly sessionTokens = inject(SessionTokenRepository);
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
      const credential = this.session.snapshot().credential;
      if (credential && !credential.isExpired(Date.now())) {
        return { active: true };
      }

      const hint = await this.hints.read();
      if (!hint) {
        this.log.debug('no hay pista: nadie había entrado en este navegador');
        return { active: false };
      }

      this.showKnownSessionWhileAsking(hint);

      return await this.applyOutcome(await this.authenticator.resume());
    } catch (error) {
      // Corre al arrancar la app y en mitad de otras operaciones, y nadie espera que pueda romper
      // nada: si no se absorbiera aquí, sería un rechazo suelto y la app se quedaría sin sesión sin
      // decir por qué.
      this.log.warn('no se pudo recuperar la sesión, hará falta conectar a mano', error);
      return { active: false };
    }
  }

  /**
   * La sesión se abre sin conexión antes de preguntar por ella, porque la pista ya dice de quién es.
   * Lo que se gana no es velocidad: es que nadie llegue a ver ofrecida una conexión que ya tiene.
   */
  private showKnownSessionWhileAsking(hint: SessionHint): void {
    if (this.session.snapshot().account) {
      return;
    }
    this.session.openOffline(Account.of(hint.accountId, hint.email));
    this.log.debug('sesión conocida, todavía sin conexión', { accountId: hint.accountId });
  }

  private async applyOutcome(outcome: ResumeOutcome): Promise<ResumeSessionResult> {
    if (outcome.kind === 'unreachable') {
      this.log.debug('sin respuesta del proveedor: la sesión se queda sin conexión');
      return { active: false };
    }

    if (outcome.kind === 'invalid') {
      await this.forgetSession();
      return { active: false };
    }

    const { account, credential } = outcome.authentication;

    if (this.session.snapshot().credential) {
      this.session.renew(credential);
      this.log.debug('credencial renovada', { accountId: account.id.value });
      return { active: true };
    }

    // La sesión pasa a ser usable, así que **se abre con la cuenta que acaba de llegar**, no se le
    // renueva la credencial a la que hubiera. La de una sesión sin conexión es un esbozo armado con
    // la pista —identidad y correo, sin nombre ni avatar—, y renovar solo la credencial lo dejaría
    // ahí para siempre: la pantalla enseñaría el correo en lugar del nombre de la persona.
    this.session.open(account, credential);
    const { epoch } = this.session.snapshot();
    await this.bus.publish([AuthEvents.sessionResumed(account.id.value, epoch)]);
    this.log.debug('sesión reanudada', { accountId: account.id.value, epoch });
    return { active: true };
  }

  /**
   * El proveedor ha dicho que esta sesión ya no vale. Se borra su rastro —si no, cada arranque
   * volvería a preguntar lo mismo— pero **no los datos del usuario**: el recetario es suyo, no de la
   * sesión, y vuelve a subir en cuanto conecte otra vez.
   */
  private async forgetSession(): Promise<void> {
    this.session.close();
    await this.hints.clear();
    await this.sessionTokens.clear();
    this.log.debug('el proveedor no reconoce esta sesión: hará falta conectar a mano');
  }
}
